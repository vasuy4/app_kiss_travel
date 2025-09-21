-- Таблица пользователей системы
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'agent', 'accountant')),
  phone TEXT,
  office_location TEXT CHECK(office_location IN ('central', 'branch', 'mobile')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица клиентов
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  passport_series TEXT,
  passport_number TEXT,
  passport_issued_by TEXT,
  passport_issued_date DATE,
  birth_date DATE,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Таблица стран
CREATE TABLE IF NOT EXISTS countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  visa_required BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица туров
CREATE TABLE IF NOT EXISTS tours (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country_id INTEGER NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  price_per_person DECIMAL(10,2) NOT NULL,
  departure_city TEXT NOT NULL,
  hotel_name TEXT,
  hotel_stars INTEGER CHECK(hotel_stars >= 1 AND hotel_stars <= 5),
  meal_type TEXT CHECK(meal_type IN ('RO', 'BB', 'HB', 'FB', 'AI')),
  transport_type TEXT CHECK(transport_type IN ('airplane', 'bus', 'train', 'ship')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (country_id) REFERENCES countries(id)
);

-- Таблица дат туров
CREATE TABLE IF NOT EXISTS tour_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tour_id INTEGER NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  available_seats INTEGER NOT NULL,
  booked_seats INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tour_id) REFERENCES tours(id)
);

-- Таблица поездок (основная таблица для оформления)
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_number TEXT UNIQUE NOT NULL,
  client_id INTEGER NOT NULL,
  tour_date_id INTEGER NOT NULL,
  tourists_count INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'preliminary_agreement',
  manager_id INTEGER NOT NULL,
  agent_id INTEGER,
  accountant_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (tour_date_id) REFERENCES tour_dates(id),
  FOREIGN KEY (manager_id) REFERENCES users(id),
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (accountant_id) REFERENCES users(id),
  CHECK(status IN ('preliminary_agreement', 'contract_signed', 'payment_received', 'documents_issued', 'completed', 'cancelled'))
);

-- Таблица туристов в поездке
CREATE TABLE IF NOT EXISTS trip_tourists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  passport_series TEXT,
  passport_number TEXT,
  passport_issued_by TEXT,
  passport_issued_date DATE,
  birth_date DATE,
  is_main_tourist BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

-- Таблица истории статусов поездки
CREATE TABLE IF NOT EXISTS trip_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by INTEGER NOT NULL,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_type TEXT CHECK(payment_type IN ('cash', 'card', 'transfer')),
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_by INTEGER,
  receipt_number TEXT,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (confirmed_by) REFERENCES users(id)
);

-- Таблица документов
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  document_type TEXT NOT NULL CHECK(document_type IN ('agreement', 'contract', 'receipt', 'voucher', 'tickets', 'insurance', 'visa', 'other')),
  document_number TEXT,
  file_path TEXT,
  issued_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  issued_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_client ON trips(client_id);
CREATE INDEX IF NOT EXISTS idx_trips_tour_date ON trips(tour_date_id);
CREATE INDEX IF NOT EXISTS idx_trip_status_history_trip ON trip_status_history(trip_id);
CREATE INDEX IF NOT EXISTS idx_payments_trip ON payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_documents_trip ON documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_tour_dates_tour ON tour_dates(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_dates_departure ON tour_dates(departure_date);