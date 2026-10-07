import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { AUTH_MESSAGES, loginRequestSchema } from '@qawm/shared';
import { Button } from '@/components/ui/button';
import { ApiRequestError } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { safeReturnTo } from './return-to';
import { useLogin } from './use-login';
import { useMe } from './use-me';

type FieldErrors = { email?: string; password?: string };

function serverMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.code === 'UNAUTHENTICATED') return AUTH_MESSAGES.invalidCredentials;
    if (error.code === 'RATE_LIMITED') return AUTH_MESSAGES.rateLimited;
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

const inputClass =
  'h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive';

/** SCR-AUTH-01. See docs/design/basic/screens/SCR-AUTH-01-login.md. */
export function LoginPage() {
  const [searchParams] = useSearchParams();
  const me = useMe();
  const login = useLogin();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Logged in (already, or just now): leave for returnTo or the dashboard (BR-AUTH-09, BR-AUTH-10).
  if (me.data) return <Navigate to={safeReturnTo(searchParams.get('returnTo'))} replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = loginRequestSchema.safeParse({
      email: form.get('email'),
      password: form.get('password'),
    });
    setAlert(null);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      // On success useLogin stores the user, and the redirect above takes over.
      await login.mutateAsync(parsed.data);
    } catch (error) {
      setAlert(serverMessage(error));
      if (passwordRef.current) {
        passwordRef.current.value = '';
        passwordRef.current.focus();
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <title>Log in · QA Work Management</title>
      <header className="flex h-14 items-center border-b px-6">
        <p className="font-semibold">QA Work Management</p>
      </header>
      <main id="main-content" className="flex flex-1 items-start justify-center p-8">
        {me.isPending ? (
          <p role="status" className="text-muted-foreground">
            Loading…
          </p>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
            {alert && (
              <p
                role="alert"
                className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive"
              >
                {alert}
              </p>
            )}
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              error={fieldErrors.email}
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              error={fieldErrors.password}
              inputRef={passwordRef}
            />
            <Button type="submit" disabled={login.isPending}>
              Log in
            </Button>
          </form>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  error,
  inputRef,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  error?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const id = `login-${name}`;
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(inputClass)}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
