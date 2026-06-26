# Трекер привычек — Telegram Mini App

Дизайн-болванка (skeleton) Telegram Web App, визуально повторяющая прототип
из Claude Design (`Habit Tracker.dc.html`). Статический SPA на **Vite + React +
TypeScript**, который раздаётся минимальным Express-сервером — готов к деплою на
**Railway**.

На данном этапе данные мокированные (`src/data.ts`) — это каркас под подключение
реального бэкенда.

## Экраны

- **Сегодня** — селектор недели с кольцами прогресса, баннер «Идеальный день»,
  карточки привычек со стриками, тап по карточке отмечает выполнение (+ хаптик).
- **Активность** — расход ккал, сегментный бар, список тренировок.
- **Питание** — ккал за день, бары БЖУ, список приёмов пищи.
- **Календарь** — месяц с кольцами прогресса по дням, статы серий.
- **Настройки** — переключатель светлой/тёмной темы, тоглы уведомлений.

## Дизайн-токены

Светлая/тёмная палитра вынесена в `src/theme.ts` (взята 1:1 из прототипа):
акцент `#F26B7A → #F2994A`, шрифт Nunito. Тема подхватывается из Telegram
(`colorScheme` / событие `themeChanged`) и применяется как CSS-переменные.

## Локальный запуск

```bash
npm install
npm run dev        # http://localhost:5173 (откроется в обычном браузере)
```

Вне Telegram SDK-вызовы безопасно деградируют (no-op), так что верстку можно
смотреть прямо в браузере.

Прод-сборка локально:

```bash
npm run build      # tsc + vite build -> dist/
npm start          # express отдаёт dist/ на :3000 (или $PORT)
```

## Деплой на Railway

1. Запушь репозиторий на GitHub (или используй `railway up` из CLI).
2. В Railway создай проект из репозитория. Конфиг уже есть в `railway.json`:
   - build: `npm run build`
   - start: `npm start` (сервер слушает `process.env.PORT`)
3. После деплоя Railway выдаст HTTPS-домен, например
   `https://<app>.up.railway.app`.

## Подключение к боту (Telegram)

1. В [@BotFather](https://t.me/BotFather): `/newapp` (или `/myapps`) → выбери бота.
2. Укажи **Web App URL** = HTTPS-домен с Railway.
3. Открой Mini App через кнопку меню бота / inline-кнопку с `web_app`.

`index.html` уже подключает `https://telegram.org/js/telegram-web-app.js`, а
`src/telegram.ts` вызывает `ready()` / `expand()` и синхронизирует цвета шапки/фона.

## Структура

```
src/
  App.tsx              # роутер экранов + управление темой
  telegram.ts          # обёртка над Telegram WebApp SDK
  theme.ts             # дизайн-токены (light/dark) + палитра привычек
  icons.tsx            # Lucide-подобные SVG-иконки
  data.ts              # мок-данные
  components/          # BottomNav, Header, DaySelector
  screens/             # Today, Activity, Food, Calendar, Settings
server.js              # express-сервер для прод-раздачи dist/
railway.json           # конфиг деплоя
```
