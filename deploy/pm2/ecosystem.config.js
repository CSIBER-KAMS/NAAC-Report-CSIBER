/**
 * CSIBER AQAR — PM2 configuration (alternative to systemd).
 *
 *   pm2 start deploy/pm2/ecosystem.config.js
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'aqar',

      // Pins the working directory. The application resolves its data
      // directory relative to cwd unless AQAR_DATA_DIR is set, so getting
      // this wrong makes the app appear to have lost all its data.
      cwd: '/opt/aqar',
      script: '.next/standalone/server.js',

      // MUST stay at one fork-mode instance. Cluster mode would run several
      // processes against one SQLite file — WAL tolerates a single writer —
      // and would also fragment the in-process login rate limiter.
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
        AQAR_DATA_DIR: '/opt/aqar/data',
        TRUSTED_PROXY: '1',
        // AQAR_SECRET and APP_ORIGIN come from the shell environment or a
        // PM2 env file — never commit them here.
      },

      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      max_memory_restart: '600M',

      out_file: '/var/log/aqar/out.log',
      error_file: '/var/log/aqar/error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
