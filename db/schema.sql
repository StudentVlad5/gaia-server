CREATE TABLE IF NOT EXISTS receivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS boxes (
  id SERIAL PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  weight NUMERIC NOT NULL,
  boxes_count INTEGER DEFAULT 1,
  receiver_id INTEGER REFERENCES receivers(id),
  product_id INTEGER REFERENCES products(id),
  comment TEXT
);

CREATE TABLE IF NOT EXISTS users  (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  -- role VARCHAR(10) DEFAULT 'ADMIN',
  role VARCHAR(10) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS containers (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL, -- blue | gray | small
  product VARCHAR(50) NOT NULL,
  factory_id INTEGER REFERENCES factories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CREATE INDEX idx_containers_type ON containers(type);

CREATE TABLE IF NOT EXISTS container_settings (
  type VARCHAR(10) PRIMARY KEY,
  total INT NOT NULL
);

CREATE TABLE IF NOT EXISTS factories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE
);

CREATE TABLE IF NOT EXISTS package_products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(10) NOT NULL, -- L, TRI, DR, JACK...
  standard_weight INTEGER NOT NULL CHECK (standard_weight IN (20, 25))
);

CREATE TABLE IF NOT EXISTS packagings (
  id SERIAL PRIMARY KEY,

  product_id INT REFERENCES package_products(id),
  factory_id INT REFERENCES factories(id),

  actual_weight NUMERIC NOT NULL,
  standard_weight INTEGER NOT NULL,

  difference NUMERIC GENERATED ALWAYS AS (actual_weight - standard_weight) STORED,

  is_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  packed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  receiver_id INTEGER NOT NULL REFERENCES receivers(id) ON DELETE RESTRICT,
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_dates CHECK (date_end >= date_start)
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  planned_boxes INTEGER NOT NULL CHECK (planned_boxes > 0),
  
  CONSTRAINT uq_order_product UNIQUE (order_id, product_id)
);

-- Індекси для швидкої вибірки live-статусу
CREATE INDEX IF NOT EXISTS idx_orders_dates ON orders(date_start, date_end, status);