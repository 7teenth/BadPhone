-- Добавляем роль super_admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'seller', 'super_admin'));

-- Создаем супер-администратора (общий владелец)
INSERT INTO users (id, store_id, login, password_hash, name, role) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', NULL, 'admin', '123456', 'Супер Адміністратор', 'super_admin')
ON CONFLICT (login) DO UPDATE SET 
    store_id = NULL,
    name = 'Супер Адміністратор',
    role = 'super_admin';

-- Обновляем политики безопасности для супер-администратора

-- Политики для stores - супер-админ видит все магазины
DROP POLICY IF EXISTS "Users can view their own store" ON stores;
CREATE POLICY "Users can view stores" ON stores
    FOR SELECT USING (
        -- Супер-админ видит все магазины
        EXISTS (
            SELECT 1 FROM users 
            WHERE login = current_setting('app.current_user_login', true) 
            AND role = 'super_admin'
        )
        OR
        -- Обычные пользователи видят только свой магазин
        id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
            AND role IN ('owner', 'seller')
        )
    );

-- Политики для users - супер-админ видит всех пользователей
DROP POLICY IF EXISTS "Users can view users from their store" ON users;
CREATE POLICY "Users can view users" ON users
    FOR SELECT USING (
        -- Супер-админ видит всех пользователей
        EXISTS (
            SELECT 1 FROM users 
            WHERE login = current_setting('app.current_user_login', true) 
            AND role = 'super_admin'
        )
        OR
        -- Обычные пользователи видят только пользователей своего магазина
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
            AND role IN ('owner', 'seller')
        )
    );

-- Политики для products - супер-админ управляет всеми товарами
DROP POLICY IF EXISTS "Users can view products from their store" ON products;
CREATE POLICY "Users can manage products" ON products
    FOR ALL USING (
        -- Супер-админ управляет всеми товарами
        EXISTS (
            SELECT 1 FROM users 
            WHERE login = current_setting('app.current_user_login', true) 
            AND role = 'super_admin'
        )
        OR
        -- Владельцы управляют товарами своего магазина
        (store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
            AND role = 'owner'
        ))
        OR
        -- Продавцы только просматривают товары своего магазина
        (store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
            AND role = 'seller'
        ))
    );

-- Политики для sales - супер-админ видит все продажи
DROP POLICY IF EXISTS "Users can view sales from their store" ON sales;
CREATE POLICY "Users can manage sales" ON sales
    FOR ALL USING (
        -- Супер-админ видит все продажи
        EXISTS (
            SELECT 1 FROM users 
            WHERE login = current_setting('app.current_user_login', true) 
            AND role = 'super_admin'
        )
        OR
        -- Обычные пользователи видят продажи своего магазина
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
            AND role IN ('owner', 'seller')
        )
    );

-- Политики для visits - супер-админ видит все визиты
DROP POLICY IF EXISTS "Users can view visits from their store" ON visits;
CREATE POLICY "Users can manage visits" ON visits
    FOR ALL USING (
        -- Супер-админ видит все визиты
        EXISTS (
            SELECT 1 FROM users 
            WHERE login = current_setting('app.current_user_login', true) 
            AND role = 'super_admin'
        )
        OR
        -- Обычные пользователи видят визиты своего магазина
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
            AND role IN ('owner', 'seller')
        )
    );

-- Политики для shifts - супер-админ видит все смены
DROP POLICY IF EXISTS "Users can view shifts from their store" ON shifts;
CREATE POLICY "Users can manage shifts" ON shifts
    FOR ALL USING (
        -- Супер-админ видит все смены
        EXISTS (
            SELECT 1 FROM users 
            WHERE login = current_setting('app.current_user_login', true) 
            AND role = 'super_admin'
        )
        OR
        -- Обычные пользователи видят смены своего магазина
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
            AND role IN ('owner', 'seller')
        )
    );
