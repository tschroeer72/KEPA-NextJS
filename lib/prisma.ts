// src/lib/prisma.ts
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/prisma/generated/client";

const connectionString = process.env.DATABASE_URL!; // s.o.

const adapter = new PrismaMariaDb(connectionString);

// Wenn dein PrismaClient an einem anderen Ort generiert wurde, importiere den Pfad entsprechend:
// import { PrismaClient } from '../generated/prisma/client';

export const prisma = new PrismaClient({ adapter });
