-- Вставка пользователей системы
INSERT OR IGNORE INTO users (email, password_hash, full_name, role, phone, office_location) VALUES 
  ('admin@mechta-travel.ru', 'VI0srU2CrV3L11FKOI8zWsfGugoRPTY/7J43lFZDsH8=', 'Петров Иван Сергеевич', 'admin', '+7(495)111-22-33', 'central'),
  ('manager1@mechta-travel.ru', 'VI0srU2CrV3L11FKOI8zWsfGugoRPTY/7J43lFZDsH8=', 'Сидорова Елена Владимировна', 'manager', '+7(495)111-22-34', 'central'),
  ('manager2@mechta-travel.ru', 'VI0srU2CrV3L11FKOI8zWsfGugoRPTY/7J43lFZDsH8=', 'Козлов Андрей Петрович', 'manager', '+7(812)222-33-44', 'branch'),
  ('agent1@mechta-travel.ru', 'VI0srU2CrV3L11FKOI8zWsfGugoRPTY/7J43lFZDsH8=', 'Михайлова Ольга Николаевна', 'agent', '+7(903)123-45-67', 'mobile'),
  ('agent2@mechta-travel.ru', 'VI0srU2CrV3L11FKOI8zWsfGugoRPTY/7J43lFZDsH8=', 'Новиков Дмитрий Александрович', 'agent', '+7(916)234-56-78', 'mobile'),
  ('accountant@mechta-travel.ru', 'VI0srU2CrV3L11FKOI8zWsfGugoRPTY/7J43lFZDsH8=', 'Белова Татьяна Ивановна', 'accountant', '+7(495)111-22-35', 'central');

-- Вставка стран
INSERT OR IGNORE INTO countries (name, code, visa_required, description) VALUES 
  ('Турция', 'TR', 0, 'Популярное направление для пляжного отдыха'),
  ('Египет', 'EG', 1, 'Круглогодичное направление с богатой историей'),
  ('Таиланд', 'TH', 0, 'Экзотический отдых в Юго-Восточной Азии'),
  ('ОАЭ', 'AE', 0, 'Роскошный отдых в Эмиратах'),
  ('Греция', 'GR', 1, 'Колыбель европейской цивилизации'),
  ('Испания', 'ES', 1, 'Средиземноморские курорты и культурные достопримечательности'),
  ('Италия', 'IT', 1, 'Богатое культурное наследие и отличная кухня'),
  ('Франция', 'FR', 1, 'Романтика Парижа и курорты Лазурного берега'),
  ('Кипр', 'CY', 0, 'Остров Афродиты с прекрасными пляжами'),
  ('Вьетнам', 'VN', 0, 'Экзотика и доступные цены');

-- Вставка туров
INSERT OR IGNORE INTO tours (name, country_id, description, duration_days, price_per_person, departure_city, hotel_name, hotel_stars, meal_type, transport_type) VALUES 
  ('Анталья - Жемчужина Средиземноморья', 1, 'Отдых на лучших пляжах Анталии', 7, 45000, 'Москва', 'Crystal Waterworld Resort', 5, 'AI', 'airplane'),
  ('Стамбул - Город контрастов', 1, 'Экскурсионный тур по Стамбулу', 5, 38000, 'Москва', 'Hilton Istanbul', 4, 'BB', 'airplane'),
  ('Хургада - Красное море', 2, 'Пляжный отдых и дайвинг', 7, 52000, 'Москва', 'Albatros Palace', 5, 'AI', 'airplane'),
  ('Каир и пирамиды', 2, 'Экскурсионный тур с посещением пирамид', 4, 48000, 'Санкт-Петербург', 'Marriott Cairo', 5, 'FB', 'airplane'),
  ('Паттайя - Тропический рай', 3, 'Пляжи и экскурсии в Таиланде', 10, 68000, 'Москва', 'Centara Grand Mirage', 5, 'BB', 'airplane'),
  ('Дубай - Город будущего', 4, 'Шопинг и развлечения в Дубае', 7, 75000, 'Москва', 'Atlantis The Palm', 5, 'HB', 'airplane'),
  ('Афины и острова', 5, 'Классическая Греция', 8, 62000, 'Москва', 'Athens Hilton', 4, 'BB', 'airplane'),
  ('Барселона и побережье', 6, 'Каталония и пляжи Коста Брава', 7, 58000, 'Москва', 'W Barcelona', 5, 'BB', 'airplane'),
  ('Рим - Вечный город', 7, 'Экскурсии по Риму и Ватикану', 5, 55000, 'Санкт-Петербург', 'Rome Cavalieri', 5, 'BB', 'airplane'),
  ('Париж - Город любви', 8, 'Романтический тур в Париж', 5, 72000, 'Москва', 'Le Meurice', 5, 'BB', 'airplane');

-- Вставка дат туров
INSERT OR IGNORE INTO tour_dates (tour_id, departure_date, return_date, available_seats, booked_seats) VALUES 
  (1, '2024-10-15', '2024-10-22', 30, 5),
  (1, '2024-11-01', '2024-11-08', 30, 0),
  (2, '2024-10-10', '2024-10-15', 20, 8),
  (3, '2024-10-20', '2024-10-27', 25, 2),
  (4, '2024-10-12', '2024-10-16', 15, 10),
  (5, '2024-11-05', '2024-11-15', 20, 3),
  (6, '2024-10-25', '2024-11-01', 25, 12),
  (7, '2024-10-18', '2024-10-26', 20, 5),
  (8, '2024-11-10', '2024-11-17', 30, 0),
  (9, '2024-10-22', '2024-10-27', 15, 7),
  (10, '2024-11-15', '2024-11-20', 20, 0);

-- Вставка тестовых клиентов
INSERT OR IGNORE INTO clients (full_name, passport_series, passport_number, phone, email, address, created_by) VALUES 
  ('Иванов Петр Сергеевич', '4510', '123456', '+7(926)111-22-33', 'ivanov@mail.ru', 'г. Москва, ул. Тверская, д. 1', 2),
  ('Смирнова Анна Михайловна', '4511', '234567', '+7(916)222-33-44', 'smirnova@gmail.com', 'г. Москва, ул. Арбат, д. 15', 2),
  ('Кузнецов Дмитрий Александрович', '4512', '345678', '+7(903)333-44-55', 'kuznetsov@yandex.ru', 'г. Санкт-Петербург, Невский пр., д. 100', 3);

-- Вставка тестовой поездки
INSERT OR IGNORE INTO trips (trip_number, client_id, tour_date_id, tourists_count, total_price, status, manager_id, agent_id) VALUES 
  ('MT-2024-0001', 1, 1, 2, 90000, 'preliminary_agreement', 2, 4),
  ('MT-2024-0002', 2, 3, 1, 38000, 'contract_signed', 2, NULL),
  ('MT-2024-0003', 3, 4, 2, 104000, 'payment_received', 3, 5);