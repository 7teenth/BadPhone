-- Вставка магазинов
INSERT INTO stores (id, name, address, phone) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'BadPhone Центр', 'вул. Хрещатик, 1, Київ', '+380 44 123 45 67'),
    ('550e8400-e29b-41d4-a716-446655440002', 'BadPhone Поділ', 'вул. Контрактова, 15, Київ', '+380 44 123 45 68'),
    ('550e8400-e29b-41d4-a716-446655440003', 'BadPhone Оболонь', 'вул. Оболонська, 25, Київ', '+380 44 123 45 69')
ON CONFLICT (id) DO NOTHING;

-- Вставка пользователей
INSERT INTO users (id, store_id, login, password_hash, name, role) VALUES 
    -- Супер админ
    ('550e8400-e29b-41d4-a716-446655440000', NULL, 'admin', 'admin', 'Супер Адміністратор', 'owner'),
    
    -- Магазин Центр
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'manager1', '123456', 'Менеджер Центр', 'owner'),
    ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'seller1', '123456', 'Олександр', 'seller'),
    
    -- Магазин Поділ
    ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'manager2', '123456', 'Менеджер Поділ', 'owner'),
    ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'seller2', '123456', 'Марія', 'seller'),
    
    -- Магазин Оболонь
    ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440003', 'manager3', '123456', 'Менеджер Оболонь', 'owner'),
    ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440003', 'seller3', '123456', 'Іван', 'seller')
ON CONFLICT (login) DO NOTHING;

-- Вставка товаров для магазина Центр
INSERT INTO products (store_id, name, category, price, quantity, description, brand, model, barcode) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Чохол iPhone 15 Pro', 'Чохли', 450.00, 25, 'Силіконовий чохол для iPhone 15 Pro', 'Apple', 'iPhone 15 Pro', '1234567890123'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Зарядний кабель USB-C', 'Зарядки', 280.00, 50, 'Швидкий зарядний кабель USB-C 1м', 'Generic', 'USB-C', '1234567890124'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Навушники AirPods Pro', 'Навушники', 8500.00, 8, 'Бездротові навушники з шумозаглушенням', 'Apple', 'AirPods Pro 2', '1234567890125'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Захисне скло Samsung S24', 'Захисні скла', 320.00, 15, 'Загартоване скло для Samsung Galaxy S24', 'Samsung', 'Galaxy S24', '1234567890126'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Power Bank Xiaomi 10000mAh', 'Power Bank', 1200.00, 12, 'Портативний зарядний пристрій', 'Xiaomi', 'Mi Power Bank 3', '1234567890127');

-- Вставка товаров для магазина Поділ
INSERT INTO products (store_id, name, category, price, quantity, description, brand, model, barcode) VALUES 
    ('550e8400-e29b-41d4-a716-446655440002', 'Чохол Samsung Galaxy S24', 'Чохли', 380.00, 18, 'Прозорий силіконовий чохол', 'Samsung', 'Galaxy S24', '1234567890128'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Бездротова зарядка iPhone', 'Зарядки', 1500.00, 6, 'MagSafe сумісна бездротова зарядка 15W', 'Apple', 'MagSafe', '1234567890129'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Навушники Samsung Galaxy Buds', 'Навушники', 3200.00, 10, 'Компактні бездротові навушники', 'Samsung', 'Galaxy Buds 2', '1234567890130'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Тримач для телефону', 'Тримачі', 150.00, 30, 'Універсальний тримач для авто', 'Generic', 'Universal', '1234567890131');

-- Вставка товаров для магазина Оболонь
INSERT INTO products (store_id, name, category, price, quantity, description, brand, model, barcode) VALUES 
    ('550e8400-e29b-41d4-a716-446655440003', 'Чохол iPhone 14', 'Чохли', 420.00, 20, 'Силіконовий чохол для iPhone 14', 'Apple', 'iPhone 14', '1234567890132'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Зарядка Lightning', 'Зарядки', 250.00, 35, 'Оригінальний кабель Lightning', 'Apple', 'Lightning', '1234567890133'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Power Bank Samsung 20000mAh', 'Power Bank', 1800.00, 8, 'Потужний портативний зарядний пристрій', 'Samsung', 'Fast Charge', '1234567890134');

-- Вставка демо продаж
INSERT INTO sales (store_id, seller_id, receipt_number, total_amount, payment_method, items_data, created_at) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', 'RCP-001', 1730.00, 'cash', '[{"id": "1", "name": "Чохол iPhone 15 Pro", "price": 450, "cartQuantity": 1}, {"id": "2", "name": "Зарядний кабель USB-C", "price": 280, "cartQuantity": 1}, {"id": "5", "name": "Power Bank Xiaomi", "price": 1000, "cartQuantity": 1}]', NOW() - INTERVAL '1 day'),
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', 'RCP-002', 8500.00, 'terminal', '[{"id": "3", "name": "Навушники AirPods Pro", "price": 8500, "cartQuantity": 1}]', NOW() - INTERVAL '2 hours'),
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440022', 'RCP-003', 1880.00, 'cash', '[{"id": "6", "name": "Чохол Samsung Galaxy S24", "price": 380, "cartQuantity": 1}, {"id": "7", "name": "Бездротова зарядка iPhone", "price": 1500, "cartQuantity": 1}]', NOW() - INTERVAL '3 hours');

-- Вставка демо визитов
INSERT INTO visits (store_id, seller_id, title, sale_amount, created_at, payment_method) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', 'Візит 1', 1730.00, NOW() - INTERVAL '1 day', 'cash'),
    ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', 'Візит 2', 8500.00, NOW() - INTERVAL '2 hours', 'terminal'),
    ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440022', 'Візит 1', 1880.00, NOW() - INTERVAL '3 hours', 'cash');
