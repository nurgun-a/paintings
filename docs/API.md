# Спецификация API платформы AI Quest Platform

В данном документе приведена подробная спецификация всех интерфейсов взаимодействия (REST API и WebSockets) системы **AI Quest Platform**.

---

## 🔐 1. Общие принципы
*   **Базовый URL**: `/api`
*   **Формат данных**: JSON (Content-Type: `application/json`)
*   **Авторизация**: JWT Bearer-токен в заголовке `Authorization: Bearer <JWT_ACCESS_TOKEN>`
*   **Коды ответов**:
    *   `200 OK` — Успешное выполнение запроса.
    *   `201 Created` — Ресурс успешно создан.
    *   `400 Bad Request` — Ошибка валидации входящих параметров.
    *   `401 Unauthorized` — Токен отсутствует или невалиден.
    *   `403 Forbidden` — Недостаточно прав (несоответствие роли).
    *   `404 Not Found` — Запрашиваемый ресурс не найден.
    *   `500 Internal Server Error` — Внутренняя ошибка сервера.

---

## 📡 2. REST Endpoints

### 🔑 Аутентификация и пользователи
#### 1. Регистрация нового пользователя
*   **POST** `/api/auth/register`
*   **Тело запроса**:
    ```json
    {
      "email": "player@quest.com",
      "password": "secure_password_2026",
      "name": "Иван Сибиряков"
    }
    ```
*   **Ответ (201 Created)**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "usr-8a2bf",
        "email": "player@quest.com",
        "name": "Иван Сибиряков",
        "role": "PLAYER"
      }
    }
    ```

#### 2. Авторизация пользователя
*   **POST** `/api/auth/login`
*   **Тело запроса**:
    ```json
    {
      "email": "player@quest.com",
      "password": "secure_password_2026"
    }
    ```
*   **Ответ (200 OK)**:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "usr-8a2bf",
        "email": "player@quest.com",
        "name": "Иван Сибиряков",
        "role": "PLAYER"
      }
    }
    ```

---

### 🗺️ Квесты и прохождение (Quest Engine)
#### 1. Получить список доступных проектов (квестов)
*   **GET** `/api/projects`
*   **Авторизация**: Требуется (роль: `PLAYER`, `ORGANIZER`, `ADMIN`)
*   **Ответ (200 OK)**:
    ```json
    [
      {
        "id": "spirit-of-ichchi",
        "name": "Дух Иччи: Проклятие тайги",
        "description": "Интерактивный квест-исследование священных сибирских земель...",
        "stepsCount": 5
      }
    }
    ```

#### 2. Получить текущее игровое состояние игрока
*   **GET** `/api/quests/state?projectId=spirit-of-ichchi`
*   **Авторизация**: Требуется (роль: `PLAYER`)
*   **Ответ (200 OK)**:
    ```json
    {
      "projectId": "spirit-of-ichchi",
      "userId": "usr-8a2bf",
      "currentStepIndex": 0,
      "inventory": ["карта-тайги", "кремень"],
      "score": 150,
      "level": 2,
      "rank": "Таёжный искатель",
      "completed": false,
      "achievements": ["first-blood"]
    }
    ```

#### 3. Отправить ответ на текущий шаг (верификация)
*   **POST** `/api/quests/verify`
*   **Авторизация**: Требуется (роль: `PLAYER`)
*   **Тело запроса**:
    ```json
    {
      "projectId": "spirit-of-ichchi",
      "stepId": "step-1",
      "answer": "рысь",
      "photoBase64": "iVBORw0KGgoAAAANSUh..." // Опционально для PHOTO верификации
    }
    ```
*   **Ответ (200 OK)**:
    ```json
    {
      "success": true,
      "correct": true,
      "message": "Ответ верен! Вы заслужили благословение Иччи.",
      "rewards": {
        "xp": 100,
        "unlockedStepIndex": 1,
        "items": ["оберег-байаная"],
        "newRank": "Проводник духов",
        "achievementUnlocked": "nature-explorer"
      }
    }
    ```

---

### 🤖 Чат и ИИ-ассистент (AI Engine)
#### 1. Отправить сообщение ИИ-ассистенту
*   **POST** `/api/ai/chat`
*   **Авторизация**: Требуется (роль: `PLAYER`)
*   **Тело запроса**:
    ```json
    {
      "projectId": "spirit-of-ichchi",
      "message": "Где мне найти священный алтарь?"
    }
    ```
*   **Ответ (200 OK)**:
    ```json
    {
      "response": "Шепот ветра указывает на старый кедр у изгиба реки. Используй свой кремень, чтобы осветить дорогу."
    }
    ```

---

## 🔌 3. Протокол WebSockets (Realtime Gateway)

Все события в режиме реального времени доставляются через Socket.IO. Подключение открывается по адресу `/` с передачей JWT-токена.

### Параметры подключения:
```javascript
const socket = io("https://questplatform.local", {
  auth: {
    token: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  query: {
    projectId: "spirit-of-ichchi",
    lastEventId: "evt-9a3c", // Опционально для catch-up синхронизации
    lastSequence: 14         // Опционально
  }
});
```

---

### 📤 Входящие события от клиента (Client -> Server)

#### 1. Подтверждение получения сообщения (ACK)
Клиент должен отвечать этим событием на каждое полученное сообщение с типом `event` для предотвращения повторных попыток отправки со стороны очереди.
```json
socket.emit("ack", {
  "messageId": "evt-7f82b93"
});
```

#### 2. Отправка сообщения в групповой чат
```json
socket.emit("chat_message", {
  "roomId": "project:spirit-of-ichchi",
  "text": "Мы нашли алтарь! Ждем остальных."
});
```

#### 3. Статус ввода текста (Typing)
```json
socket.emit("typing", {
  "roomId": "project:spirit-of-ichchi",
  "typing": true
});
```

#### 4. Обновление присутствия игрока (Presence)
```json
socket.emit("presence_update", {
  "status": "online", // 'online' | 'offline' | 'idle'
  "questId": "spirit-of-ichchi",
  "stepId": "step-2"
});
```

---

### 📥 Исходящие события от сервера (Server -> Client)

#### 1. Канонический контейнер доставки событий (`event`)
Все типы событий оборачиваются в этот типизированный и версионированный контейнер:
```json
socket.on("event", {
  "id": "evt-81cf9302-3921",
  "sequence": 142,
  "type": "QuestUpdated", // Одно из ChatMessage, LevelUp, QuestUpdated, и др.
  "payload": {
    "projectId": "spirit-of-ichchi",
    "completedStep": 0,
    "nextStep": 1
  },
  "timestamp": "2026-07-09T19:30:00Z",
  "version": "1.0",
  "roomId": "project:spirit-of-ichchi"
});
```

#### 2. Статус ввода текста в комнате (`typing_status`)
```json
socket.on("typing_status", {
  "userId": "usr-8a2bf",
  "email": "player@quest.com",
  "typing": true
});
```

#### 3. Синхронизационный пакет catch-up при переподключении (`sync_catchup`)
Доставляется один раз при успешном восстановлении связи.
```json
socket.on("sync_catchup", {
  "messages": [
    { "id": "evt-12", "sequence": 12, "type": "ChatMessage", "payload": { "text": "Hello" } },
    { "id": "evt-13", "sequence": 13, "type": "QuestUpdated", "payload": { "step": 2 } }
  ]
});
```
