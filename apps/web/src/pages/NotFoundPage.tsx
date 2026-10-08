import { Link } from 'react-router';
import { msg } from '@qawm/shared';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title={msg('MSG-COMMON-13')} description={msg('MSG-COMMON-14')} />
      <Button asChild variant="outline">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </>
  );
}
