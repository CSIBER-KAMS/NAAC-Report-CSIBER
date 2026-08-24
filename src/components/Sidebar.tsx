'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionUser } from '@/lib/auth';

const CRITERIA_TITLES: Record<number, string> = {
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
  user: SessionUser | null;
}) {
  const pathname = usePathname();
  const base = `/y/${year}`;
  const items: { href: string; label: string }[] = [
    { href: base, label: 'Dashboard' },
    { href: `${base}/part-a`, label: 'Part A — Institution Data' },
    { href: `${base}/c/0`, label: 'Extended Profile' },
    ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
      href: `${base}/c/${n}`,
      label: `Criterion ${n} — ${CRITERIA_TITLES[n]}`,
    })),
    { href: `${base}/review`, label: 'Review / Change Requests' },
    { href: `${base}/checklist`, label: 'Portal Checklist' },
    { href: `${base}/generate`, label: 'Generate AQAR' },
  ];
  if (user?.role === 'admin') {
    items.push({ href: '/admin', label: 'Administration' });
  }
  function isActive(href: string): boolean {
    if (href === base) return pathname === base;
    return pathname === href || pathname.startsWith(href + '/');
  }
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <div className="text-sm font-semibold text-brand-800">
          CSIBER AQAR System
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          Academic Year {year}
        </div>
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
        <div className="font-medium text-slate-700">{user?.name}</div>
        <div>{user?.email}</div>
        <form action="/api/auth/logout" method="post" className="mt-2">
          <button className="text-xs text-slate-500 underline hover:text-slate-700">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
