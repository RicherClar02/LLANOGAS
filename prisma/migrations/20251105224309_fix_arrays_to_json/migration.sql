-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GESTOR',
    "password" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "cargo" TEXT,
    "proceso" TEXT,
    "idColaborador" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fechaInactivacion" DATETIME
);

-- CreateTable
CREATE TABLE "entidades" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "entidades_responsablePorDefectoId_fkey" FOREIGN KEY ("responsablePorDefectoId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "casos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asunto" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" TEXT NOT NULL DEFAULT 'MEDIA',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "etapaAprobacion" TEXT NOT NULL DEFAULT 'RECIBIDO',
    "tipoSolicitud" TEXT,
    "numeroRadicadoEntrada" TEXT,
    "numeroRadicadoSalida" TEXT,
    "idGLPI" TEXT,
    "emailId" TEXT,
    "entidadId" TEXT NOT NULL,
    "responsableId" TEXT,
    "creadorId" TEXT,
    "fechaRecepcion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" DATETIME,
    "fechaInicioRedaccion" DATETIME,
    "fechaEnvioRevision" DATETIME,
    "fechaRevision" DATETIME,
    "fechaEnvioAprobacion" DATETIME,
    "fechaAprobacion" DATETIME,
    "fechaEnvioFirma" DATETIME,
    "fechaFirmaLegal" DATETIME,
    "fechaEnvioFinal" DATETIME,
    "fechaAcuseRecibo" DATETIME,
    "fechaCierre" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "casos_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "emails" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "casos_entidadId_fkey" FOREIGN KEY ("entidadId") REFERENCES "entidades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "casos_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "casos_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "html" TEXT,
    "fecha" DATETIME NOT NULL,
    "attachments" JSONB,
    "entidadDetectada" TEXT,
    "prioridadDetectada" TEXT,
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "clasificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "metadata" JSONB,
    "archivoUrl" TEXT,
    "casoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "actividades_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "actividades_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamano" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "driveId" TEXT,
    "esPlantilla" BOOLEAN NOT NULL DEFAULT false,
    "casoId" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "documentos_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documentos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "revisiones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "comentario" TEXT,
    "casoId" TEXT NOT NULL,
    "revisorId" TEXT NOT NULL,
    "fechaAsignacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaRevision" DATETIME,
    CONSTRAINT "revisiones_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "revisiones_revisorId_fkey" FOREIGN KEY ("revisorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "aprobaciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "comentario" TEXT,
    "casoId" TEXT NOT NULL,
    "aprobadorId" TEXT NOT NULL,
    "fechaAsignacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAprobacion" DATETIME,
    CONSTRAINT "aprobaciones_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "casos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "aprobaciones_aprobadorId_fkey" FOREIGN KEY ("aprobadorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "entidades_nombre_key" ON "entidades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "casos_emailId_key" ON "casos"("emailId");

-- CreateIndex
CREATE UNIQUE INDEX "emails_messageId_key" ON "emails"("messageId");
