-- CreateEnum
CREATE TYPE "LocaleCode" AS ENUM ('vi', 'en', 'ja');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "preferred_locale" "LocaleCode" NOT NULL DEFAULT 'vi';
