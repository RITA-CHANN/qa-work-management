import { z } from 'zod';
import type { ProjectAccess } from './projects';

/**
 * What a Guest may see (BR-GUEST-02, ROLE-MODEL.md §2b): one switch per area of a project. Areas are listed
 * now, even those whose module comes in a later phase, so the setting doesn't change shape later.
 */
export const GUEST_AREAS = [
  'dashboard',
  'releases',
  'requirements',
  'test_cases',
  'test_runs',
  'defects',
  'reports',
  'members',
  'activity',
  'files',
] as const;

export const guestAreaSchema = z.enum(GUEST_AREAS);
export type GuestArea = z.infer<typeof guestAreaSchema>;

export const GUEST_AREA_LABELS: Record<GuestArea, string> = {
  dashboard: 'Project dashboard',
  releases: 'Releases and sprints',
  requirements: 'Requirements',
  test_cases: 'Test cases',
  test_runs: 'Test runs and results',
  defects: 'Defects',
  reports: 'Reports',
  members: 'Members list',
  activity: 'Activity log',
  files: 'Files and attachments',
};

/**
 * The areas that exist so far, the only switches the UI shows (ROLE-MODEL.md §2b: areas appear as the phases that
 * build them arrive). Add an area here when its module ships.
 */
export const GUEST_AREAS_AVAILABLE: GuestArea[] = ['dashboard', 'releases', 'members', 'activity'];

/** Default for new projects until a System admin changes it (ROLE-MODEL.md §2b). */
export const DEFAULT_GUEST_AREAS: GuestArea[] = ['dashboard', 'releases'];

/** Body of PUT /api/projects/:key/guest-visibility (API-PROJECT-13): the areas switched on. */
export const guestVisibilitySchema = z.strictObject({
  areas: z.array(guestAreaSchema).max(GUEST_AREAS.length),
});
export type GuestVisibility = z.infer<typeof guestVisibilitySchema>;

/**
 * True if someone with this access may see the area. Only Guests are limited (BR-GUEST-03);
 * pass the project's `guestAreas`.
 */
export function canSeeArea(
  access: ProjectAccess | null | undefined,
  guestAreas: readonly string[],
  area: GuestArea,
): boolean {
  if (!access) return false;
  return access !== 'GUEST' || guestAreas.includes(area);
}
