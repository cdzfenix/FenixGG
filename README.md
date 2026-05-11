# 🎮 GAME VAULT — Guía de instalación y despliegue

Una aplicación para registrar reseñas de videojuegos y backlog, con estética gamer oscura.

---

## 📋 Requisitos previos

- [Node.js](https://nodejs.org/) (v18 o superior)
- Cuenta gratuita en [Supabase](https://supabase.com)
- Cuenta gratuita en [Vercel](https://vercel.com)
- Cuenta en [Twitch](https://dev.twitch.tv) (para la API de IGDB)

---

## 1️⃣ Configurar Supabase (Base de datos)

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta este SQL para crear las tablas:

```sql
-- Tabla de reseñas
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  cover text,
  year text,
  genres text,
  rating integer DEFAULT 5,
  review text,
  rawg_id integer,
  created_at timestamptz DEFAULT now()
);

-- Tabla de backlog
CREATE TABLE backlog (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  cover text,
  year text,
  genres text,
  status text DEFAULT 'pending',
  notes text,
  rawg_id integer,
  created_at timestamptz DEFAULT now()
);

-- Permisos públicos de lectura (la web es pública)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de reseñas" ON reviews FOR SELECT USING (true);
CREATE POLICY "Escritura libre en reseñas" ON reviews FOR ALL USING (true);

CREATE POLICY "Lectura pública de backlog" ON backlog FOR SELECT USING (true);
CREATE POLICY "Escritura libre en backlog" ON backlog FOR ALL USING (true);
```

3. Ve a **Project Settings > API** y copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

> 💡 La seguridad real viene de tu contraseña de admin en el frontend. Solo tú conoces esa contraseña, así que solo tú puedes escribir desde la UI.

---

## 2️⃣ Obtener credenciales de Twitch (para IGDB)

IGDB es la base de datos de videojuegos más completa del mundo (propiedad de Twitch/Amazon), gratuita para uso personal. Las búsquedas y carátulas vienen de aquí.

1. Ve a [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps)
2. Haz clic en **+ Register Your Application**
3. Rellena los campos:
   - **Name**: `game-vault` (o cualquier nombre)
   - **OAuth Redirect URLs**: `http://localhost`
   - **Category**: Application Integration
   - **Client Type**: Confidential
4. Haz clic en **Create**
5. Copia el **Client ID** → `TWITCH_CLIENT_ID`
6. Haz clic en **New Secret** y copia el valor → `TWITCH_CLIENT_SECRET`

> ⚠️ Estas dos variables **no llevan el prefijo `VITE_`** a propósito. Solo las usa la Serverless Function del servidor (`api/igdb.js`) y así nunca se exponen al navegador.

---

## 3️⃣ Instalar y probar en local

```bash
# 1. Entra en la carpeta del proyecto
cd game-vault

# 2. Instala dependencias
npm install

# 3. Crea el archivo de variables de entorno
cp .env.example .env.local

# 4. Edita .env.local con tus valores reales
# (editor de texto, VS Code, etc.)

# 5. Arranca el servidor de desarrollo
vercel dev
```

> 💡 Usa `vercel dev` en lugar de `npm run dev` para que las Serverless Functions (`api/igdb.js`) funcionen también en local. Instala Vercel CLI con `npm i -g vercel` si no lo tienes.

---

## 4️⃣ Desplegar en Vercel (gratis)

### Opción A: Desde GitHub (recomendado)

1. Sube el proyecto a GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/game-vault.git
git push -u origin main
```

2. Ve a [vercel.com](https://vercel.com) → **New Project**
3. Importa tu repositorio de GitHub
4. En **Environment Variables**, añade estas 5 variables:

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `TWITCH_CLIENT_ID` | Client ID de tu app de Twitch |
| `TWITCH_CLIENT_SECRET` | Client Secret de tu app de Twitch |
| `VITE_ADMIN_PASSWORD` | Tu contraseña secreta de admin |

5. Haz clic en **Deploy**

¡Listo! Vercel te dará una URL pública como `game-vault.vercel.app`.

### Opción B: CLI de Vercel

```bash
npm install -g vercel
vercel --prod
```

---

## 🔐 Seguridad

- `VITE_ADMIN_PASSWORD` está en las variables de entorno de Vercel, nadie puede verla desde el repositorio
- `TWITCH_CLIENT_ID` y `TWITCH_CLIENT_SECRET` solo existen en el servidor, nunca llegan al navegador
- Los **visitantes** pueden ver reseñas y backlog, pero no tienen botones de edición
- Solo **tú** (con la contraseña correcta) ves los botones de añadir/editar/eliminar
- La sesión admin dura mientras no cierres el navegador

---

## 🎨 Características

- ✅ Búsqueda de videojuegos con carátulas (IGDB — todas las plataformas)
- ✅ Sistema de estrellas (1-5)
- ✅ Reseña expandida al hacer clic
- ✅ Filtro por nombre en reseñas
- ✅ Backlog con estados: Pendiente / Jugando / Completado
- ✅ Filtros de backlog por estado
- ✅ Estética gamer oscura con efectos neon
- ✅ Efecto glitch en el logo
- ✅ Scanlines y ruido de pantalla CRT
- ✅ Login admin con contraseña
