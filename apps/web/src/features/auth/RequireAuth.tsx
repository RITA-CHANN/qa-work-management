import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { loginPathFor } from './return-to';
import { useMe } from './use-me';

/**
 * Wraps every page except /login (BR-AUTH-08). Nothing protected renders until the server
 * has confirmed the session, so a guest never sees page content, even for a moment.
 */
export function RequireAuth() {
  const location = useLocation();
  const { data: user, isPending, isError, refetch } = useMe();

  // Re-check the session on every navigation, so a session that ended on the server
  // (expired, or logged out elsewhere) sends the user to /login (BR-AUTH-11).
  useEffect(() => {
    void refetch();
  }, [location.pathname, refetch]);

  if (isPending) {
    return (
      <p role="status" className="p-8 text-muted-foreground">
        Loading…
      </p>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="p-8">
        Cannot reach the server. Reload the page to try again.
      </p>
    );
  }
  if (!user) {
    return <Navigate to={loginPathFor(location.pathname + location.search)} replace />;
  }
  // A one-time password must be replaced before anything else (BR-ADMIN-07).
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}
