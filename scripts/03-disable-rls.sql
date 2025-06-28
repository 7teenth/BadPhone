-- Отключаем Row Level Security для упрощения работы
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- Удаляем все политики если они существуют
DROP POLICY IF EXISTS "Users can view their own store" ON stores;
DROP POLICY IF EXISTS "Users can view users from their store" ON users;
DROP POLICY IF EXISTS "Users can view products from their store" ON products;
DROP POLICY IF EXISTS "Users can view sales from their store" ON sales;
DROP POLICY IF EXISTS "Users can view visits from their store" ON visits;
DROP POLICY IF EXISTS "Users can view shifts from their store" ON shifts;
DROP POLICY IF EXISTS "Allow all access to stores" ON stores;
DROP POLICY IF EXISTS "Allow all access to users" ON users;
DROP POLICY IF EXISTS "Allow all access to products" ON products;
DROP POLICY IF EXISTS "Allow all access to sales" ON sales;
DROP POLICY IF EXISTS "Allow all access to visits" ON visits;
DROP POLICY IF EXISTS "Allow all access to shifts" ON shifts;

-- Создаем простые функции для будущего использования
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_current_user(user_id TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
