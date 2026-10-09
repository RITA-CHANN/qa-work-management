import type {
  JobTitle,
  MilestoneStatus,
  ProjectAccess,
  ReleaseStatus,
} from '../../../src/generated/prisma/client';

/**
 * Seed projects, documented in docs/requirements/project/README.md#test-data.
 * Dates are days relative to the day the seed runs, so "days left" and "overdue" stay meaningful.
 * Tests only read these projects; a test that changes data creates its own project.
 * Every project is created by the System admin (BR-PROJECT-01), who is not a member.
 */

type SeedMilestone = {
  name: string;
  goal: string;
  start: number;
  end: number;
  status: MilestoneStatus;
};
type SeedRelease = {
  name: string;
  status: ReleaseStatus;
  start: number;
  target: number;
  milestones: SeedMilestone[];
};
export type SeedProject = {
  key: string;
  name: string;
  description: string;
  archived: boolean;
  createdBy: string;
  members: [email: string, access: ProjectAccess, jobTitle: JobTitle][];
  releases: SeedRelease[];
};

export const projects: SeedProject[] = [
  {
    key: 'SHOP',
    name: 'ShopEase Web',
    description: 'Customer web shop: catalogue, cart and checkout.',
    archived: false,
    createdBy: 'admin@qawm.test',
    members: [
      ['owner@qawm.test', 'PROJECT_ADMIN', 'PO'],
      ['pm@qawm.test', 'PROJECT_ADMIN', 'PM'],
      ['lead@qawm.test', 'MEMBER', 'QAL'],
      ['linh@qawm.test', 'MEMBER', 'QAE'],
      ['teamlead@qawm.test', 'MEMBER', 'TL'],
      ['dev@qawm.test', 'MEMBER', 'DEV'],
      ['stakeholder@qawm.test', 'GUEST', 'STK'],
      ['viewer@qawm.test', 'MEMBER', 'OTH'],
    ],
    releases: [
      {
        name: '2.3',
        status: 'RELEASED',
        start: -70,
        target: -43,
        milestones: [
          { name: 'Sprint 1', goal: 'Catalogue', start: -70, end: -57, status: 'COMPLETED' },
          { name: 'Sprint 2', goal: 'Search', start: -56, end: -43, status: 'COMPLETED' },
        ],
      },
      {
        name: '2.4',
        status: 'ACTIVE',
        start: -24,
        target: 20,
        milestones: [
          { name: 'Sprint 3', goal: 'Cart', start: -24, end: -11, status: 'COMPLETED' },
          { name: 'Sprint 4', goal: 'Checkout', start: -10, end: 3, status: 'ACTIVE' },
        ],
      },
      {
        name: '2.5',
        status: 'PLANNED',
        start: 21,
        target: 50,
        milestones: [{ name: 'Sprint 5', goal: 'Payments', start: 21, end: 34, status: 'PLANNED' }],
      },
    ],
  },
  {
    key: 'MOBI',
    name: 'ShopEase Mobile',
    description: 'Mobile app for the shop.',
    archived: false,
    createdBy: 'admin@qawm.test',
    members: [
      ['linh@qawm.test', 'PROJECT_ADMIN', 'QAE'],
      ['lead@qawm.test', 'MEMBER', 'QAL'],
    ],
    releases: [{ name: '1.0', status: 'PLANNED', start: 7, target: 60, milestones: [] }],
  },
  {
    key: 'OLD',
    name: 'Legacy Portal',
    description: 'The old portal, kept for reference.',
    archived: true,
    createdBy: 'admin@qawm.test',
    members: [
      ['lead@qawm.test', 'PROJECT_ADMIN', 'QAL'],
      ['linh@qawm.test', 'MEMBER', 'QAE'],
    ],
    releases: [
      {
        name: '1.0',
        status: 'RELEASED',
        start: -200,
        target: -150,
        milestones: [{ name: 'M1', goal: 'Go live', start: -170, end: -150, status: 'COMPLETED' }],
      },
    ],
  },
  {
    key: 'SECRET',
    name: 'Internal Tools',
    description: 'Only the admin can see this one.',
    archived: false,
    createdBy: 'admin@qawm.test',
    members: [['owner@qawm.test', 'PROJECT_ADMIN', 'PM']],
    releases: [],
  },
];
