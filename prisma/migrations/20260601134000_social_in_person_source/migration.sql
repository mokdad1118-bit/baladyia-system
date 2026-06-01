ALTER TABLE "ReturneeRegistration" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'online';
ALTER TABLE "SocialServiceCase" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'online';
