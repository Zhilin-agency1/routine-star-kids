# Growee

> Это **статика** — что проект, из чего собран, где что лежит. Для динамики (как обрабатываются запросы и что в каком порядке вызывается) см. `pipeline.md` рядом. Парный файл для Codex — `AGENTS.md`. Держать оба синхронно по сути.

## Цель

Планировщик занятий и рутины для детей с удобным доступом для родителей. Дальняя цель — геймифицировать как «игру в жизнь»: прокачка детских навыков для подготовки к взрослой жизни — ответственность, внимание, целеполагание, обращение с финансами, понимание налогов и накоплений.

Стадия: **pre-launch**. Ближайшая итерация — выкатить версию для семьи Андрея, провести аудит работоспособности и зафиксить существующее. Новые фичи откладываются до first-use feedback.

Продукт гибридный: личное использование + подписочная модель в перспективе.

## Стек

- Язык: TypeScript 5.8 (`strict: false` в `tsconfig.app.json` — ошибки типов могут проскальзывать)
- Фреймворк: React 18.3 SPA, сборщик Vite 6.4 (поднят с 5.4 для закрытия esbuild dev-server CVE; vite 8 не подходит — требует Node 20.19+, на машине Node 20.11)
- UI: shadcn/ui (`components.json`) поверх Radix UI + Tailwind 3.4 + lucide-react
- Data layer: TanStack React Query 5.83 поверх Supabase JS client
- Routing: React Router 6.30 (`BrowserRouter`)
- Forms / валидация: react-hook-form 7.61 + zod 3.25
- DnD: @dnd-kit
- i18n: собственный `LanguageContext` + словарь `src/i18n/translations.ts`, языки RU/EN, persist в `localStorage['app_lang']`
- Backend: Supabase (Auth + Postgres + RLS), project ref `jafpmmldjsawheibkyoy` (имя `kids-routin-app`)
- Runtime: web на Vercel (project `kids-routine-app`), auto-deploy из `main`
- Package manager: **npm** (`package-lock.json` — источник истины). `bun.lockb` остался от инициализации, не используется

## Архитектура

Структура `src/`:

- `src/main.tsx` — entry, монтирует `<App />` в `#root`
- `src/App.tsx` — корневой провайдер-стек: `QueryClientProvider → AuthProvider → LanguageProvider → AppProvider → TooltipProvider → BrowserRouter`
- `src/pages/child/` — Today, Schedule, JobBoard, Store, MyRewards, Achievements
- `src/pages/parent/` — Dashboard, Children, Tasks, Templates, Store, JobBoard, Profile, Security
- `src/pages/AuthPage.tsx`, `src/pages/InviteAcceptPage.tsx` — public роуты
- `src/components/` — shared UI (Layout, Header, Sidebar, BottomNav, диалоги, карточки, guards: `ProtectedRoute` / `ParentOnlyRoute` / `FamilySetup`)
- `src/components/ui/` — низкоуровневые shadcn-обёртки над Radix
- `src/hooks/` — 21 кастомный хук, по одному на сущность (`useFamily`, `useChildren`, `useTasks`, `useTaskSteps`, `useStore`, `useJobBoard`, `useSchedule`, `useDayTemplates`, `useTransactions`, `useWishlist` и т.д.); каждый = react-query queries + mutations поверх Supabase client
- `src/contexts/AppContext.tsx` — глобальный стейт (role, currentChild, агрегированные tasks/store/jobs/activities + методы `completeTask`, `purchaseItem`, `takeJob`)
- `src/contexts/LanguageContext.tsx` — i18n state и `t()` хелпер
- `src/integrations/supabase/client.ts` — Supabase JS client (использует только anon key)
- `src/lib/` — `dateUtils.ts`, `utils.ts` (cn helper)
- `supabase/migrations/00000000000000_initial.sql` — единая консолидированная схема, ~20 таблиц с RLS

Главные сущности БД: `families`, `children`, `task_templates` → `task_instances` → `task_steps`/`task_step_completions`, `transactions`, `store_items` → `purchases`, `job_board_items` → `job_claims`, `activity_schedules`, `wishlists`, `day_templates`, `notifications`, `user_roles`, `family_members`, `icon_library`.

## Ключевые пути

- Входная точка: `index.html` → `src/main.tsx` → `src/App.tsx`
- Конфиги: `vite.config.ts` (dev-порт **3010**), `tsconfig.app.json`, `tailwind.config.ts`, `eslint.config.js`, `components.json` (shadcn), `supabase/config.toml`
- `.env`: `./.env` — **не читается агентами** (в deny-листе глобально). Ожидаемые ключи: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. `.env.example` отсутствует — стоит завести
- DB-схема: `supabase/migrations/00000000000000_initial.sql`
- Build output: `dist/` (в `.gitignore`)

## Интеграции

- **Supabase** — Auth, Postgres, Storage (если используется), RLS. Project ref `jafpmmldjsawheibkyoy`. В клиенте используется только anon key, `service_role` нигде в коде не задействован
- **Vercel** — auto-deploy из `main`, project id `prj_atJa2zsja8cxElimRuXy6Yz0FpDY`, team `team_LLZdaGWBQD0JbXrNDjQlW8IF`. `vercel.json` отсутствует, всё на дефолтах
- **GitHub remote** — `https://github.com/Zhilin-agency1/routine-star-kids.git` (имя репо устаревшее, расходится с `Growee` — переименовать перед запуском)
- **Web Push (план)** — для пользовательских уведомлений и инвайтов; пока не реализован
- **Invite flow** — UI на `/invite/:token` есть, отправляющая сторона ещё не доделана

## Git статус

- [x] Проект в git
- [x] Remote: `https://github.com/Zhilin-agency1/routine-star-kids.git`
- [x] Главная ветка: `main` — push в неё запускает Vercel auto-deploy
- [x] Working tree чистый. На момент бутстрапа локальный `main` опережает `origin/main` на 4 коммита (cleanup миграций, gitignore, Header icons, useTaskSteps onError) — push не делался, ждёт явной команды

## Команды

- Запуск локально: `npm run dev` → http://localhost:3010
- Production build: `npm run build` (выход в `dist/`)
- Dev build без минификации: `npm run build:dev`
- Preview production-сборки: `npm run preview`
- Lint: `npm run lint` (ESLint flat config)
- Тесты: **нет** — тестовый рантайм не подключён. Перед запуском для семьи стоит добавить хотя бы smoke-проверку

## Known issues / gotchas

- **Имя продукта расходится в трёх местах:** папка `Growee`, Supabase project `kids-routin-app` (с опечаткой), Vercel project и GitHub repo — `routine-star-kids` / `kids-routine-app`. До запуска свести к одному имени
- **TypeScript strict выключен** — ошибки типов могут уходить в прод незаметно
- **Тестов нет** — регрессии ловятся только глазами или в проде
- **`.env.example` отсутствует** — новый разработчик/агент не знает требуемых переменных
- **`bun.lockb` остался от инициализации** — фактически работает npm, лишний lockfile путает инструменты
- **Auto-генерация task instances** в `useTaskGeneration` срабатывает при заходе на Today-страницу; теоретически в параллельных табах может задвоить — проверить
- **RLS включён на всех таблицах** — любая новая миграция обязана добавлять политики, иначе UI молча возвращает пустые списки
- **Pre-launch:** пользователь давно не работал с проектом — часть фич может быть в полусломанном состоянии. Перед добавлением нового — аудит существующего
