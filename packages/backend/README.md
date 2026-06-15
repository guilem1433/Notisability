# @notisability/backend

API REST de Notisability para `packages/frontend`. Este es el backend
**vigente** (auth con access/refresh tokens, roles ADMIN/PROVIDER/CUSTOMER,
productos, órdenes con Mercado Pago, biblioteca, panel de proveedor y admin).

> El código en `src/` (raíz del repo) es una versión anterior, no compatible
> con `packages/frontend`. No lo uses para levantar la API del frontend.

## Setup

```bash
cd packages/backend
npm install
cp .env.example .env   # ajustar DATABASE_URL, MP_ACCESS_TOKEN, etc.
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

El servidor escucha en `http://localhost:3000` (configurable con `PORT`),
expuesto bajo `/api`, igual que espera `VITE_API_BASE_URL` del frontend.
