// Система управления турами "Мечта путешественника"
class TravelManagementSystem {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        this.currentPage = 'login';
        
        // API конфигурация
        this.api = axios.create({
            baseURL: '/api',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Добавляем токен к каждому запросу
        this.api.interceptors.request.use(config => {
            if (this.token) {
                config.headers.Authorization = `Bearer ${this.token}`;
            }
            return config;
        });

        // Обработка ошибок авторизации
        this.api.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    this.logout();
                }
                return Promise.reject(error);
            }
        );

        this.init();
    }

    async init() {
        if (this.token) {
            try {
                const response = await this.api.get('/auth/me');
                this.user = response.data.user;
                this.showDashboard();
            } catch (error) {
                this.showLoginForm();
            }
        } else {
            this.showLoginForm();
        }
    }

    showLoginForm() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <div class="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                    <div class="text-center mb-8">
                        <i class="fas fa-plane-departure text-5xl text-blue-600 mb-4"></i>
                        <h1 class="text-3xl font-bold text-gray-800">Мечта путешественника</h1>
                        <p class="text-gray-600 mt-2">Система управления турами</p>
                    </div>
                    
                    <form id="loginForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-envelope mr-2"></i>Email
                            </label>
                            <input type="email" id="email" required
                                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                placeholder="admin@mechta-travel.ru">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-lock mr-2"></i>Пароль
                            </label>
                            <input type="password" id="password" required
                                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                                placeholder="••••••••">
                        </div>
                        
                        <div id="loginError" class="hidden text-red-600 text-sm"></div>
                        
                        <button type="submit" 
                            class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200">
                            <i class="fas fa-sign-in-alt mr-2"></i>Войти в систему
                        </button>
                    </form>
                    
                    <div class="mt-6 text-center text-sm text-gray-600">
                        <p>Для тестирования используйте:</p>
                        <p class="font-mono mt-1">admin@mechta-travel.ru / admin123</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        try {
            const response = await this.api.post('/auth/login', { email, password });
            
            this.token = response.data.token;
            this.user = response.data.user;
            
            localStorage.setItem('token', this.token);
            
            this.showDashboard();
        } catch (error) {
            errorDiv.textContent = error.response?.data?.error || 'Ошибка при входе';
            errorDiv.classList.remove('hidden');
        }
    }

    showDashboard() {
        const app = document.getElementById('app');
        
        // Определяем доступные разделы в зависимости от роли
        const menuItems = this.getMenuItemsByRole();
        
        app.innerHTML = `
            <div class="min-h-screen bg-gray-100">
                <!-- Верхняя панель -->
                <nav class="bg-white shadow-lg">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between h-16">
                            <div class="flex items-center">
                                <i class="fas fa-plane-departure text-2xl text-blue-600 mr-3"></i>
                                <span class="text-xl font-semibold">Мечта путешественника</span>
                            </div>
                            
                            <div class="flex items-center space-x-4">
                                <span class="text-sm text-gray-700">
                                    <i class="fas fa-user mr-2"></i>${this.user.full_name}
                                    <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                        ${this.getRoleName(this.user.role)}
                                    </span>
                                </span>
                                <button onclick="tms.logout()" 
                                    class="text-gray-500 hover:text-gray-700">
                                    <i class="fas fa-sign-out-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
                
                <!-- Основной контент -->
                <div class="flex h-screen pt-16">
                    <!-- Боковое меню -->
                    <div class="w-64 bg-white shadow-md">
                        <nav class="mt-5 px-2">
                            ${menuItems.map(item => `
                                <a href="#" onclick="tms.navigateTo('${item.page}')" 
                                    class="group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1
                                        hover:bg-blue-50 hover:text-blue-700 ${this.currentPage === item.page ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}">
                                    <i class="${item.icon} mr-3 w-5"></i>
                                    ${item.label}
                                </a>
                            `).join('')}
                        </nav>
                    </div>
                    
                    <!-- Область контента -->
                    <div class="flex-1 p-8 overflow-auto">
                        <div id="content"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Показываем домашнюю страницу
        this.navigateTo('home');
    }

    getMenuItemsByRole() {
        const allItems = {
            home: { icon: 'fas fa-home', label: 'Главная', page: 'home' },
            trips: { icon: 'fas fa-suitcase', label: 'Поездки', page: 'trips' },
            clients: { icon: 'fas fa-users', label: 'Клиенты', page: 'clients' },
            tours: { icon: 'fas fa-map-marked-alt', label: 'Туры', page: 'tours' },
            payments: { icon: 'fas fa-money-bill-wave', label: 'Платежи', page: 'payments' },
            users: { icon: 'fas fa-user-cog', label: 'Пользователи', page: 'users' },
            reports: { icon: 'fas fa-chart-bar', label: 'Отчеты', page: 'reports' }
        };

        const roleMenus = {
            admin: ['home', 'trips', 'clients', 'tours', 'payments', 'users', 'reports'],
            manager: ['home', 'trips', 'clients', 'tours', 'reports'],
            agent: ['home', 'trips', 'clients', 'tours'],
            accountant: ['home', 'trips', 'payments', 'reports']
        };

        const userMenus = roleMenus[this.user.role] || ['home'];
        return userMenus.map(key => allItems[key]);
    }

    getRoleName(role) {
        const roleNames = {
            admin: 'Администратор',
            manager: 'Менеджер',
            agent: 'Агент',
            accountant: 'Бухгалтер'
        };
        return roleNames[role] || role;
    }

    getStatusName(status) {
        const statusNames = {
            preliminary_agreement: 'Предварительное соглашение',
            contract_signed: 'Договор подписан',
            payment_received: 'Оплата получена',
            documents_issued: 'Документы выданы',
            completed: 'Завершена',
            cancelled: 'Отменена'
        };
        return statusNames[status] || status;
    }

    getStatusColor(status) {
        const colors = {
            preliminary_agreement: 'yellow',
            contract_signed: 'blue',
            payment_received: 'green',
            documents_issued: 'purple',
            completed: 'gray',
            cancelled: 'red'
        };
        return colors[status] || 'gray';
    }

    navigateTo(page) {
        this.currentPage = page;
        const content = document.getElementById('content');
        
        switch(page) {
            case 'home':
                this.showHomePage();
                break;
            case 'trips':
                this.showTripsPage();
                break;
            case 'clients':
                this.showClientsPage();
                break;
            case 'tours':
                this.showToursPage();
                break;
            case 'users':
                this.showUsersPage();
                break;
            case 'payments':
                this.showPaymentsPage();
                break;
            default:
                content.innerHTML = `
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-2xl font-bold mb-4">${page}</h2>
                        <p>Раздел в разработке...</p>
                    </div>
                `;
        }
        
        // Обновляем активный пункт меню
    }

    async showHomePage() {
        const content = document.getElementById('content');
        
        try {
            // Загружаем статистику
            const [tripsResponse, clientsResponse] = await Promise.all([
                this.api.get('/trips'),
                this.api.get('/clients')
            ]);

            const trips = tripsResponse.data.trips || [];
            const clients = clientsResponse.data.clients || [];

            // Подсчитываем статистику
            const stats = {
                totalTrips: trips.length,
                activeTrips: trips.filter(t => ['preliminary_agreement', 'contract_signed', 'payment_received'].includes(t.status)).length,
                completedTrips: trips.filter(t => t.status === 'completed').length,
                totalClients: clients.length
            };

            content.innerHTML = `
                <div class="space-y-6">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-800">
                            Добро пожаловать, ${this.user.full_name}!
                        </h1>
                        <p class="text-gray-600 mt-2">Система управления турами ООО "Мечта путешественника"</p>
                    </div>

                    <!-- Статистика -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-blue-100">
                                    <i class="fas fa-suitcase text-2xl text-blue-600"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm text-gray-600">Всего поездок</p>
                                    <p class="text-2xl font-bold">${stats.totalTrips}</p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-green-100">
                                    <i class="fas fa-clock text-2xl text-green-600"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm text-gray-600">Активные поездки</p>
                                    <p class="text-2xl font-bold">${stats.activeTrips}</p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-purple-100">
                                    <i class="fas fa-check-circle text-2xl text-purple-600"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm text-gray-600">Завершенные</p>
                                    <p class="text-2xl font-bold">${stats.completedTrips}</p>
                                </div>
                            </div>
                        </div>

                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex items-center">
                                <div class="p-3 rounded-full bg-orange-100">
                                    <i class="fas fa-users text-2xl text-orange-600"></i>
                                </div>
                                <div class="ml-4">
                                    <p class="text-sm text-gray-600">Клиенты</p>
                                    <p class="text-2xl font-bold">${stats.totalClients}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Процесс оформления поездки -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h2 class="text-xl font-bold mb-4">Этапы оформления поездки</h2>
                        <div class="flex items-center justify-between">
                            <div class="flex-1 text-center">
                                <div class="w-12 h-12 bg-yellow-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                                    <i class="fas fa-handshake text-white"></i>
                                </div>
                                <p class="text-sm">Предварительное соглашение</p>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                            <div class="flex-1 text-center">
                                <div class="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                                    <i class="fas fa-file-contract text-white"></i>
                                </div>
                                <p class="text-sm">Оформление договора</p>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                            <div class="flex-1 text-center">
                                <div class="w-12 h-12 bg-green-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                                    <i class="fas fa-money-check text-white"></i>
                                </div>
                                <p class="text-sm">100% оплата</p>
                            </div>
                            <i class="fas fa-chevron-right text-gray-400"></i>
                            <div class="flex-1 text-center">
                                <div class="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                                    <i class="fas fa-passport text-white"></i>
                                </div>
                                <p class="text-sm">Выдача документов</p>
                            </div>
                        </div>
                    </div>

                    <!-- Последние поездки -->
                    <div class="bg-white rounded-lg shadow">
                        <div class="px-6 py-4 border-b">
                            <h2 class="text-xl font-bold">Последние поездки</h2>
                        </div>
                        <div class="p-6">
                            ${trips.length > 0 ? `
                                <div class="overflow-x-auto">
                                    <table class="w-full">
                                        <thead>
                                            <tr class="text-left text-gray-600 text-sm">
                                                <th class="pb-3">№ Поездки</th>
                                                <th class="pb-3">Клиент</th>
                                                <th class="pb-3">Тур</th>
                                                <th class="pb-3">Даты</th>
                                                <th class="pb-3">Статус</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${trips.slice(0, 5).map(trip => `
                                                <tr class="border-t">
                                                    <td class="py-3 font-medium">${trip.trip_number}</td>
                                                    <td class="py-3">${trip.client_name}</td>
                                                    <td class="py-3">${trip.tour_name}</td>
                                                    <td class="py-3">${new Date(trip.departure_date).toLocaleDateString('ru-RU')}</td>
                                                    <td class="py-3">
                                                        <span class="px-2 py-1 text-xs rounded bg-${this.getStatusColor(trip.status)}-100 text-${this.getStatusColor(trip.status)}-800">
                                                            ${this.getStatusName(trip.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : '<p class="text-gray-500">Нет данных о поездках</p>'}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            content.innerHTML = `
                <div class="bg-red-50 p-4 rounded-lg">
                    <p class="text-red-600">Ошибка загрузки данных: ${error.message}</p>
                </div>
            `;
        }
    }

    async showTripsPage() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-800">Управление поездками</h1>
                    <button onclick="tms.showNewTripForm()" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Новая поездка
                    </button>
                </div>
                
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <div id="tripsList">Загрузка...</div>
                    </div>
                </div>
            </div>
        `;

        try {
            const response = await this.api.get('/trips');
            const trips = response.data.trips || [];
            
            document.getElementById('tripsList').innerHTML = trips.length > 0 ? `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-600 text-sm border-b">
                                <th class="pb-3">№</th>
                                <th class="pb-3">Клиент</th>
                                <th class="pb-3">Тур</th>
                                <th class="pb-3">Страна</th>
                                <th class="pb-3">Даты</th>
                                <th class="pb-3">Статус</th>
                                <th class="pb-3">Сумма</th>
                                <th class="pb-3">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${trips.map(trip => `
                                <tr class="border-t hover:bg-gray-50">
                                    <td class="py-3 font-medium">${trip.trip_number}</td>
                                    <td class="py-3">${trip.client_name}</td>
                                    <td class="py-3">${trip.tour_name}</td>
                                    <td class="py-3">${trip.country_name}</td>
                                    <td class="py-3">
                                        ${new Date(trip.departure_date).toLocaleDateString('ru-RU')} - 
                                        ${new Date(trip.return_date).toLocaleDateString('ru-RU')}
                                    </td>
                                    <td class="py-3">
                                        <span class="px-2 py-1 text-xs rounded bg-${this.getStatusColor(trip.status)}-100 text-${this.getStatusColor(trip.status)}-800">
                                            ${this.getStatusName(trip.status)}
                                        </span>
                                    </td>
                                    <td class="py-3">${trip.total_price.toLocaleString('ru-RU')} ₽</td>
                                    <td class="py-3">
                                        <button onclick="tms.viewTripDetails(${trip.id})" 
                                            class="text-blue-600 hover:text-blue-800">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p class="text-gray-500">Нет зарегистрированных поездок</p>';
        } catch (error) {
            document.getElementById('tripsList').innerHTML = `
                <p class="text-red-600">Ошибка загрузки: ${error.message}</p>
            `;
        }
    }

    async showClientsPage() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-800">Управление клиентами</h1>
                    <button onclick="tms.showNewClientForm()" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <i class="fas fa-user-plus mr-2"></i>Новый клиент
                    </button>
                </div>
                
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <div id="clientsList">Загрузка...</div>
                    </div>
                </div>
            </div>
        `;

        try {
            const response = await this.api.get('/clients');
            const clients = response.data.clients || [];
            
            document.getElementById('clientsList').innerHTML = clients.length > 0 ? `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-600 text-sm border-b">
                                <th class="pb-3">ФИО</th>
                                <th class="pb-3">Телефон</th>
                                <th class="pb-3">Email</th>
                                <th class="pb-3">Паспорт</th>
                                <th class="pb-3">Добавлен</th>
                                <th class="pb-3">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.map(client => `
                                <tr class="border-t hover:bg-gray-50">
                                    <td class="py-3 font-medium">${client.full_name}</td>
                                    <td class="py-3">${client.phone}</td>
                                    <td class="py-3">${client.email || '-'}</td>
                                    <td class="py-3">${client.passport_series || ''} ${client.passport_number || ''}</td>
                                    <td class="py-3">${new Date(client.created_at).toLocaleDateString('ru-RU')}</td>
                                    <td class="py-3">
                                        <button onclick="tms.viewClientDetails(${client.id})" 
                                            class="text-blue-600 hover:text-blue-800 mr-2">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="tms.editClient(${client.id})" 
                                            class="text-green-600 hover:text-green-800">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p class="text-gray-500">Нет зарегистрированных клиентов</p>';
        } catch (error) {
            document.getElementById('clientsList').innerHTML = `
                <p class="text-red-600">Ошибка загрузки: ${error.message}</p>
            `;
        }
    }

    async showToursPage() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-800">Каталог туров</h1>
                </div>
                
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <div id="toursList">Загрузка...</div>
                    </div>
                </div>
            </div>
        `;

        try {
            const response = await this.api.get('/tours');
            const tours = response.data.tours || [];
            
            document.getElementById('toursList').innerHTML = tours.length > 0 ? `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${tours.map(tour => `
                        <div class="border rounded-lg p-4 hover:shadow-lg transition">
                            <h3 class="font-bold text-lg mb-2">${tour.name}</h3>
                            <p class="text-gray-600 mb-2">
                                <i class="fas fa-globe mr-2"></i>${tour.country_name}
                            </p>
                            <p class="text-gray-600 mb-2">
                                <i class="fas fa-calendar mr-2"></i>${tour.duration_days} дней
                            </p>
                            <p class="text-gray-600 mb-2">
                                <i class="fas fa-plane mr-2"></i>Вылет из ${tour.departure_city}
                            </p>
                            <p class="text-2xl font-bold text-blue-600">
                                ${tour.price_per_person.toLocaleString('ru-RU')} ₽
                            </p>
                            ${tour.hotel_name ? `
                                <p class="text-sm text-gray-600 mt-2">
                                    <i class="fas fa-hotel mr-1"></i>${tour.hotel_name}
                                    ${tour.hotel_stars ? `(${tour.hotel_stars}★)` : ''}
                                </p>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : '<p class="text-gray-500">Нет доступных туров</p>';
        } catch (error) {
            document.getElementById('toursList').innerHTML = `
                <p class="text-red-600">Ошибка загрузки: ${error.message}</p>
            `;
        }
    }

    async showUsersPage() {
        if (this.user.role !== 'admin') {
            document.getElementById('content').innerHTML = `
                <div class="bg-red-50 p-4 rounded-lg">
                    <p class="text-red-600">У вас нет доступа к этому разделу</p>
                </div>
            `;
            return;
        }

        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-3xl font-bold text-gray-800">Управление пользователями</h1>
                    <button onclick="tms.showNewUserForm()" 
                        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <i class="fas fa-user-plus mr-2"></i>Новый пользователь
                    </button>
                </div>
                
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <div id="usersList">Загрузка...</div>
                    </div>
                </div>
            </div>
        `;

        try {
            const response = await this.api.get('/users');
            const users = response.data.users || [];
            
            document.getElementById('usersList').innerHTML = users.length > 0 ? `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-600 text-sm border-b">
                                <th class="pb-3">ФИО</th>
                                <th class="pb-3">Email</th>
                                <th class="pb-3">Роль</th>
                                <th class="pb-3">Офис</th>
                                <th class="pb-3">Телефон</th>
                                <th class="pb-3">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr class="border-t hover:bg-gray-50">
                                    <td class="py-3 font-medium">${user.full_name}</td>
                                    <td class="py-3">${user.email}</td>
                                    <td class="py-3">
                                        <span class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                                            ${this.getRoleName(user.role)}
                                        </span>
                                    </td>
                                    <td class="py-3">${this.getOfficeName(user.office_location)}</td>
                                    <td class="py-3">${user.phone || '-'}</td>
                                    <td class="py-3">
                                        ${user.is_active ? 
                                            '<span class="text-green-600">Активен</span>' : 
                                            '<span class="text-red-600">Заблокирован</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p class="text-gray-500">Нет зарегистрированных пользователей</p>';
        } catch (error) {
            document.getElementById('usersList').innerHTML = `
                <p class="text-red-600">Ошибка загрузки: ${error.message}</p>
            `;
        }
    }

    showPaymentsPage() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-2xl font-bold mb-4">Управление платежами</h2>
                <p class="text-gray-600">Раздел платежей находится в разработке...</p>
            </div>
        `;
    }

    getOfficeName(location) {
        const offices = {
            central: 'Центральный офис',
            branch: 'Филиал',
            mobile: 'Мобильный'
        };
        return offices[location] || location;
    }

    logout() {
        localStorage.removeItem('token');
        this.token = null;
        this.user = null;
        this.showLoginForm();
    }

    // Дополнительные методы для форм
    showNewClientForm() {
        // Реализация формы добавления клиента
        alert('Форма добавления клиента будет реализована');
    }

    showNewTripForm() {
        // Реализация формы добавления поездки
        alert('Форма добавления поездки будет реализована');
    }

    showNewUserForm() {
        // Реализация формы добавления пользователя
        alert('Форма добавления пользователя будет реализована');
    }

    viewTripDetails(id) {
        alert(`Просмотр деталей поездки ${id}`);
    }

    viewClientDetails(id) {
        alert(`Просмотр деталей клиента ${id}`);
    }

    editClient(id) {
        alert(`Редактирование клиента ${id}`);
    }
}

// Инициализация системы
const tms = new TravelManagementSystem();