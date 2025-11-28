-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "dominioRemitente" TEXT,
ADD COLUMN     "esEntidadControl" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "numeroRadicado" TEXT,
ADD COLUMN     "palabrasClave" TEXT[],
ADD COLUMN     "remitenteOriginal" TEXT;
