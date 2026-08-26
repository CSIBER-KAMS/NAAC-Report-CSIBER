import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

/**
 * The sign-in page, and nothing else — no navigation, no shell, no hint of
 * the application behind it. Which portal you get is decided entirely by the
 * credentials submitted here.
 *
 * Any existing session is cleared by middleware before this renders, so
 * arriving at this page always means "signed out", never "signed in as
 * somebody else".
 */
export default function LoginPage({
  searchParams,
}: {
  searchParams: { signedout?: string; expired?: string };
}) {
  const signedOut = searchParams.signedout === '1';
  const expired = searchParams.expired === '1';

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="card">
          <h1 className="text-lg font-semibold text-brand-800">
            CSIBER AQAR System
          </h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">
            NAAC Annual Quality Assurance Report
          </p>

          {expired && (
            <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Your session has expired. Please sign in again.
            </p>
          )}
          {signedOut && !expired && (
            <p className="mb-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
              You have been signed out. Sign in to continue.
            </p>
          )}

          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Accounts are issued by the IQAC office.
        </p>
      </div>
    </main>
  );
}
