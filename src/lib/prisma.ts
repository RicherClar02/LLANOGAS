import { PrismaClient } from "@prisma/client";


declare global {
  // Define una variable global para almacenar el cliente de Prisma
  var prisma: PrismaClient | undefined;
}


export const prisma = global.prisma || new PrismaClient({
    
});


if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}