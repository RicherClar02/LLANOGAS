-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMINISTRADOR_SISTEMA', 'ADMINISTRADOR_ASIGNACIONES', 'GESTOR', 'REVISOR_JURIDICO', 'APROBADOR', 'ROL_SEGUIMIENTO', 'AUDITOR');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('MUY_ALTA', 'ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "EstadoCaso" AS ENUM ('PENDIENTE', 'ASIGNADO', 'EN_REDACCION', 'EN_REVISION', 'EN_APROBACION', 'FIRMA_LEGAL', 'LISTO_ENVIO', 'ENVIADO', 'CON_ACUSE', 'CERRADO');

-- CreateEnum
CREATE TYPE "EtapaAprobacion" AS ENUM ('RECIBIDO', 'ASIGNADO', 'EN_REDACCION', 'EN_REVISION', 'EN_APROBACION', 'FIRMA_LEGAL', 'LISTO_ENVIO', 'ENVIADO', 'CON_ACUSE', 'CERRADO');

-- CreateEnum
CREATE TYPE "TipoSolicitud" AS ENUM ('SOLICITUD_INFORMACION', 'AUDITORIA', 'RESPUESTA_COMUNICADO', 'REQUERIMIENTO_JUDICIAL', 'SOLICITUD_VIABILIDAD', 'CONSULTA_JURIDICA', 'REPORTE_OBLIGATORIO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('CREACION', 'ASIGNACION', 'CAMBIO_ESTADO', 'COMENTARIO', 'VENCIMIENTO', 'INICIO_REDACCION', 'ENVIO_REVISION', 'ENVIO_APROBACION', 'APROBACION', 'RECHAZO', 'FIRMA_LEGAL', 'ENVIO_FINAL', 'ACUSE_RECIBO');

-- CreateEnum
CREATE TYPE "EstadoRevision" AS ENUM ('PENDIENTE', 'REVISADO', 'CORREGIR', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoAprobacion" AS ENUM ('PENDIENTE', 'APROBADO', 'CORREGIR', 'RECHAZADO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'GESTOR',
    "password" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "cargo" TEXT,
    "proceso" TEXT,
    "idColaborador" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fechaInactivacion" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entidades" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sigla" TEXT,
    "email" TEXT,
    "descripcion" TEXT,
    "color" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "dominiosCorreo" JSONB,
    "palabrasClave" JSONB,
    "tiempoRespuestaDias" INTEGER,
    "responsablePorDefectoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casos" (
    "id" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoCaso" NOT NULL DEFAULT 'PENDIENTE',
    "etapaAprobacion" "EtapaAprobacion" NOT NULL DEFAULT 'RECIBIDO',
    "tipoSolicitud" "TipoSolicitud",
    "numeroRadicadoEntrada" TEXT,
    "numeroRadicadoSalida" TEXT,
    "idGLPI" TEXT,
    "emailId" TEXT,
    "entidadId" TEXT NOT NULL,
    "responsableId" TEXT,
    "creadorId" TEXT,
    "fechaRecepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3),
    "fechaInicioRedaccion" TIMESTAMP(3),
    "fechaEnvioRevision" TIMESTAMP(3),
    "fechaRevision" TIMESTAMP(3),
    "fechaEnvioAprobacion" TIMESTAMP(3),
    "fechaAprobacion" TIMESTAMP(3),
    "fechaEnvioFirma" TIMESTAMP(3),
    "fechaFirmaLegal" TIMESTAMP(3),
    "fechaEnvioFinal" TIMESTAMP(3),
    "fechaAcuseRecibo" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "html" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "attachments" JSONB,
    "entidadDetectada" TEXT,
    "prioridadDetectada" "Prioridad",
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "clasificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" TEXT NOT NULL,
    "tipo" "TipoActividad" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "metadata" JSONB,
    "archivoUrl" TEXT,
    "casoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamano" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "driveId" TEXT,
    "esPlantilla" BOOLEAN NOT NULL DEFAULT false,
    "casoId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revisiones" (
    "id" TEXT NOT NULL,
    "estado" "EstadoRevision" NOT NULL DEFAULT 'PENDIENTE',
    "comentario" TEXT,
    "casoId" TEXT NOT NULL,
    "revisorId" TEXT NOT NULL,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRevision" TIMESTAMP(3),

    CONSTRAINT "revisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aprobaciones" (
    "id" TEXT NOT NULL,
    "estado" "EstadoAprobacion" NOT NULL DEFAULT 'PENDIENTE',
    "comentario" TEXT,
    "casoId" TEXT NOT NULL,
    "aprobadorId" TEXT NOT NULL,
    "fechaAsignacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAprobacion" TIMESTAMP(3),

    CONSTRAINT "aprobaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "entidades_nombre_key" ON "entidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "casos_emailId_key" ON "casos"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "emails_messageId_key" ON "emails"("messageId");

-- AddForeignKey
ALTER TABLE "entidades" ADD CONSTRAINT "entidades_responsablePorDefectoId_fkey" FOREIGN KEY ("responsablePorDefectoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "emails"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_entidadId_fkey" FOREIGN KEY ("entidadId") REFERENCES "entidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casos" ADD CONSTRAINT "casos_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones" ADD CONSTRAINT "revisiones_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revisiones" ADD CONSTRAINT "revisiones_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprobaciones" ADD CONSTRAINT "aprobaciones_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprobaciones" ADD CONSTRAINT "aprobaciones_aprobadorId_fkey" FOREIGN KEY ("aprobadorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
