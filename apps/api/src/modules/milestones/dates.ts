import { rangesOverlap } from '@qawm/shared';
import { UnprocessableError } from '../../lib/errors';

type Range = { startDate: string; endDate: string };
type ReleaseDates = { name: string; startDate: string | null; targetDate: string | null };

/** BR-PROJECT-29: inside the release's start and target dates, when they are set. */
export function assertInsideRelease(milestone: Range, release: ReleaseDates): void {
  const tooEarly = release.startDate !== null && milestone.startDate < release.startDate;
  const tooLate = release.targetDate !== null && milestone.endDate > release.targetDate;
  if (tooEarly || tooLate) {
    throw new UnprocessableError('MILESTONE_OUTSIDE_RELEASE', 'MSG-PROJECT-25', {
      name: release.name,
      start: release.startDate ?? '…',
      end: release.targetDate ?? '…',
    });
  }
}

/** BR-PROJECT-30: no overlap with another milestone of the same release; sharing one day counts. */
export function assertNoOverlap(milestone: Range, others: (Range & { name: string })[]): void {
  const clash = others.find((other) => rangesOverlap(milestone, other));
  if (clash) {
    throw new UnprocessableError('MILESTONE_OVERLAP', 'MSG-PROJECT-26', {
      name: clash.name,
      start: clash.startDate,
      end: clash.endDate,
    });
  }
}
