import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router';
import { changePasswordSchema, msg, type ApiSuccess, type AuthUser } from '@qawm/shared';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/use-toast';
import { ApiRequestError, apiSend } from '@/lib/api-client';
import { ME_QUERY_KEY, useMe } from './use-me';

type Errors = { newPassword?: string; confirmPassword?: string; form?: string };

/**
 * SCR-AUTH-03: shown after signing in with a one-time password (BR-ADMIN-07). Nothing else opens
 * until the user sets their own password (the API refuses with PASSWORD_CHANGE_REQUIRED).
 */
export function ChangePasswordPage() {
  const me = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [errors, setErrors] = useState<Errors>({});
  const change = useMutation({
    mutationFn: (body: { newPassword: string; confirmPassword: string }) =>
      apiSend<ApiSuccess<AuthUser>>('POST', '/auth/change-password', body).then((r) => r.data),
    onSuccess: (user) => queryClient.setQueryData(ME_QUERY_KEY, user),
  });

  if (me.data && !me.data.mustChangePassword && !change.isSuccess)
    return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = changePasswordSchema.safeParse({
      newPassword: form.get('newPassword'),
      confirmPassword: form.get('confirmPassword'),
    });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as 'newPassword' | 'confirmPassword';
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      await change.mutateAsync(parsed.data);
      toast(msg('MSG-ADMIN-15'));
      void navigate('/', { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError && error.errors.length) {
        setErrors({ newPassword: error.fieldError('/newPassword') });
      } else {
        setErrors({ form: error instanceof Error ? error.message : msg('MSG-COMMON-01') });
      }
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center p-8 pt-24">
      <title>Set a new password · QA Work Management</title>
      <main
        id="main-content"
        className="w-full max-w-sm rounded-[var(--radius)] border bg-card p-6 shadow-card"
      >
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <h1 className="text-xl font-bold">Set a new password</h1>
          <p className="text-muted-foreground">{msg('MSG-ADMIN-07')}</p>
          {errors.form && (
            <p role="alert" className="text-destructive">
              {errors.form}
            </p>
          )}
          <TextField
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword}
          />
          <TextField
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
          <Button type="submit" disabled={change.isPending}>
            Save password
          </Button>
        </form>
      </main>
    </div>
  );
}
