# CONFIGURACIÓN LOCAL SUBA&GO

## Paso 1: Instalar PostgreSQL

### Opción A: Instalador Oficial
1. Ve a https://www.postgresql.org/download/windows/
2. Descarga el instalador para Windows
3. Durante la instalación:
   - Contraseña del usuario postgres: `pasword` (como está en tu .env)
   - Puerto: `5433` (diferente al 5432 por defecto para evitar conflictos)
   - Guarda la contraseña en un lugar seguro

### Opción B: Usar Docker (Recomendado)
1. Instala Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Crea un contenedor PostgreSQL:

```bash
docker run -d \
  --name subago-postgres \
  -e POSTGRES_DB=local_subago \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=pasword \
  -p 5433:5432 \
  -v subago-postgres-data:/var/lib/postgresql/data \
  postgres:16
```

## Paso 2: Verificar la conexión a PostgreSQL

Después de instalar, prueba la conexión:

```bash
psql -h localhost -p 5433 -U postgres -d local_subago
```

Contraseña: `pasword`

## Paso 3: Configurar el proyecto

### 1. Las variables de entorno ya están configuradas:
- Backend: `c:\Users\merns\REPOS\suba-go\apps\backend\.env`
- Frontend: `c:\Users\merns\REPOS\suba-go\apps\frontend\.env`

### 2. Las dependencias ya están instaladas (se hicieron con `pnpm install`)

### 3. Ahora necesitamos configurar la base de datos:

```bash
# Generar el cliente Prisma
pnpm run db:generate

# Crear las tablas en la base de datos
pnpm run db:push
```

## Paso 4: Iniciar los servicios

### Backend:
```bash
pnpm nx serve backend
```

### Frontend (en otra terminal):
```bash
pnpm nx serve frontend
```

## Paso 5: Verificar que todo funciona

1. Frontend: http://localhost:3000
2. Backend: http://localhost:3001
3. WebSocket: ws://localhost:3001/ws

## Solución de problemas comunes:

### Error: "psql no se reconoce"
PostgreSQL no está en el PATH. Usa el pgAdmin o agrega PostgreSQL al PATH.

### Error: "No se puede conectar a PostgreSQL"
1. Verifica que el servicio esté corriendo
2. Verifica el puerto 5433
3. Verifica la contraseña `pasword`

### Error: "Database no existe"
Crea la base de datos manualmente:
```sql
CREATE DATABASE local_subago;
```

## ¿Necesitas ayuda?

Si tienes problemas con PostgreSQL, puedes:
1. Usar Docker (más fácil de gestionar)
2. Instalar pgAdmin para gestionar gráficamente
3. Pedirme que te ayude con algún paso específico

¡Una vez que tengas PostgreSQL corriendo, el resto es muy sencillo!