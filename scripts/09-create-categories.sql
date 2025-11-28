-- Создать таблицу категорий и заполнить начальными значениями
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed some common categories if they don't exist already
INSERT INTO categories (name)
SELECT v.name FROM (VALUES
  ('Захисне скло'),
  ('Чохли'),
  ('Зарядні пристрої'),
  ('Навушники'),
  ('PowerBank'),
  ('Годинник'),
  ('Колонки'),
  ('Компʼютерна периферія'),
  ('Автомобільні аксесуари'),
  ('Освітлення'),
  ('Різне')
) AS v(name)
ON CONFLICT (name) DO NOTHING;

-- Create an index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
