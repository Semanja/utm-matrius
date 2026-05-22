# Перенос проекта на свой сервер

Если вдруг придётся уйти с Vercel и Turso — это можно. Проект на стандартных технологиях, ничего проприетарного. Ниже три сценария — от самого простого к самому сложному.

## Что у нас сейчас

- **Код**: Next.js 16 + React 19 + TypeScript + Tailwind 4 — лежит в [github.com/Semanja/utm-matrius](https://github.com/Semanja/utm-matrius)
- **БД**: Turso (libsql, облачный SQLite) — `libsql://utm-matrius-semanja.aws-us-east-1.turso.io`
- **Хостинг**: Vercel Hobby (бесплатно) — `utm-matrius.vercel.app`
- **Auth**: env vars `ADMIN_PASSWORD` + `ADMIN_SESSION_TOKEN`

Что нужно перенести: код, БД, env vars, домен.

---

## Сценарий A: Сменить только хостинг (БД на Turso оставляем)

Самый простой. Допустим Vercel закрылся / стал платным — переезжаем на Railway, Render, Fly.io или Cloudflare Pages.

### Railway (рекомендую — похож на Vercel)

1. Регистрируйся на [railway.app](https://railway.app) через GitHub
2. New Project → Deploy from GitHub repo → выбери `Semanja/utm-matrius`
3. После создания проекта зайди в Variables → добавь 4 env vars:
   - `TURSO_DATABASE_URL` = `libsql://...`
   - `TURSO_AUTH_TOKEN` = `...`
   - `ADMIN_PASSWORD` = твой пароль
   - `ADMIN_SESSION_TOKEN` = случайная строка 32 символа
4. Railway сам соберёт Next.js (определит автоматически)
5. В Settings → Domains → жми «Generate Domain» получишь `<имя>.up.railway.app`

Готово. Любой `git push` → Railway пересоберёт.

**Альтернативы**: Render.com (логика та же), Fly.io (требует Dockerfile), Cloudflare Pages (есть Functions для server-side).

### Стоимость
- Railway: $5/мес trial, дальше платно (~$5-20)
- Render: бесплатный план с засыпанием через 15 мин неактивности
- Fly.io: бесплатный тир для маленьких приложений

---

## Сценарий B: Свой VPS (Beget, Selectel, Timeweb)

Если хочется полный контроль и платить за месяц меньше чем за облако.

### Что нужно
- VPS с Ubuntu 22.04+, минимум 1 ГБ RAM, ~$3-5/мес
- Domain name (опционально)

### Шаги

**1. Подключиться к серверу по SSH**
```bash
ssh root@<ip>
```

**2. Установить Node.js 24, git, nginx, pm2**
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs git nginx
sudo npm install -g pm2
```

**3. Клонировать репо**
```bash
cd /var/www
git clone https://github.com/Semanja/utm-matrius.git
cd utm-matrius
npm install
```

**4. Создать `.env.local`**
```bash
nano .env.local
```
Содержимое:
```
TURSO_DATABASE_URL=libsql://utm-matrius-semanja.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=<твой токен>
ADMIN_PASSWORD=<новый пароль>
ADMIN_SESSION_TOKEN=<случайная строка 32 символа>
```

Сгенерировать случайный token:
```bash
openssl rand -base64 32
```

**5. Собрать и запустить через pm2**
```bash
npm run build
pm2 start npm --name utm-matrius -- start
pm2 save
pm2 startup  # выполнить команду что подскажет
```

Приложение крутится на порту 3000.

**6. Настроить nginx как reverse proxy**
```bash
sudo nano /etc/nginx/sites-available/utm
```

Содержимое:
```nginx
server {
    listen 80;
    server_name utm.example.com;  # твой домен

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активировать:
```bash
sudo ln -s /etc/nginx/sites-available/utm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**7. Настроить SSL (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d utm.example.com
```

**8. Привязать домен**
В DNS-настройках домена создай A-запись на IP сервера. Через 5-30 минут заработает.

### Обновление кода
```bash
cd /var/www/utm-matrius
git pull
npm install
npm run build
pm2 restart utm-matrius
```

---

## Сценарий C: Полный self-hosted (свой код + своя БД)

Если хочется уйти и от Turso тоже.

### Замена Turso → SQLite-файл (самое простое)

В `src/db/client.ts`:
```ts
import { createClient } from "@libsql/client";

export const db = createClient({
  url: "file:./data/utm.db",  // локальный файл вместо облачного
});
```

Удалить из `.env.local`:
- `TURSO_DATABASE_URL` (не нужен — путь зашит в код)
- `TURSO_AUTH_TOKEN` (не нужен — локальная БД)

Перенести данные из Turso в локальный файл:
```bash
# Из Vercel-проекта экспорт
turso db dump utm-matrius > dump.sql

# На своём сервере импорт
sqlite3 ./data/utm.db < dump.sql
```

Минус: нет автоматических бэкапов, файл нужно бэкапить руками (например, в S3 каждый день).

### Замена на PostgreSQL

Изменения сложнее — `@libsql/client` нужно заменить на `pg` или `postgres`. SQL почти весь совместим, кроме:
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- `datetime('now')` → `NOW()`
- `INTEGER` для boolean → `BOOLEAN`

Все запросы в `src/db/queries.ts`, `actions.ts` файлах админки и `lib/audit.ts` нужно проверить.

Это ~2-4 часа работы — миграция схемы + замена клиента + тестирование.

---

## Бэкап БД

**Сейчас (Turso)**:
```bash
turso db dump utm-matrius > backup-$(date +%Y%m%d).sql
```

Сохранять регулярно (раз в неделю минимум) — на свой компьютер или в облако.

**На своём SQLite-файле**:
```bash
sqlite3 ./data/utm.db ".backup './data/utm-$(date +%Y%m%d).db'"
```

Положить в cron на ежедневный запуск.

---

## Доступ к коду

Весь код в GitHub: https://github.com/Semanja/utm-matrius

Клонировать на любой компьютер:
```bash
git clone https://github.com/Semanja/utm-matrius.git
```

Если потеряется доступ к GitHub аккаунту — код можно скачать как zip-архив (Code → Download ZIP), потом залить в любой другой git-сервис (GitLab, Bitbucket, Gitea на своём сервере).

---

## Что НЕ переносится автоматически

- **Тема оформления** пользователей (хранится в localStorage браузеров) — пользователи увидят дефолт, надо настроить заново
- **Сессия админа** (cookie) — после переноса нужно зайти заново
- **Vercel auto-deploy** настройки — нужно настроить заново на новом хостинге

---

## Контрольный список перед миграцией

- [ ] Залезть в [Vercel Env Vars](https://vercel.com/semanjas-projects/utm-matrius/settings/environment-variables) и скопировать все значения в надёжное место
- [ ] Сделать дамп БД через Turso CLI или дашборд
- [ ] Убедиться что есть свежий push в GitHub (всё последнее закоммичено)
- [ ] Решить — переезжаем ли на новый домен или сохраняем старый (если старый — нужно перенастроить DNS)
- [ ] Поднять новый хостинг, протестировать
- [ ] Только после теста — переключить DNS

---

## Где гуглить если что-то не работает

- **Next.js деплой**: https://nextjs.org/docs/app/getting-started/deploying
- **Self-hosting Next.js**: https://nextjs.org/docs/app/getting-started/deploying#self-hosting
- **libsql / SQLite**: https://docs.turso.tech/
- **nginx reverse proxy**: https://nginx.org/en/docs/beginners_guide.html
- **PM2**: https://pm2.keymetrics.io/docs/usage/quick-start/

Или просто напиши Claude или другому AI: «у меня Next.js приложение, нужно перенести с Vercel на VPS Ubuntu, помоги» — он подскажет шаги конкретно под твою ситуацию.
