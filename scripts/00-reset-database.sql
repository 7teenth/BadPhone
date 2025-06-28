-- Очистка базы данных
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Удаление функций если они существуют
DROP FUNCTION IF EXISTS get_current_user_id();
DROP FUNCTION IF EXISTS set_current_user(TEXT);
