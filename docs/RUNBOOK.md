# CSIBER AQAR — Deployment & Operations Runbook

For whoever installs and maintains this system. It covers installation on a
college server, moving the existing data across, day-to-day operations, and
what to do when something looks wrong.

---

## 1. What this is, and its one hard constraint

A Next.js application storing everything in **SQLite** plus a folder of
uploaded files. It must run as **exactly one always-on Node process with a
persistent disk.**

**Do not deploy this to Vercel, Netlify, Cloudflare Workers, AWS Lambda or any
serverless platform.** Five independent reasons: the app creates its data
directory on first request (serverless filesystems are read-only), `/tmp` is
wiped between invocations, concurrent function instances would be multiple
SQLite writers, WAL journalling needs real file locking, and `better-sqlite3`
is a compiled native binary.

**Do not run more than one instance.** No `replicas`, no PM2 cluster mode, no
load-balanced pair. A second writer corrupts the database. If the institution
ever outgrows one process, the migration path is PostgreSQL — the SQL is
deliberately portable — not horizontal scaling.

| Requirement | Value |
|---|---|
| Node.js | 20 LTS |
| Disk | 5 GB to start; grows with uploaded evidence |
| Memory | 1 GB minimum, 2 GB comfortable |
| Ports | 3000 on localhost; 80/443 public via nginx |
| Users | Around 20–50 accounts; a handful concurrent |

---

## 2. Install — Path A: Docker (recommended)

Docker removes the two most common failure modes: the native module build and
the working-directory trap.

```bash
sudo mkdir -p /opt/aqar && cd /opt/aqar
# copy the application here (git clone, or an archive)

cp .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# paste the value into AQAR_SECRET in .env, and set APP_ORIGIN
chmod 600 .env

mkdir -p data
docker compose up -d --build
docker compose logs -f app        # confirm it started
```

Then set up nginx and TLS (section 4), and create the accounts (section 6).

## 3. Install — Path B: systemd or PM2 (no Docker)

```bash
sudo useradd --system --home /opt/aqar --shell /usr/sbin/nologin aqar
sudo mkdir -p /opt/aqar /etc/aqar /var/log/aqar
cd /opt/aqar
# copy the application here

sudo -u aqar npm ci                # compiles better-sqlite3; needs python3, make, g++
sudo -u aqar npm run build

sudo cp .env.example /etc/aqar/aqar.env
sudo nano /etc/aqar/aqar.env       # set AQAR_SECRET, APP_ORIGIN, AQAR_DATA_DIR=/opt/aqar/data
sudo chmod 600 /etc/aqar/aqar.env
sudo chown aqar:aqar /etc/aqar/aqar.env

sudo mkdir -p /opt/aqar/data && sudo chown -R aqar:aqar /opt/aqar
sudo cp deploy/systemd/aqar.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now aqar
sudo systemctl status aqar
```

> **⚠️ The working directory matters.** The application resolves its data
> folder relative to the process working directory unless `AQAR_DATA_DIR` is
> set. If either is wrong, the app starts normally, creates a **new empty
> database somewhere else**, and looks exactly as though it has lost all its
> data. The provided unit file pins both — do not remove `WorkingDirectory` or
> `Environment=AQAR_DATA_DIR`.

PM2 alternative: `pm2 start deploy/pm2/ecosystem.config.js` (keep
`instances: 1`, `exec_mode: 'fork'`).

---

## 4. TLS and the reverse proxy

```bash
sudo cp deploy/nginx/aqar.conf /etc/nginx/sites-available/aqar.conf
sudo nano /etc/nginx/sites-available/aqar.conf     # set the real server_name
sudo ln -s /etc/nginx/sites-available/aqar.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d aqar.siberindia.edu.in
sudo systemctl status certbot.timer                 # auto-renewal
```

The supplied config already sets `client_max_body_size 55m` (evidence uploads),
a 300s proxy timeout (document generation over 117 metrics), the
`X-Forwarded-*` headers the app needs for per-IP login throttling, and HSTS.

---

## 5. Moving the existing data from the Windows machine

The development database contains real structure and must be carried over
carefully. **Stop the application first** — copying a live SQLite file can
capture a torn state.

On the Windows machine:

```bash
# 1. Stop any running dev/production server.
# 2. Take a consistent snapshot (NOT a plain file copy — WAL mode).
npm run backup -- ./handover
```

Copy `handover/aqar.db`, `handover/uploads/` and `handover/generated/` to the
server, then:

```bash
# Docker
sudo cp -r handover/aqar.db handover/uploads handover/generated /opt/aqar/data/
sudo chown -R 1000:1000 /opt/aqar/data          # the `node` user inside the image
docker compose exec app npm run migrate
docker compose exec app npm run seed

# systemd
sudo cp -r handover/* /opt/aqar/data/
sudo chown -R aqar:aqar /opt/aqar/data
sudo -u aqar npm run migrate
sudo -u aqar npm run seed
```

`npm run migrate` is what makes the copied database usable on Linux. It
widens the account roles to the four-role hierarchy and — importantly —
rewrites the stored paths of previously generated documents. Those were
recorded as absolute Windows paths (`D:\NAAC-Report\data\generated\…`), which
mean nothing on this server; without the migration every existing document
download returns *"file is missing on disk"*.

Finally, **verify a download works** before declaring the move done.

---

## 6. First run

1. Sign in as the Administrator.
2. **Administration → Schools**: add each school.
3. Sign in as the **Head of IQAC** → create the academic year (e.g. `2025-26`).
4. Administrator: create Criterion Coordinator and School Representative
   accounts. They are created **pending**.
5. Head of IQAC: **approve** each account and assign its criteria (and school,
   for representatives). Nobody can sign in until approved.
6. **Change both seeded passwords** in Administration. This system is now
   reachable from the internet.

### The roles

| Role | Can do |
|---|---|
| Administrator | Everything, plus create/edit/delete accounts, schools, academic years |
| Head of IQAC | All AQAR data, approve accounts, assign criteria, finalise the year, generate the FINAL document |
| Criterion Coordinator | Edit only the criteria assigned to them; generate drafts; resolve change requests on their criteria |
| School Representative | Contribute data and evidence for their own school only; raise change requests |

---

## 7. Backups

```bash
sudo mkdir -p /var/log/aqar
sudo cp deploy/backup/aqar-backup.cron /etc/cron.d/aqar-backup
```

Everything worth keeping is in one folder — the database, uploaded evidence and
generated documents. `npm run backup` snapshots it consistently and prunes
copies older than 30 days.

**Copy backups off this machine.** A backup on the same disk does not survive
the failure it exists for. Uncomment the rsync line in the cron file.

### Restore drill — do this once, before you need it

A backup you have never restored is a hope, not a backup.

```bash
# On a scratch directory, never the live one:
mkdir -p /tmp/restore-test
cp /srv/aqar-backups/<timestamp>/aqar.db /tmp/restore-test/
cp -r /srv/aqar-backups/<timestamp>/uploads /tmp/restore-test/
AQAR_DATA_DIR=/tmp/restore-test AQAR_SECRET=$(node -e "console.log('x'.repeat(40))") \
  npm run migrate
# Expect the account list to print. Then sign in against it if you want the
# full check, and delete /tmp/restore-test afterwards.
```

---

## 8. Routine operations

```bash
# Logs
docker compose logs -f app                 # Docker
sudo journalctl -u aqar -f                 # systemd

# Restart
docker compose restart app
sudo systemctl restart aqar

# Update to a new version
cd /opt/aqar && git pull
docker compose up -d --build               # Docker
sudo -u aqar npm ci && sudo -u aqar npm run build && sudo systemctl restart aqar
```

Migrations run automatically at startup, and are safe to re-run.

### Reviewing sign-in activity

Failed logins are recorded. To check for someone trying to guess passwords:

```bash
sqlite3 /opt/aqar/data/aqar.db \
  "SELECT at, action, detail FROM audit_log
    WHERE action LIKE 'login%' ORDER BY at DESC LIMIT 50;"
```

`login_failed` is a wrong password; `login_rate_limited` means the throttle
engaged (5 failures per email or 20 per IP in 15 minutes triggers a 15-minute
lockout); `login_denied_pending` is an unapproved account.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **"Refusing to start… AQAR_SECRET"** | The signing secret is unset or under 32 characters. Deliberate — without it, sessions could be forged. | Set `AQAR_SECRET` in `.env` or `/etc/aqar/aqar.env`, then restart. |
| **All data appears to be gone** | Wrong working directory: the app created a fresh empty database elsewhere. | Check `AQAR_DATA_DIR` and `WorkingDirectory`. Find the stray file with `find / -name aqar.db 2>/dev/null`. **Do not re-seed** before checking. |
| **"Generated file is missing on disk"** | Documents recorded with absolute Windows paths. | `npm run migrate`. |
| **413 on evidence upload** | nginx body limit. | Confirm `client_max_body_size 55m` and reload nginx. |
| **Timeout when generating the AQAR** | Generation exceeds the proxy timeout. | Confirm `proxy_read_timeout 300s`. |
| **`SQLITE_BUSY` / database is locked** | Two processes on one database. | Ensure only one instance runs — no PM2 cluster mode, no second container. |
| **Account cannot sign in: "awaiting approval"** | Working as designed. | The Head of IQAC approves it in Administration. |
| **Someone's role change did nothing** | Should not happen — roles are re-read on every request. | If it persists, confirm you edited the account you meant to. |
| **Cannot log in after a restart** | `AQAR_SECRET` changed, invalidating sessions. | Expected. Sign in again. |
| **`npm ci` fails on better-sqlite3** | No compiler toolchain. | `sudo apt install python3 make g++`, or use the Docker path. |

---

## 10. Notes for developers

- `.claude/launch.json` is a Claude Code editor convenience, not deployment
  configuration. Ignore it.
- `scripts/dev/sample-data.ts` inserts fabricated demonstration data. It
  refuses to run in production, requires `AQAR_ALLOW_SAMPLE_DATA=1`, and is
  excluded from the Docker image. Never run it against the live database.
- `npm run reset:data -- --yes` empties all AQAR content while keeping
  accounts. Destructive and irreversible — take a backup first.
- Never run `npm run dev` and `npm start` from the same folder simultaneously;
  they share `.next` and will corrupt each other's build.
