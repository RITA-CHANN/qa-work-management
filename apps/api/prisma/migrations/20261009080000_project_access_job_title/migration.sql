-- Role model v2 (Backlog style, decided 2026-10-09): the 8 project roles become 2 access levels plus an
-- optional job title, stored as its short key. OWNER, PROJECT_MANAGER and QA_LEAD become Project admins,
-- everyone else a Member; the old role becomes the job title (docs/requirements/project/README.md).

-- CreateEnum
CREATE TYPE "ProjectAccess" AS ENUM ('PROJECT_ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "JobTitle" AS ENUM ('QAE', 'QAL', 'QAA', 'PM', 'PO', 'BA', 'DEV', 'TL', 'DES', 'STK', 'OTH');

-- AlterTable
ALTER TABLE "project_members" ADD COLUMN "access" "ProjectAccess",
ADD COLUMN "job_title" "JobTitle";

-- Migrate data
UPDATE "project_members" SET
  "access" = (CASE WHEN "role" IN ('OWNER', 'PROJECT_MANAGER', 'QA_LEAD') THEN 'PROJECT_ADMIN' ELSE 'MEMBER' END)::"ProjectAccess",
  "job_title" = (CASE "role"
    WHEN 'OWNER' THEN 'PM'
    WHEN 'PROJECT_MANAGER' THEN 'PM'
    WHEN 'QA_LEAD' THEN 'QAL'
    WHEN 'QA_ENGINEER' THEN 'QAE'
    WHEN 'TEAM_LEAD' THEN 'TL'
    WHEN 'DEVELOPER' THEN 'DEV'
    WHEN 'STAKEHOLDER' THEN 'STK'
    ELSE 'OTH'
  END)::"JobTitle";

ALTER TABLE "project_members" ALTER COLUMN "access" SET NOT NULL;

-- AlterTable: the old role now lives in "access" and "job_title"
ALTER TABLE "project_members" DROP COLUMN "role";

-- DropEnum
DROP TYPE "ProjectRole";
