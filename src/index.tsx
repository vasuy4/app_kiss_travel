import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { hashPassword, verifyPassword, generateToken, verifyToken } from './auth'

type Bindings = {
  DB: D1Database;
}

type Variables = {
  user?: any;
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Middleware для проверки авторизации
const authMiddleware = async (c: any, next: any) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return c.json({ error: 'Токен авторизации не предоставлен' }, 401)
  }

  try {
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return c.json({ error: 'Недействительный токен' }, 401)
    }
    
    const { env } = c
    
    const user = await env.DB.prepare(`
      SELECT id, email, full_name, role, office_location, is_active 
      FROM users WHERE id = ? AND is_active = TRUE
    `).bind(decoded.userId).first()

    if (!user) {
      return c.json({ error: 'Пользователь не найден' }, 401)
    }

    c.set('user', user)
    await next()
  } catch (error) {
    return c.json({ error: 'Недействительный токен' }, 401)
  }
}

// Middleware для проверки ролей
const roleMiddleware = (roles: string[]) => {
  return async (c: any, next: any) => {
    const user = c.get('user')
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: 'Недостаточно прав доступа' }, 403)
    }
    await next()
  }
}

// API: Авторизация
app.post('/api/auth/login', async (c) => {
  const { env } = c
  const { email, password } = await c.req.json()

  try {
    // Инициализация БД при первом запуске
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        office_location TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Проверяем, есть ли пользователи в БД
    const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
    
    // Если пользователей нет, создаем администратора по умолчанию
    if (userCount?.count === 0) {
      const defaultPassword = await hashPassword('admin123')
      await env.DB.prepare(`
        INSERT INTO users (email, password_hash, full_name, role, office_location)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        'admin@mechta-travel.ru',
        defaultPassword,
        'Администратор системы',
        'admin',
        'central'
      ).run()
    }

    // Ищем пользователя
    const user = await env.DB.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = TRUE
    `).bind(email).first()

    if (!user) {
      return c.json({ error: 'Неверный email или пароль' }, 401)
    }

    // Проверяем пароль
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return c.json({ error: 'Неверный email или пароль' }, 401)
    }

    // Создаем JWT токен
    const token = generateToken(user.id, user.email, user.role)

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        office_location: user.office_location
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Ошибка при авторизации' }, 500)
  }
})

// API: Получение текущего пользователя
app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

// API: Получение списка пользователей (только для админов)
app.get('/api/users', authMiddleware, roleMiddleware(['admin']), async (c) => {
  const { env } = c
  
  const users = await env.DB.prepare(`
    SELECT id, email, full_name, role, phone, office_location, is_active, created_at
    FROM users ORDER BY created_at DESC
  `).all()

  return c.json({ users: users.results })
})

// API: Создание нового пользователя (только для админов)
app.post('/api/users', authMiddleware, roleMiddleware(['admin']), async (c) => {
  const { env } = c
  const { email, password, full_name, role, phone, office_location } = await c.req.json()

  try {
    const hashedPassword = await hashPassword(password)
    
    const result = await env.DB.prepare(`
      INSERT INTO users (email, password_hash, full_name, role, phone, office_location)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(email, hashedPassword, full_name, role, phone, office_location).run()

    return c.json({ 
      success: true, 
      userId: result.meta.last_row_id,
      message: 'Пользователь успешно создан' 
    })
  } catch (error) {
    return c.json({ error: 'Ошибка при создании пользователя' }, 400)
  }
})

// API: Получение списка стран
app.get('/api/countries', authMiddleware, async (c) => {
  const { env } = c
  
  // Инициализация таблиц при необходимости
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS countries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      visa_required BOOLEAN DEFAULT FALSE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
  
  const countries = await env.DB.prepare(`
    SELECT * FROM countries ORDER BY name
  `).all()

  return c.json({ countries: countries.results || [] })
})

// API: Получение списка туров
app.get('/api/tours', authMiddleware, async (c) => {
  const { env } = c
  const { country_id, is_active } = c.req.query()
  
  // Инициализация таблиц при необходимости
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS tours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country_id INTEGER NOT NULL,
      description TEXT,
      duration_days INTEGER NOT NULL,
      price_per_person DECIMAL(10,2) NOT NULL,
      departure_city TEXT NOT NULL,
      hotel_name TEXT,
      hotel_stars INTEGER,
      meal_type TEXT,
      transport_type TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
  
  let query = `
    SELECT t.*, c.name as country_name, c.code as country_code
    FROM tours t
    LEFT JOIN countries c ON t.country_id = c.id
    WHERE 1=1
  `
  const params = []

  if (country_id) {
    query += ' AND t.country_id = ?'
    params.push(country_id)
  }

  if (is_active !== undefined) {
    query += ' AND t.is_active = ?'
    params.push(is_active === 'true')
  }

  query += ' ORDER BY t.name'

  const tours = await env.DB.prepare(query).bind(...params).all()
  return c.json({ tours: tours.results || [] })
})

// API: Получение списка клиентов
app.get('/api/clients', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  
  // Инициализация таблиц при необходимости
  await env.DB.prepare(`
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
  
  let query = `
    SELECT c.*, u.full_name as created_by_name
    FROM clients c
    LEFT JOIN users u ON c.created_by = u.id
    WHERE 1=1
  `
  const params = []

  // Агенты видят только своих клиентов
  if (user.role === 'agent') {
    query += ' AND c.created_by = ?'
    params.push(user.id)
  }

  query += ' ORDER BY c.created_at DESC'

  const clients = await env.DB.prepare(query).bind(...params).all()
  return c.json({ clients: clients.results || [] })
})

// API: Создание нового клиента
app.post('/api/clients', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const clientData = await c.req.json()

  try {
    const result = await env.DB.prepare(`
      INSERT INTO clients (
        full_name, passport_series, passport_number, passport_issued_by,
        passport_issued_date, birth_date, phone, email, address, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      clientData.full_name,
      clientData.passport_series,
      clientData.passport_number,
      clientData.passport_issued_by,
      clientData.passport_issued_date,
      clientData.birth_date,
      clientData.phone,
      clientData.email,
      clientData.address,
      user.id
    ).run()

    return c.json({ 
      success: true, 
      clientId: result.meta.last_row_id,
      message: 'Клиент успешно добавлен' 
    })
  } catch (error) {
    return c.json({ error: 'Ошибка при создании клиента' }, 400)
  }
})

// API: Получение списка поездок
app.get('/api/trips', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const { status, client_id } = c.req.query()
  
  // Инициализация таблиц при необходимости
  await env.DB.prepare(`
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS tour_dates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tour_id INTEGER NOT NULL,
      departure_date DATE NOT NULL,
      return_date DATE NOT NULL,
      available_seats INTEGER NOT NULL,
      booked_seats INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
  
  let query = `
    SELECT 
      t.*,
      c.full_name as client_name,
      c.phone as client_phone,
      tr.name as tour_name,
      tr.country_id,
      cn.name as country_name,
      td.departure_date,
      td.return_date,
      m.full_name as manager_name,
      a.full_name as agent_name,
      ac.full_name as accountant_name
    FROM trips t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN tour_dates td ON t.tour_date_id = td.id
    LEFT JOIN tours tr ON td.tour_id = tr.id
    LEFT JOIN countries cn ON tr.country_id = cn.id
    LEFT JOIN users m ON t.manager_id = m.id
    LEFT JOIN users a ON t.agent_id = a.id
    LEFT JOIN users ac ON t.accountant_id = ac.id
    WHERE 1=1
  `
  const params = []

  // Фильтрация по роли пользователя
  if (user.role === 'agent') {
    query += ' AND t.agent_id = ?'
    params.push(user.id)
  } else if (user.role === 'manager') {
    query += ' AND t.manager_id = ?'
    params.push(user.id)
  } else if (user.role === 'accountant') {
    query += ' AND t.accountant_id = ?'
    params.push(user.id)
  }

  if (status) {
    query += ' AND t.status = ?'
    params.push(status)
  }

  if (client_id) {
    query += ' AND t.client_id = ?'
    params.push(client_id)
  }

  query += ' ORDER BY t.created_at DESC'

  const trips = await env.DB.prepare(query).bind(...params).all()
  return c.json({ trips: trips.results || [] })
})

// API: Создание новой поездки
app.post('/api/trips', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const tripData = await c.req.json()

  try {
    // Генерируем номер поездки
    const year = new Date().getFullYear()
    const lastTrip = await env.DB.prepare(`
      SELECT trip_number FROM trips 
      WHERE trip_number LIKE ? 
      ORDER BY trip_number DESC LIMIT 1
    `).bind(`MT-${year}-%`).first()

    let nextNumber = 1
    if (lastTrip) {
      const match = lastTrip.trip_number.match(/MT-\d{4}-(\d{4})/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    const tripNumber = `MT-${year}-${String(nextNumber).padStart(4, '0')}`

    const result = await env.DB.prepare(`
      INSERT INTO trips (
        trip_number, client_id, tour_date_id, tourists_count,
        total_price, status, manager_id, agent_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tripNumber,
      tripData.client_id,
      tripData.tour_date_id,
      tripData.tourists_count,
      tripData.total_price,
      'preliminary_agreement',
      user.role === 'manager' ? user.id : tripData.manager_id,
      user.role === 'agent' ? user.id : tripData.agent_id
    ).run()

    // Инициализация таблиц при необходимости
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS trip_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trip_id INTEGER NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by INTEGER NOT NULL,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run()

    // Записываем в историю статусов
    await env.DB.prepare(`
      INSERT INTO trip_status_history (trip_id, new_status, changed_by, comment)
      VALUES (?, ?, ?, ?)
    `).bind(
      result.meta.last_row_id,
      'preliminary_agreement',
      user.id,
      'Создана новая поездка'
    ).run()

    return c.json({ 
      success: true, 
      tripId: result.meta.last_row_id,
      tripNumber,
      message: 'Поездка успешно создана' 
    })
  } catch (error) {
    console.error('Error creating trip:', error)
    return c.json({ error: 'Ошибка при создании поездки' }, 400)
  }
})

// API: Обновление статуса поездки
app.patch('/api/trips/:id/status', authMiddleware, async (c) => {
  const { env } = c
  const user = c.get('user')
  const tripId = c.req.param('id')
  const { status, comment } = await c.req.json()

  try {
    // Получаем текущий статус
    const trip = await env.DB.prepare(`
      SELECT status FROM trips WHERE id = ?
    `).bind(tripId).first()

    if (!trip) {
      return c.json({ error: 'Поездка не найдена' }, 404)
    }

    // Проверяем права на изменение статуса
    const statusTransitions: Record<string, string[]> = {
      'preliminary_agreement': ['contract_signed', 'cancelled'],
      'contract_signed': ['payment_received', 'cancelled'],
      'payment_received': ['documents_issued', 'cancelled'],
      'documents_issued': ['completed'],
      'completed': [],
      'cancelled': []
    }

    if (!statusTransitions[trip.status]?.includes(status)) {
      return c.json({ error: 'Недопустимый переход статуса' }, 400)
    }

    // Обновляем статус
    await env.DB.prepare(`
      UPDATE trips SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, tripId).run()

    // Записываем в историю
    await env.DB.prepare(`
      INSERT INTO trip_status_history (trip_id, old_status, new_status, changed_by, comment)
      VALUES (?, ?, ?, ?, ?)
    `).bind(tripId, trip.status, status, user.id, comment).run()

    return c.json({ 
      success: true, 
      message: 'Статус поездки обновлен' 
    })
  } catch (error) {
    return c.json({ error: 'Ошибка при обновлении статуса' }, 400)
  }
})

// Главная страница
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Мечта путешественника - Система управления турами</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app