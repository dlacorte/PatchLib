-- Drop the old Patch.device column after data migration
ALTER TABLE "Patch" DROP COLUMN "device";
