# Growee

> Codex-слой проекта. Парный с `CLAUDE.md` (тот — для Claude Code). Оба файла описывают один и тот же проект; держать синхронно по сути, расхождения только в формулировках под целевого агента. Динамика — `pipeline.md`. Roadmap по чанкам — `implementation-plan.md` (создаётся под крупные задачи).

This file refines the global rules from `~/.codex/AGENTS.md` with repo-specific context. Session-specific user instructions override both when they conflict.

## Purpose

Планировщик занятий и рутины для детей с удобным доступом для родителей. Дальняя цель — геймифицировать как «игру в жизнь»: прокачка навыков (ответственность, внимание, целеполагание, финансы, налоги/накопления).

Stage: **pre-launch**. Текущий приоритет — выкатить версию для семьи владельца. Сначала аудит и фикс существующего, новые фичи — после первого реального использования.

Гибридный продукт: личное использование + подписочная модель.

## Project Map

- `CLAUDE.md` — статика проекта (Claude-слой, парный с этим файлом)
- `pipeline.md` — runtime flow и worked examples
- `implementation-plan.md` — roadmap и чанки (если задача крупная)
- `SESSION_TEMPLATE.md` — стартер для нового чата (агент-агностичный)

## Stack

- Languages: TypeScript 5.8 (`strict: false`)
- Framework: React 18.3 SPA, build с Vite 6.4 (vite 8 несовместим — требует Node 20.19+)
- UI: shadcn/ui + Radix UI + Tailwind 3.4 + lucide-react
- Data: TanStack React Query 5.83 over Supabase JS client
- Routing: React Router 6.30
- Forms: react-hook-form + zod
- DnD: @dnd-kit
- i18n: custom `LanguageContext` + `src/i18n/translations.ts` (RU/EN)
- Backend: Supabase (Auth + Postgres + RLS), project `kids-routin-app` (`jafpmmldjsawheibkyoy`)
- Runtime: Vercel (auto-deploy from `main`), package manager npm

## Architecture

Pattern: **SPA с провайдер-стеком + per-entity hook layer**.

- `src/main.tsx` — mount entry
- `src/App.tsx` — providers: QueryClient → Auth → Language → AppContext → Tooltip → BrowserRouter
- `src/pages/child/*`, `src/pages/parent/*` — page components, разделены по роли
- `src/components/`, `src/components/ui/` — shared UI и shadcn-обёртки
- `src/hooks/use*.ts` — domain hooks (один на сущность БД), каждый = queries + mutations через Supabase
- `src/contexts/AppContext.tsx` — глобальный role/currentChild/aggregated state
- `src/integrations/supabase/client.ts` — Supabase client (anon key only)
- `supabase/migrations/00000000000000_initial.sql` — единая схема (~20 таблиц с RLS)

## How To Work Here

- Default запуск: `npm run dev` (порт 3010). Build: `npm run build`. Lint: `npm run lint`. Тестов нет.
- Сохраняй паттерн «one hook per entity». Не вызывай Supabase напрямую из компонента — добавь/расширь хук в `src/hooks/`.
- Для новых таблиц/колонок — обязательно новая миграция в `supabase/migrations/`. **Не редактируй** `00000000000000_initial.sql` — добавляй новый файл с timestamped именем.
- Любая новая таблица должна иметь RLS-политики. Без них UI получит пустоту молча.
- Новые UI-компоненты — через shadcn (`npx shadcn@latest add <component>`). Не вводи параллельную UI-библиотеку.
- i18n: добавляй ключи и в `ru`, и в `en` в `src/i18n/translations.ts`. Не хардкодь строки в JSX.
- Не плоди новые верхнеуровневые контексты помимо AppContext / LanguageContext / Auth — расширяй существующие или используй react-query.

## Secrets

- Секреты в `.env`, не в коммитах.
- Не читай `.env`, `.env.*`, `.env.backup` — они в глобальном deny-листе.
- Не печатай и не суммируй значения секретов.

Expected secret names:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` в коде клиента не используется и не должен использоваться (это публичный SPA, service-role привёл бы к утечке).

## Integrations

- **Supabase** — Auth + Postgres + Storage + RLS. Через `@supabase/supabase-js` в `src/integrations/supabase/client.ts`. Только anon key.
- **Vercel** — auto-deploy из `main`. `.vercel/project.json` локально, `vercel.json` нет (defaults).
- **GitHub remote**: `Zhilin-agency1/routine-star-kids` (legacy name).
- **Web Push** — план, не реализован.
- **Invite email/web push** — план для invite flow (страница `/invite/:token` уже есть).

## Known Constraints

- **TypeScript strict off** — `as` casts и `any` могут попадаться. Перед серьёзными изменениями в типах попроси подтверждение, не включай strict в одиночку.
- **Нет тестов** — единственная защита от регрессий — глаза + `npm run lint`. Перед запуском для семьи владельца — добавить хотя бы smoke E2E.
- **RLS повсюду** — анализируя баг «не видны данные», первый подозреваемый не код, а политика.
- **`bun.lockb` legacy** — игнорировать его, использовать `package-lock.json`.
- **Имя продукта рассинхронизировано** в Supabase (`kids-routin-app`), Vercel/GitHub (`routine-star-kids` / `kids-routine-app`), folder (`Growee`). Не пытайся это «исправить» одной правкой — переименование внешних сущностей требует ручных шагов в Supabase/Vercel/GitHub UI.

## Commands

Preferred:
- `npm run dev` (порт 3010)
- `npm run build` / `npm run preview`
- `npm run lint`

Setup if cloning fresh:
- `npm install`
- Создать `.env` с `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY` (значения — у владельца проекта)

## Codex-Specific Guidance

- `CLAUDE.md` — валидный проектный контекст, парный к этому файлу.
- Search через `rg` (быстрее grep). Для правки путей `src/hooks/` смотри сразу несколько хуков — они однотипные, паттерн виден из соседей.
- Не делай рефакторинг вне задачи: пользователь не разработчик и не сможет ревьюить «попутные улучшения». Минимальное изменение — лучшее изменение.
- При правках runtime-логики верифицируй ассумпции в `supabase/migrations/00000000000000_initial.sql`, `src/contexts/AppContext.tsx`, `pipeline.md`.
- При смене схемы БД — новая миграция + RLS-политики, обновить `pipeline.md` если меняется flow.
