-- Включение Row Level Security (RLS) для безопасности
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для stores
CREATE POLICY "Users can view their own store" ON stores
    FOR SELECT USING (
        id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Политики безопасности для users
CREATE POLICY "Users can view users from their store" ON users
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Политики безопасности для products
CREATE POLICY "Users can view products from their store" ON products
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Политики безопасности для sales
CREATE POLICY "Users can view sales from their store" ON sales
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Политики безопасности для visits
CREATE POLICY "Users can view visits from their store" ON visits
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Политики безопасности для shifts
CREATE POLICY "Users can view shifts from their store" ON shifts
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );
