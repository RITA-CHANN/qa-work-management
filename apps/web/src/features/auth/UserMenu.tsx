import { Button } from '@/components/ui/button';
import { useLogout } from './use-logout';
import { useMe } from './use-me';

/** SCR-AUTH-02: the logged-in user's name and "Log out", in the app header. */
export function UserMenu() {
  const { data: user } = useMe();
  const logout = useLogout();
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">{user.name}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
      >
        Log out
      </Button>
    </div>
  );
}
