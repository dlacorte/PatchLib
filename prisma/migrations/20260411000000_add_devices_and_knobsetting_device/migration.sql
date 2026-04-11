-- Add Patch.devices[] and KnobSetting.device
ALTER TABLE "Patch" ADD COLUMN "devices" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "KnobSetting" ADD COLUMN "device" TEXT NOT NULL DEFAULT 'DFAM';
