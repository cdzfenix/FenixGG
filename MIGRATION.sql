-- =============================================
-- MIGRACIÓN FenixGG — Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. Tabla de perfiles de usuario (vinculada a Supabase Auth)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text NOT NULL,
  is_admin boolean DEFAULT false,
  color text DEFAULT '#a855f7',
  created_at timestamptz DEFAULT now()
);

-- Perfil público legible por todos
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Perfiles públicos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuario edita su perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Trigger: crea perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Añadir columnas a reviews
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS score numeric(3,1) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS playtime text,
  DROP COLUMN IF EXISTS rating;

-- Migrar reseñas existentes: asignarlas al admin y poner score = 10
-- (ajusta el UUID del admin después de crearlo en Supabase Auth)
-- UPDATE reviews SET score = 10 WHERE score IS NULL;

-- 4. Añadir columnas a backlog
ALTER TABLE backlog
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- 5. Actualizar políticas de reviews para requerir auth en escritura
DROP POLICY IF EXISTS "Escritura libre en reseñas" ON reviews;
CREATE POLICY "Lectura pública reseñas" ON reviews FOR SELECT USING (true);
CREATE POLICY "Usuario autenticado inserta reseña" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuario borra su reseña" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- 6. Actualizar políticas de backlog
DROP POLICY IF EXISTS "Escritura libre en backlog" ON backlog;
CREATE POLICY "Usuario ve su backlog y puede ver todos" ON backlog FOR SELECT USING (true);
CREATE POLICY "Usuario autenticado inserta en backlog" ON backlog FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuario actualiza su backlog" ON backlog FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuario borra su backlog" ON backlog FOR DELETE USING (auth.uid() = user_id);

-- 7. Marcar tu cuenta como admin (ejecutar DESPUÉS de crear tu cuenta en Auth)
-- UPDATE profiles SET is_admin = true, color = '#ff8c00', username = 'Fenix'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'TU_EMAIL@ejemplo.com');
