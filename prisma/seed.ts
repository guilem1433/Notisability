import { PrismaClient, RoleName } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Roles sembrados correctamente:", Object.values(RoleName).join(", "));
}

main()
  .catch((err) => {
    console.error("Error al ejecutar el seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
