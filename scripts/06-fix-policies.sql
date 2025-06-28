-- Отключаем RLS для stores чтобы избежать рекурсии
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Удаляем все существующие политики
DROP POLICY IF EXISTS "Users can view their own store" ON stores;
DROP POLICY IF EXISTS "Users can view users from their store" ON users;
DROP POLICY IF EXISTS "Users can view products from their store" ON products;
DROP POLICY IF EXISTS "Users can view sales from their store" ON sales;
DROP POLICY IF EXISTS "Users can view visits from their store" ON visits;
DROP POLICY IF EXISTS "Users can view shifts from their store" ON shifts;
DROP POLICY IF EXISTS "Owners can manage users in their store" ON users;

-- Создаем простые политики без рекурсии

-- Политики для users (базовые)
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert new users" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can update users in their store" ON users
    FOR UPDATE USING (
        store_id IN (
            SELECT u.store_id FROM users u 
            WHERE u.id = auth.uid()::text 
            AND u.role = 'owner'
        )
    );

CREATE POLICY "Owners can delete users in their store" ON users
    FOR DELETE USING (
        store_id IN (
            SELECT u.store_id FROM users u 
            WHERE u.id = auth.uid()::text 
            AND u.role = 'owner'
        )
    );

-- Политики для products
CREATE POLICY "Users can view all products" ON products
    FOR SELECT USING (true);

CREATE POLICY "Owners can manage products" ON products
    FOR ALL USING (true);

-- Политики для sales
CREATE POLICY "Users can view all sales" ON sales
    FOR SELECT USING (true);

CREATE POLICY "Users can insert sales" ON sales
    FOR INSERT WITH CHECK (true);

-- Политики для visits
CREATE POLICY "Users can view all visits" ON visits
    FOR SELECT USING (true);

CREATE POLICY "Users can insert visits" ON visits
    FOR INSERT WITH CHECK (true);

-- Политики для shifts
CREATE POLICY "Users can view all shifts" ON shifts
    FOR SELECT USING (true);

CREATE POLICY "Users can manage shifts" ON shifts
    FOR ALL USING (true);
