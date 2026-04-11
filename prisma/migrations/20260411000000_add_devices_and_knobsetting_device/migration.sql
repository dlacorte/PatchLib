-- AlterTable: add devices[] to Patch
ALTER TABLE "Patch" ADD COLUMN "devices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable: add device to KnobSetting
ALTER TABLE "KnobSetting" ADD COLUMN "device" TEXT NOT NULL DEFAULT 'DFAM';
