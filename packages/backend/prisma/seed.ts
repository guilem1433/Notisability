import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLES: { name: RoleName; description: string }[] = [
  { name: RoleName.ADMIN, description: 'Administrador de la plataforma' },
  { name: RoleName.PROVIDER, description: 'Desarrollador / Proveedor de contenido digital' },
  { name: RoleName.CUSTOMER, description: 'Usuario final / cliente' },
];

const CATEGORIES: { name: string; slug: string; description: string }[] = [
  { name: 'Software', slug: 'software', description: 'Aplicaciones, herramientas y utilidades digitales' },
  { name: 'Cursos interactivos', slug: 'cursos-interactivos', description: 'Cursos y material educativo digital' },
  { name: 'Plantillas y diseño', slug: 'plantillas-y-diseno', description: 'Plantillas, recursos graficos y UI kits' },
  { name: 'E-books', slug: 'e-books', description: 'Libros digitales y guias' },
  { name: 'Videojuegos y apps', slug: 'videojuegos-y-apps', description: 'Videojuegos y aplicaciones interactivas' },
];

async function main(): Promise<void> {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }
  console.log(`Roles sincronizados: ${ROLES.map((r) => r.name).join(', ')}`);

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }
  console.log(`Categorias sincronizadas: ${CATEGORIES.map((c) => c.name).join(', ')}`);

  const adminEmail = 'admin@notisability.com';
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.ADMIN } });

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Administrador Notisability',
        passwordHash,
        roleId: adminRole.id,
        cart: { create: {} },
      },
    });
    console.log(`Usuario administrador creado: ${adminEmail} / Admin123! (cambiar tras el primer ingreso)`);
  } else {
    console.log('El usuario administrador ya existe, se omite su creacion');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
