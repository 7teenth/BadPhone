INSERT INTO
  users (username, name, password_hash, role)
VALUES
  ('john_doe', 'John Doe', 'hashed_password1', 'worker');

INSERT INTO
  users (username, name, password_hash, role)
VALUES
  ('jane_doe', 'Jane Doe', 'hashed_password2', 'worker');

INSERT INTO
  categories (name, description)
VALUES
  ('category', 'description');

INSERT INTO
  products (
    category_id,
    name,
    description,
    barcode,
    article,
    purchase_price,
    retail_price,
    quantity
  )
VALUES
  (
    1,
    'product',
    'description',
    123456,
    'article',
    10.0,
    15.0,
    100
  );

INSERT INTO
  visits (
    employee_id,
    amount,
    payment_method,
    created_at
  )
VALUES
  (1, 100.0, 'card', '2023-10-01 10:00:00');

INSERT INTO
  visit_positions (
    visit_id,
    product_id,
    quantity,
    price_at_purchase,
    amount
  )
VALUES
  (1, 1, 2, 10.0, 20.0);

INSERT INTO
  users (username, name, password_hash, role)
VALUES
  (
    'admin',
    'Admin User',
    'hashed_password',
    'admin'
  );
