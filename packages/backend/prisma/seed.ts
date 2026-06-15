import { PrismaClient, RoleName, ProductStatus } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

const SEED_PASSWORD = "Password123!";

const ROLES: { name: RoleName; description: string }[] = [
  { name: RoleName.ADMIN, description: "Administrador de la plataforma" },
  { name: RoleName.PROVIDER, description: "Proveedor de productos digitales" },
  { name: RoleName.CUSTOMER, description: "Cliente comprador" },
];

const CATEGORIES: { name: string; slug: string; description: string }[] = [
  { name: "Cursos", slug: "cursos", description: "Cursos y material educativo digital" },
  { name: "Ebooks", slug: "ebooks", description: "Libros y guías digitales" },
  { name: "Plantillas", slug: "plantillas", description: "Plantillas y recursos de diseño" },
  { name: "Software", slug: "software", description: "Aplicaciones y herramientas digitales" },
];

async function main(): Promise<void> {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log("Roles sembrados correctamente:", ROLES.map((r) => r.name).join(", "));

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }
  console.log("Categorías sembradas correctamente:", CATEGORIES.map((c) => c.name).join(", "));

  const roleByName = new Map<RoleName, number>();
  for (const role of await prisma.role.findMany()) {
    roleByName.set(role.name, role.id);
  }

  const passwordHash = await hashPassword(SEED_PASSWORD);

  const admin = await prisma.user.upsert({
    where: { email: "admin@notisability.test" },
    update: {},
    create: {
      email: "admin@notisability.test",
      passwordHash,
      fullName: "Admin Notisability",
      roleId: roleByName.get(RoleName.ADMIN)!,
    },
  });

  const provider = await prisma.user.upsert({
    where: { email: "provider@notisability.test" },
    update: {},
    create: {
      email: "provider@notisability.test",
      passwordHash,
      fullName: "Proveedor Demo",
      roleId: roleByName.get(RoleName.PROVIDER)!,
    },
  });

  await prisma.user.upsert({
    where: { email: "cliente@notisability.test" },
    update: {},
    create: {
      email: "cliente@notisability.test",
      passwordHash,
      fullName: "Cliente Demo",
      roleId: roleByName.get(RoleName.CUSTOMER)!,
    },
  });

  console.log(`Usuarios de prueba sembrados (contraseña: ${SEED_PASSWORD}):`);
  console.log("- admin@notisability.test (ADMIN)");
  console.log("- provider@notisability.test (PROVIDER)");
  console.log("- cliente@notisability.test (CUSTOMER)");

  const ebooks = await prisma.category.findUniqueOrThrow({ where: { slug: "ebooks" } });
  const cursos = await prisma.category.findUniqueOrThrow({ where: { slug: "cursos" } });
  const plantillas = await prisma.category.findUniqueOrThrow({ where: { slug: "plantillas" } });

  const DEMO_PRODUCTS = [
    {
      slug: "guia-marketing-digital",
      title: "Guía de Marketing Digital",
      description: "Una guía completa para lanzar campañas de marketing digital efectivas.",
      price: 25000,
      categoryId: ebooks.id,
    },
    {
      slug: "curso-finanzas-personales",
      title: "Curso de Finanzas Personales",
      description: "Aprende a organizar tus finanzas y planificar tus inversiones.",
      price: 49900,
      categoryId: cursos.id,
    },
    {
      slug: "kit-plantillas-redes-sociales",
      title: "Kit de Plantillas para Redes Sociales",
      description: "Plantillas editables para Instagram y Facebook listas para usar.",
      price: 15000,
      categoryId: plantillas.id,
    },
  ];

  for (const product of DEMO_PRODUCTS) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        ...product,
        providerId: provider.id,
        currency: "COP",
        status: ProductStatus.PUBLISHED,
      },
    });
  }

  console.log("Productos de demostración sembrados:", DEMO_PRODUCTS.map((p) => p.title).join(", "));
  console.log(`Admin id: ${admin.id}`);
}

main()
  .catch((err) => {
    console.error("Error al ejecutar el seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
