# Документация: Сканер QR-кодов

## Описание

Функционал сканирования QR-кодов позволяет клиентам и продавцам сканировать QR-коды для обработки ссылок на оплату. После сканирования URL отправляется на сервер через POST-запрос.

## Компоненты

### QRScanner (`src/components/QRScanner.tsx`)

Компонент для сканирования QR-кодов с использованием библиотеки `html5-qrcode`.

**Props:**
- `onScanSuccess: (url: string) => void` - callback при успешном сканировании
- `onClose: () => void` - callback при закрытии сканера

**Особенности:**
- Автоматический запуск камеры при монтировании
- Автоматическая остановка при размонтировании
- Обработка ошибок доступа к камере

### ScanQR (`src/pages/ScanQR.tsx`)

Страница для сканирования QR-кодов с обработкой результатов.

**Функционал:**
1. Открытие модального окна сканера
2. Сканирование QR-кода
3. Логирование URL в консоль
4. Отправка POST-запроса на API
5. Отображение результата

## API запрос

### Структура POST-запроса

```typescript
{
  url: string;              // Отсканированный URL
  timestamp: string;        // ISO timestamp сканирования
  deviceInfo: {
    userAgent: string;      // User agent браузера
    platform: string;       // Платформа устройства
    language: string;       // Язык браузера
  };
  metadata: {
    source: string;         // Источник: 'qr-scanner'
    app: string;            // Название приложения: 'pay-buddy'
  };
}
```

### Пример запроса

```json
{
  "url": "https://pay-buddy.com/pay/abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Win32",
    "language": "ru-RU"
  },
  "metadata": {
    "source": "qr-scanner",
    "app": "pay-buddy"
  }
}
```

### Настройка API URL

1. Создайте файл `.env` в корне проекта:
```env
VITE_API_URL=https://your-api.com/qr-scan
```

2. Или используйте значение по умолчанию (для разработки):
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://api.example.com/qr-scan';
```

## Использование

### Для пользователя

1. Перейдите на страницу "Сканировать QR" в навигации
2. Нажмите кнопку "Начать сканирование"
3. Разрешите доступ к камере
4. Наведите камеру на QR-код
5. После сканирования результат отобразится на экране

### Для разработчика

#### Логирование

Все отсканированные URL логируются в консоль:
```javascript
console.log('Отсканированный URL:', url);
console.log('Отправка POST-запроса с данными:', requestBody);
console.log('Ответ от сервера:', data);
```

#### Обработка ошибок

Компонент обрабатывает следующие ошибки:
- Ошибки доступа к камере
- Ошибки HTTP запросов
- Ошибки парсинга ответа

#### Кастомизация

Для добавления авторизации в запросы, раскомментируйте и настройте:
```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer YOUR_TOKEN',
}
```

## Типы TypeScript

Типы определены в `src/types/api.ts`:

```typescript
interface QRScanRequest {
  url: string;
  timestamp: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
  metadata: {
    source: string;
    app: string;
  };
}

interface QRScanResponse {
  success: boolean;
  message?: string;
  data?: {
    url: string;
    processedAt: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

## Интеграция с бэкендом

### Пример обработки на сервере (Node.js/Express)

```javascript
app.post('/qr-scan', async (req, res) => {
  const { url, timestamp, deviceInfo, metadata } = req.body;
  
  // Валидация
  if (!url || !timestamp) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Missing required fields'
      }
    });
  }
  
  // Обработка URL
  // ... ваша логика ...
  
  res.json({
    success: true,
    message: 'QR code processed successfully',
    data: {
      url,
      processedAt: new Date().toISOString()
    }
  });
});
```

## Безопасность

- Все запросы отправляются через HTTPS
- URL валидируется перед отправкой
- Ошибки не раскрывают чувствительную информацию
- Доступ к камере запрашивается только при необходимости

## Поддержка браузеров

Сканер QR-кодов работает в браузерах с поддержкой:
- MediaDevices API (getUserMedia)
- Modern JavaScript (ES6+)
- HTML5 Video

Рекомендуемые браузеры:
- Chrome 53+
- Firefox 36+
- Safari 11+
- Edge 12+

