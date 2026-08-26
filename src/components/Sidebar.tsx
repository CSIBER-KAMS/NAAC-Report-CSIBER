'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AuthUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import {
  ROLE_LABEL,
  ROLE_PORTAL,
  ROLE_THEME,
  CRITERION_SCOPED,
  criterionLabel,
} from '@/lib/roles';

const CRITERIA_TITLES: Record<number, string> = {
  0: 'Extended Profile',
  1: 'Curricular Aspects',
  2: 'Teaching-Learning & Evaluation',
  3: 'Research, Innovations & Extension',
  4: 'Infrastructure & Learning Resources',
  5: 'Student Support & Progression',
  6: 'Governance, Leadership & Management',
  7: 'Institutional Values & Best Practices',
};

export default function Sidebar({
  year,
  user,
}: {
  year: string;
  user: AuthUser;
}) {
  const pathname = usePathname();
  const base = `/y/${year}`;
  const theme = ROLE_THEME[user.role];
  const scoped = CRITERION_SCOPED.has(user.role);

  // A scoped user sees only their own criteria in the nav; unscoped roles see
  // all of them. Hiding what someone cannot edit is what makes the four
  // portals feel genuinely different rather than one portal with grey buttons.
  const criteriaToShow = scoped
    ? [...user.criteria].sort((a, b) => a - b)
    : [0, 1, 2, 3, 4, 5, 6, 7];

  const items: { href: string; label: string }[] = [
    { href: base, label: 'Dashboard' },
  ];

  if (can(user, 'partA:edit')) {
    items.push({ href: `${base}/part-a`, label: 'Part A — Institution Data' });
  }

  for (const n of criteriaToShow) {
    items.push({
      href: `${base}/c/${n}`,
      label: n === 0 ? 'Extended Profile' : `Criterion ${n} — ${CRITERIA_TITLES[n]}`,
    });
  }

  items.push({ href: `${base}/review`, label: 'Review / Change Requests' });
  items.push({ href: `${base}/checklist`, label: 'Portal Checklist' });

  if (can(user, 'generate:draft')) {
    items.push({ href: `${base}/generate`, label: 'Generate AQAR' });
  }
  if (can(user, 'admin:access')) {
    items.push({ href: '/admin', label: 'Administration' });
  }

  function isActive(href: string): boolean {
    if (href === base) return pathname === base;
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Role-coloured bar: the four portals are distinguishable at a glance,
          before reading any text. */}
      <div className={`h-1.5 w-full ${theme.bar}`} />

      <div className="border-b border-slate-200 px-4 py-4">
        <div className="text-sm font-semibold text-brand-800">
          CSIBER AQAR System
        </div>
        <div className="mt-1.5">
          <span className={`badge ${theme.chip}`}>{ROLE_LABEL[user.role]}</span>
        </div>
        <div className="mt-2 text-xs font-medium text-slate-700">
          {ROLE_PORTAL[user.role]}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          Academic Year {year}
        </div>
        {scoped && (
          <div className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
            {user.schoolName && (
              <div className="truncate" title={user.schoolName}>
                {user.schoolName}
              </div>
            )}
            <div>
              {user.criteria.length === 0
                ? 'No criteria assigned'
                : user.criteria
                    .slice()
                    .sort((a, b) => a - b)
                    .map(criterionLabel)
                    .join(', ')}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm ${
              isActive(item.href)
                ? 'bg-brand-50 font-medium text-brand-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3 text-xs text-slate-500">
        <div className="font-medium text-slate-700">{user.name}</div>
        <div className="truncate" title={user.email}>
          {user.email}
        </div>
        <form action="/api/auth/logout" method="post" className="mt-2">
          <button className="text-xs text-slate-500 underline hover:text-slate-700">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
