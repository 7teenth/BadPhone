-- Вставка демо смен для тестирования статуса магазинов

-- Активная смена для первого магазина (не завершена)
INSERT INTO shifts (id, store_id, user_id, start_time, end_time, total_sales) VALUES 
    ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '4 hours', NULL, 10230.00)
ON CONFLICT (id) DO NOTHING;

-- Завершенная смена для первого магазина (завершена сегодня)
INSERT INTO shifts (id, store_id, user_id, start_time, end_time, total_sales) VALUES 
    ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '1 hour', 5500.00)
ON CONFLICT (id) DO NOTHING;

-- Завершенная смена для второго магазина (завершена сегодня)
INSERT INTO shifts (id, store_id, user_id, start_time, end_time, total_sales) VALUES 
    ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440022', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 hours', 1880.00)
ON CONFLICT (id) DO NOTHING;

-- Старая завершенная смена (вчера) - не должна влиять на статус
INSERT INTO shifts (id, store_id, user_id, start_time, end_time, total_sales) VALUES 
    ('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440022', NOW() - INTERVAL '1 day 8 hours', NOW() - INTERVAL '1 day 2 hours', 2200.00)
ON CONFLICT (id) DO NOTHING;