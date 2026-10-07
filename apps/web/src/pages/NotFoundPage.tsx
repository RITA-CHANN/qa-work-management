import { Link } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Page not found"
        description="The page you are looking for does not exist."
      />
      <Button asChild variant="outline">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </>
  );
}
