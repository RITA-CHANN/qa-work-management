import { Link } from 'react-router';
import { COMMON_MESSAGES } from '@qawm/shared';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <>
      <PageHeader
        title={COMMON_MESSAGES.pageNotFound}
        description={COMMON_MESSAGES.pageNotFoundHint}
      />
      <Button asChild variant="outline">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </>
  );
}
