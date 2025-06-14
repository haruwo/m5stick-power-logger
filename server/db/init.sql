CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- サンプルデータ
INSERT INTO items (name, description) VALUES
    ('サンプルアイテム1', 'これは最初のサンプルアイテムです'),
    ('サンプルアイテム2', 'これは2番目のサンプルアイテムです'),
    ('サンプルアイテム3', 'これは3番目のサンプルアイテムです');