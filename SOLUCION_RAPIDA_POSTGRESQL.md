# 🚀 SOLUCIÓN RÁPIDA: PostgreSQL en la nube (Gratis)

Si no puedes instalar PostgreSQL localmente ahora, puedes usar una base de datos en la nube gratuita:

## Opción 1: Railway (Recomendado - Gratis)

1. Ve a https://railway.app
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Agrega PostgreSQL como servicio
5. Copia la DATABASE_URL que te proporcionan
6. Actualiza tu archivo `apps/backend/.env`:

```env
# Reemplaza esta línea:
DATABASE_URL="postgresql://postgres:pasword@localhost:5433/local_subago"

# Con la URL que te da Railway (ejemplo):
DATABASE_URL="postgresql://usuario:contraseña@contenedor.railway.app:5432/railway"
```

## Opción 2: Supabase (Gratis)

1. Ve a https://supabase.com
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Ve a Settings > Database
5. Copia la URL de conexión
6. Actualiza tu `apps/backend/.env`

## Opción 3: Neon.tech (Gratis)

1. Ve a https://neon.tech
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la connection string
5. Actualiza tu `apps/backend/.env`

## ⚠️ IMPORTANTE: Seguridad

- Estas son bases de datos de desarrollo
- No uses datos sensibles reales
- En producción usarás la configuración real que ya tienes

## Una vez que tengas tu DATABASE_URL:

```bash
# 1. Actualiza tu .env con la nueva URL
# 2. Genera el cliente Prisma
pnpm run db:generate

# 3. Crea las tablas
pnpm run db:push

# 4. Inicia el backend
pnpm nx serve backend

# 5. En otra terminal, inicia el frontend
pnpm nx serve frontend
```

## ¿Qué hacer ahora?

1. **Elige una opción** (Railway es la más rápida)
2. **Consigue tu DATABASE_URL** (tarda 2 minutos)
3. **Actualiza el .env** con la URL que obtuviste
4. **Avísame** cuando lo tengas y continuamos con la configuración

¿Qué opción prefieres? ¿O prefieres instalar PostgreSQL localmente?