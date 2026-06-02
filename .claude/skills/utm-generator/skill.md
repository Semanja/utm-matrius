# UTM Generator

Пошаговый мастер для сборки UTM-меток по правилам компании. Два бренда в одном приложении — Matrius и Zerocoder.

**Деплой:** https://utm-matrius.vercel.app

## Структура

```
src/
├── app/
│   ├── admin/           # админка (сайты, каналы, размещения, история)
│   │   ├── channels/    # управление каналами
│   │   ├── history/     # журнал изменений + откат
│   │   ├── placements/  # места размещения (для гайдов)
│   │   ├── sites/       # сайты + массовый импорт
│   │   ├── layout.tsx
│   │   └── page.tsx     # главная админки со статистикой
│   ├── api/             # API-маршруты
│   │   ├── admin/       # CRUD для справочников
│   │   └── auth/        # вход/выход/переключение компании
│   ├── login/           # страница входа в админку
│   ├── layout.tsx
│   ├── page.tsx         # главная — точка входа в мастер
│   └── globals.css      # CSS-переменные всех 5 тем
├── components/
│   ├── admin/           # компоненты админки
│   │   ├── AdminNav.tsx
│   │   ├── CompanySwitcher.tsx
│   │   └── LogoutButton.tsx
│   ├── Wizard.tsx       # корневой мастер (шаги: компания → тип → ветка)
│   ├── BranchAnonse.tsx # ветка «Анонс» (самая сложная)
│   ├── BranchSmm.tsx    # ветка «СММ»
│   ├── BranchGuide.tsx  # ветка «Гайд»
│   ├── BranchAds.tsx    # ветка «Реклама»
│   ├── BranchSimple.tsx # ветки: Воронка, Внешние, Блог, Геткурс
│   ├── ManualUtmForm.tsx  # ручная форма
│   ├── EditableUtm.tsx  # редактор UTM-строки «паровозик»
│   ├── CustomSiteFinishButtons.tsx  # кнопки для кастомного сайта
│   └── ThemeSwitcher.tsx  # 5 тем оформления
├── db/
│   ├── client.ts        # клиент Turso/libsql
│   ├── queries.ts       # типы и запросы
│   └── schema.sql       # схема БД
├── lib/
│   ├── admin-company.ts  # какая компания выбрана в админке
│   ├── audit.ts          # логирование изменений
│   ├── auth.ts           # проверка сессии
│   ├── translit.ts       # транслитерация для гайдов
│   ├── utm.ts            # сборка UTM + encode с сохранением плейсхолдеров
│   └── wizard-actions.ts # server actions для сохранения сайтов из мастера
├── middleware.ts          # защита /admin/*
└── scripts/
    ├── migrate.ts        # миграция схемы
    ├── seed.ts           # тестовые данные
    └── verify-utm.ts     # верификация меток
```

## Логика работы

### Wizard (src/components/Wizard.tsx)
Корневой мастер. Шаги:
1. **Company** — выбор компании (Matrius / Zerocoder)
2. **TaskType** — выбор типа задачи (9 вариантов)
3. **Branch** — ветка под конкретный тип задачи

Если компания не настроена (нет каналов) или выбран «Свой вариант» — открывается ручная форма ManualUtmForm.

### Ветки
Каждая ветка (Branch*.tsx) — многошаговая форма с кастомной логикой:
- **Anonse** — платформа → канал → сайт → дата → результат
- **Smm** — как анонс, но utm_content = "smm"
- **Guide** — выбор сайта + места размещения + дата
- **Ads** — выбор ответственного (канал) → площадка (другой канал) → сайт
- **Simple** — универсальная: канал → сайт → дата → результат

### UTM (src/lib/utm.ts)
- `buildUtm()` — собирает URL из baseUrl + параметров
- `encodePreservePlaceholders()` — кодирует URI, но сохраняет `{плейсхолдеры}` для рекламных систем
- `extractUrlSlug()` — достаёт хвост URL для utm_campaign

### Компании
- **Matrius** — utm_term с префиксом `date_`, utm_campaign = хвост URL
- **Zerocoder** — utm_term без префикса (только дата), utm_campaign = тег активности

### Темы (src/components/ThemeSwitcher.tsx)
5 тем: светлая, тёмная, Zerocoder, Matrius, своя.
Своя тема сохраняется в localStorage, цвет пикер с предпросмотром.

### Админка
CRUD для сайтов, каналов, мест размещения.
Массовый импорт сайтов из TSV/CSV (BulkImport.tsx).
Журнал изменений с откатом (аудит + rollback).

### БД
SQLite через Turso/libsql.
Схема: companies, sites, channels, placements, audit_log, admin_users.
Мягкое удаление (deleted_at) для восстановления.

### Аутентификация
Cookie-сессия (ADMIN_SESSION_TOKEN из .env).
Middleware защищает /admin/*, редиректит на /login.

### Разработка

```bash
npm run dev          # локальный сервер :3000
npm run db:migrate   # применить схему
npm run db:seed      # тестовые данные
npm run build        # сборка
npm run lint         # eslint
```

## Типовые изменения

### Добавить новую компанию
1. Добавить запись в таблицу `companies`
2. Наполнить каналы и сайты через админку
3. Если нужна особая логика — создать свою ветку Branch*.tsx
4. Добавить companySlug в Wizard.tsx → ALL_TASK_TYPES

### Добавить новый тип задачи
1. Добавить в `ALL_TASK_TYPES` в Wizard.tsx
2. Указать `companies: null` (для всех) или массив slug'ов
3. Создать Branch*.tsx или использовать BranchSimple
4. Добавить рендер условия в Wizard.tsx

### Добавить поле в UTM
1. Расширить `UtmParams` в `src/lib/utm.ts`
2. Добавить в `EditableUtm.tsx` поле ввода
3. Если нужно в ветках — обновить StepResult в Branch*.tsx

### Изменить правила компании
Логика в компонентах веток (Branch*.tsx) — смотреть `isZerocoder`.
Для utm_campaign / utm_term — в StepResult каждой ветки.

### Обновить тему
CSS-переменные в `globals.css`. Набор цветов для каждой темы в ThemeSwitcher.tsx.

## Проверка перед деплоем

- [ ] `npm run build` успешен
- [ ] `npm run lint` без ошибок
- [ ] Мастер проходит все 9 типов задач для обеих компаний
- [ ] Ручная форма работает
- [ ] Редактор «паровозик» собирает и копирует UTM
- [ ] Админка: CRUD сайтов, каналов, размещений
- [ ] Массовый импорт TSV/CSV
- [ ] Журнал изменений + откат
- [ ] Логин в админку, защита /admin/*
- [ ] 5 тем оформления применяются
- [ ] .env.local заполнен корректно

## Стек

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Turso (libsql) · Vercel
