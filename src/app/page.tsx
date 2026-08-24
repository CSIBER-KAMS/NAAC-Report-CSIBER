import { redirect } from 'next/navigation';
import { listYears } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function Home() {
  const years = listYears();
  if (years.length === 0) {
    redirect('/admin');
  }
  redirect(`/y/${years[0].label}`);
}
