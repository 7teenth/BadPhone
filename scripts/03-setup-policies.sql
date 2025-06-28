-- Включение Row Level Security (RLS) для всех таблиц
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Создаем упрощенные политики без рекурсии

-- Политики для stores - все пользователи могут видеть все магазины
CREATE POLICY "Allow all access to stores" ON stores
    FOR ALL USING (true);

-- Политики для users - все пользователи могут видеть всех пользователей
CREATE POLICY "Allow all access to users" ON users
    FOR ALL USING (true);

-- Политики для products - все пользователи могут управлять всеми товарами
CREATE POLICY "Allow all access to products" ON products
    FOR ALL USING (true);

-- Политики для sales - все пользователи могут видеть все продажи
CREATE POLICY "Allow all access to sales" ON sales
    FOR ALL USING (true);

-- Политики для visits - все пользователи могут видеть все визиты
CREATE POLICY "Allow all access to visits" ON visits
    FOR ALL USING (true);

-- Политики для shifts - все пользователи могут управлять всеми сменами
CREATE POLICY "Allow all access to shifts" ON shifts
    FOR ALL USING (true);

-- Создаем функцию для получения текущего пользователя (для будущего использования)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем функцию для установки текущего пользователя
CREATE OR REPLACE FUNCTION set_current_user(user_id TEXT)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
