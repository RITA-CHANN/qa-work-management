-- AlterEnum
ALTER TYPE "ProjectAccess" ADD VALUE 'GUEST';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "guest_areas" TEXT[] DEFAULT ARRAY['dashboard', 'releases']::TEXT[];

-- CreateTable
CREATE TABLE "workspace_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "default_guest_areas" TEXT[] DEFAULT ARRAY['dashboard', 'releases']::TEXT[],
    "audit_retention_days" INTEGER NOT NULL DEFAULT 365,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_settings_pkey" PRIMARY KEY ("id")
);
