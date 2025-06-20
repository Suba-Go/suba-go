# Suba\&Go

Suba\&Go es una aplicación fullstack multi-tenant construida con:

- **Frontend:** Next.js + React + Tailwind CSS + shadcn/ui
- **Backend:** NestJS + TypeORM
- **Monorepo:** Nx + pnpm
- **Base de datos:** PostgreSQL 18 con esquemas por inquilino

---

## 🚀 Comandos básicos

### 1. Instalar dependencias

```bash
pnpm install
```

---

### 2. Levantar el backend

```bash
pnpm nx serve backend
```

_Esto compila y lanza el servidor NestJS en [http://localhost:3001](http://localhost:3001) (o el puerto definido en `.env`)_

---

### 3. Levantar el frontend

```bash
pnpm nx serve frontend
```

_Esto inicia el servidor de desarrollo de Next.js en [http://localhost:3000](http://localhost:3000)_

---

### 4. Scripts útiles

```bash
pnpm start              # Levanta frontend y backend
pnpm build              # Compila todas las apps
pnpm lint               # Corre ESLint en todos los proyectos

pnpm backend:start      # Solo backend
pnpm frontend:start     # Solo frontend
```

---

## 🛠 Requisitos

- Node.js 20+
- pnpm 10+
- PostgreSQL (Railway u otro proveedor)
