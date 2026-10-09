import { useNavigate } from 'react-router';
import { Menu, type MenuItem } from '@/components/ui/menu';
import { useLogout } from '@/features/auth/use-logout';
import { useMe } from '@/features/auth/use-me';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

/**
 * Avatar menu in the top bar (SCR-AUTH-02, BR-SHELL-02). "Admin console" is the only way into the
 * Admin UI and is shown to System admins only.
 */
export function AccountMenu() {
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  if (!user) return null;

  const items: MenuItem[] = [];
  if (user.globalRole === 'ADMIN') {
    items.push({ label: 'Admin console', onSelect: () => void navigate('/admin') });
  }
  items.push({ label: 'Log out', onSelect: () => logout.mutate() });

  return (
    <Menu
      label={`Account: ${user.name}`}
      items={items}
      trigger={
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            {initials(user.name)}
          </span>
          <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>
        </span>
      }
    />
  );
}
