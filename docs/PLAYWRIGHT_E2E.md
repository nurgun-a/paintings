# Спецификация сквозных тестов (End-to-End Playwright Spec)

В данном документе описывается автоматизированный тестовый сценарий сквозного прохождения квеста (End-to-End) с использованием библиотеки **Playwright**, имитирующий реальное поведение игрока от регистрации до финальной победы.

---

## 🎭 1. Сценарий тестирования (E2E Test Flow)

Тест автоматически воспроизводит действия пользователя на мобильном телефоне и проверяет интеграцию всех внутренних движков:

```typescript
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 14 Pro'] }); // Имитация мобильного PWA-клиента

test('Полное сквозное прохождение квеста "Дух Иччи"', async ({ page }) => {
  // -----------------------------------------------------------------
  // ЭТАП A: Регистрация и вход
  // -----------------------------------------------------------------
  await page.goto('http://localhost:3000/');
  
  // Переход на вкладку регистрации
  await page.click('id=tab-register');
  await page.fill('id=input-register-name', 'Авто-Игрок 2026');
  await page.fill('id=input-register-email', 'auto_player_2026@quest.com');
  await page.fill('id=input-register-password', 'SecurePassword2026!');
  await page.click('id=btn-register-submit');
  
  // Ожидание перехода в личный кабинет игрока
  await expect(page.locator('id=player-dashboard')).toBeVisible();
  
  // -----------------------------------------------------------------
  // ЭТАП B: Выбор квеста и старт первого шага
  // -----------------------------------------------------------------
  await page.click('id=btn-start-quest-spirit-of-ichchi');
  await expect(page.locator('id=active-quest-screen')).toBeVisible();
  
  // Первый шаг: Текстовая загадка
  await expect(page.locator('id=step-title')).toContainText('Загадка Хранителя Леса');
  await page.fill('id=input-step-text-answer', 'рысь');
  await page.click('id=btn-step-submit');
  
  // Ожидание уведомления об успешном прохождении и начислении наград
  await expect(page.locator('id=toast-success-message')).toContainText('Ответ верен');
  
  // -----------------------------------------------------------------
  // ЭТАП C: ИИ-Чат с ассистентом (AI Engine)
  // -----------------------------------------------------------------
  await page.click('id=btn-toggle-ai-chat');
  await page.fill('id=input-chat-message', 'Шаман, подскажи, куда идти дальше?');
  await page.click('id=btn-chat-send');
  
  // Ожидание ответа от ИИ (ограничение таймаута - 8 секунд)
  const aiResponse = page.locator('id=chat-message-ai-latest');
  await expect(aiResponse).toBeVisible({ timeout: 8000 });
  await expect(aiResponse).not.toBeEmpty();
  
  // -----------------------------------------------------------------
  // ЭТАП D: Сканирование QR-кода (Vision Engine - QR)
  // -----------------------------------------------------------------
  // Имитируем успешное декодирование QR кода, отправляя событие во внутренний контроллер сканера
  await page.evaluate(() => {
    // Вызываем глобальную функцию-симуляцию камеры в тестовом режиме
    (window as any).simulateQRScan('QUEST-QR:SECRET-ALTAR-2026');
  });
  
  await expect(page.locator('id=toast-success-message')).toContainText('QR-код принят');
  
  // -----------------------------------------------------------------
  // ЭТАП E: Загрузка фото-подтверждения (Vision Engine - OCR / Similarity)
  // -----------------------------------------------------------------
  // Загружаем тестовое изображение природы
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click('id=btn-camera-upload-trigger');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles('./assets/test_nature_view.png');
  
  // Ожидание завершения анализа ИИ-зрением
  await expect(page.locator('id=verification-status-badge')).toContainText('Верифицировано', { timeout: 10000 });
  
  // -----------------------------------------------------------------
  // ЭТАП F: Повышение уровня и разблокировка достижений
  // -----------------------------------------------------------------
  // Проверяем отображение нового звания и уровня в шапке профиля игрока
  await expect(page.locator('id=player-level-badge')).toHaveText('Level 2');
  await expect(page.locator('id=player-rank-label')).toContainText('Проводник духов');
  
  // Проверяем, что достижение появилось в списке наград
  await page.click('id=btn-open-achievements');
  await expect(page.locator('id=achievement-nature-explorer')).toBeVisible();
  
  // -----------------------------------------------------------------
  // ЭТАП G: Финал и победа
  // -----------------------------------------------------------------
  // Выполняем финальный шаг и проверяем победный экран
  await page.click('id=btn-claim-victory');
  await expect(page.locator('id=victory-screen')).toBeVisible();
  await expect(page.locator('id=victory-xp-reward')).toContainText('+500 XP');
});
```

---

## ⚙️ 2. Конфигурация запуска тестов в CI/CD (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13 Pro'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
```
