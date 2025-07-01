-- Убираем супер-админа, возвращаем только owner и seller
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'seller'));

-- Удаляем супер-админа
DELETE FROM users WHERE role = 'owner';

-- Добавляем поле payment_method в таблицу продаж
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'terminal'));

-- Обновляем политики безопасности (убираем упоминания owner)

-- Политики для stores
DROP POLICY IF EXISTS "Users can view stores" ON stores;
CREATE POLICY "Users can view their own store" ON stores
    FOR SELECT USING (
        id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Политики для users
DROP POLICY IF EXISTS "Users can view users" ON users;
CREATE POLICY "Users can view users from their store" ON users
    FOR SELECT USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Политики для products
DROP POLICY IF EXISTS "Users can manage products" ON products;
CREATE POLICY "Users can view products from their store" ON products
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Политики для sales
DROP POLICY IF EXISTS "Users can manage sales" ON sales;
CREATE POLICY "Users can view sales from their store" ON sales
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Политики для visits
DROP POLICY IF EXISTS "Users can manage visits" ON visits;
CREATE POLICY "Users can view visits from their store" ON visits
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Политики для shifts
DROP POLICY IF EXISTS "Users can manage shifts" ON shifts;
CREATE POLICY "Users can view shifts from their store" ON shifts
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
        )
    );

-- Добавляем политики для управления пользователями (только владельцы)
CREATE POLICY "Owners can manage users in their store" ON users
    FOR ALL USING (
        store_id IN (
            SELECT store_id FROM users 
            WHERE login = current_setting('app.current_user_login', true)
            AND role = 'owner'
        )
    );
