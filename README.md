# GameHouse - Веб-портал для геймерської спільноти

### GameHouse - це багатофункціональний веб-портал, створений для об'єднання геймерської аудиторії. Він поєднує інформаційну підтримку (новини, статті, огляди) з інтерактивними сервісами (коментарі, опитування) та зручним адмініструванням.

# Стек технологій

- **Frontend:** React;
- **Backend:** Node.js, Express.js;
- **Database:** MongoDB + Mongoose;

## Встановлення та запуск

### 1. Клонування репозиторію

```bash
git clone https://github.com/your-username/gamehouse.git
cd gamehouse
```

### 2. Установка залежностей

#### Frontend

```bash
cd frontend
npm install
```

#### Backend

```bash
cd backend
npm install
```

### 3. Налаштування змінних середовища

Створи файл `.env` у папці `backend/` з наступним вмістом:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUD_STORAGE_KEY=...
```

Аналогічно, для фронтенду (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Запуск у режимі розробки

#### Backend

```bash
npm run dev
```

#### Frontend

```bash
npm run dev
```

## Основні можливості

Реєстрація, авторизація
Профілі користувачів з аватаром та налаштуваннями
Публікації статей, новин, рецензій
Коментарі з лайками, модерацією
Інтерактивні опитування з результатами в реальному часі
Адмін-панель для керування контентом
