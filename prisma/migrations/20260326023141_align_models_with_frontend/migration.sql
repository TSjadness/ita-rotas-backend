/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `whatsapp` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `Sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Sponsor` table. All the data in the column will be lost.
  - Added the required column `name` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "imageUrl",
DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "time" TEXT NOT NULL,
ALTER COLUMN "date" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "GalleryItem" ADD COLUMN     "date" TEXT,
ADD COLUMN     "eventName" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "mapLink" TEXT,
ADD COLUMN     "time" TEXT;

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "description",
DROP COLUMN "imageUrl",
DROP COLUMN "instagram",
DROP COLUMN "role",
DROP COLUMN "whatsapp",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "moto" TEXT,
ADD COLUMN     "photo" TEXT;

-- AlterTable
ALTER TABLE "Route" ALTER COLUMN "date" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Sponsor" DROP COLUMN "imageUrl",
DROP COLUMN "instagram",
DROP COLUMN "website",
ADD COLUMN     "link" TEXT,
ADD COLUMN     "logo" TEXT;
