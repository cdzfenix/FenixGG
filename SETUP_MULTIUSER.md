# 🔐 Setup de autenticación multi-usuario

Después de hacer push de estos cambios, sigue estos pasos:

## 1️⃣ Ejecutar la migración SQL en Supabase

1. Ve a **Supabase Dashboard → SQL Editor**
2. Abre el archivo `MIGRATION.sql` del proyecto
3. Copia TODO el contenido y pégalo en el editor
4. Haz clic en **Run** (arriba a la derecha)

Esto crea:
- Tabla `profiles` (usuario, username, is_admin, color)
- Tablas `reviews` y `backlog` actualizadas con columnas de usuario
- Políticas de seguridad (RLS)
- Trigger automático para crear perfil

## 2️⃣ Habilitar Email/Password Auth en Supabase

1. Ve a **Authentication → Providers**
2. Busca **Email** en la lista
3. Asegúrate de que esté **habilitado**
4. Desactiva **"Enable email confirmations"** (opcional, para no tener que confirmar)

## 3️⃣ Crear tu cuenta como admin

1. Ve a **Supabase Dashboard → SQL Editor**
2. Ejecuta este SQL (reemplaza los valores):

```sql
-- Primero verifica que tu usuario existe
SELECT id, email FROM auth.users WHERE email = 'tu_email@ejemplo.com';

-- Luego ejecuta esto (copia el UUID de la query anterior):
UPDATE profiles 
SET is_admin = true, color = '#ff8c00', username = 'Fenix'
WHERE id = 'PEGA_EL_UUID_AQUI';
```

## 4️⃣ Eliminar la contraseña de admin del código

Ya no la necesitas. En tu `.env.local` elimina:
```
VITE_ADMIN_PASSWORD=...
```

En Vercel también elimina esa variable.

## 5️⃣ Invitar nuevos usuarios

Puedes invitar usuarios de dos maneras:

**Opción A — Desde Supabase (recomendado)**
1. Ve a **Authentication → Users**
2. Haz clic en **Invite user**
3. Escribe el email, marca **Auto confirm user** (para evitar confirmación)
4. Copia el link de invitación y comparte con tu amigo

**Opción B — Formulario en la web**
Los usuarios pueden autoregistrarse pero necesitarás aprobar su email manualmente en **Authentication → Users** y marcar como "confirmed".

## 6️⃣ Cambiar colores de usuario

Cada usuario tiene un color personalizado. Para cambiarlo:

```sql
UPDATE profiles 
SET color = '#ff00ff'  -- reemplaza con el color que quieras
WHERE username = 'nombre_del_usuario';
```

Colores sugeridos:
- Admin (Fenix): `#ff8c00` (naranja)
- Usuario 1: `#a855f7` (morado neon)
- Usuario 2: `#00ff88` (verde neon)
- Usuario 3: `#ff2d78` (rosa neon)

## 7️⃣ Campos nuevos en las reseñas

- **score**: 0.0 a 10.0 (decimal con un decimal)
- **playtime**: texto libre (ej: "45h", "120h")
- **user_id**: ID del usuario que la creó (automático)
- **username**: se obtiene de la tabla profiles

## 8️⃣ Filtros en Pendientes

- **MI LISTA**: solo tus juegos
- **PENDIENTES/JUGANDO/COMPLETADOS**: filtro por estado
- **Dropdown de usuario**: ver solo de un usuario específico

