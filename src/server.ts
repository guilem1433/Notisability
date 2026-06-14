import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

async function main(): Promise<void> {
  await prisma.$connect();
  console.log("Conexión a la base de datos establecida correctamente");

  const server = app.listen(env.port, () => {
    console.log(`Servidor escuchando en http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\nRecibida señal ${signal}, cerrando servidor...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Error al iniciar el servidor:", err);
  process.exit(1);
});
