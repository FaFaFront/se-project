import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "./environment";

// Never read apps/api/.env here: cleanup must only touch the dedicated E2E database.
export const database = new PrismaClient({ datasourceUrl: DATABASE_URL });
