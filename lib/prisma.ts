import { PrismaClient } from "@prisma/client";
import { fieldEncryptionExtension } from "prisma-field-encryption";

// Creates a PrismaClient extended with transparent field-level encryption.
// Fields annotated with `/// @encrypted` in schema.prisma are automatically
// encrypted before write and decrypted on read, using PRISMA_FIELD_ENCRYPTION_KEY.
// The encryption key must follow the format: k1.aesgcm256.<43 base64url chars>
// Generate with:
//   node -e "console.log('k1.aesgcm256.' + require('crypto').randomBytes(32).toString('base64url'))"
// Store it in .env.local as PRISMA_FIELD_ENCRYPTION_KEY=k1.aesgcm256.<value>
function createPrismaClient() {
  return new PrismaClient().$extends(fieldEncryptionExtension());
}

type PrismaClientWithEncryption = ReturnType<typeof createPrismaClient>;

const globalForPrisma = global as unknown as {
  prisma: PrismaClientWithEncryption;
};

export const prisma =
  globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
