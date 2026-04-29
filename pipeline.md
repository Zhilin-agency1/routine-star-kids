# Pipeline — Growee

> Это **динамика** — как проект принимает запросы, как они маршрутизируются и куда идут. Статика (что такое проект, где файлы) — `CLAUDE.md` рядом.

## Точка входа

Это **web SPA** — никаких внешних webhooks или CLI-команд для бизнес-логики. Все запросы инициируются из браузера пользователя:

- Браузер → `index.html` → `main.tsx` → React app (порт 3010 в dev, Vercel в prod)
- Пользователь авторизуется через `AuthPage` (`/auth`) → Supabase Auth выдаёт JWT
- React Query + Supabase JS client отправляют запросы напрямую в Supabase REST/Realtime API с anon key + JWT в заголовке
- Все авторизационные проверки на стороне БД через **RLS-политики**

Дополнительный вход — `/invite/:token` (`InviteAcceptPage`) для присоединения к существующей семье по ссылке.

## Маршрутизация

Все защищённые роуты обёрнуты в `<ProtectedRoute>` → `<FamilySetup>` → `<Layout>`. Parent-only роуты дополнительно в `<ParentOnlyRoute>`.

**Public:**

| Путь | Компонент | Назначение |
|---|---|---|
| `/auth` | `AuthPage` | Login / Register |
| `/invite/:token` | `InviteAcceptPage` | Приём инвайта в семью |

**Child / Family:**

| Путь | Компонент | Назначение |
|---|---|---|
| `/` | `Index` (FamilyTodayPage) | Дневные задачи и активности |
| `/schedule` | `FamilySchedulePage` | Недельное расписание занятий |
| `/exchange` | `FamilyJobBoardPage` | Доска дополнительных задач |
| `/store` | `StorePage` | Магазин наград |
| `/rewards` | `MyRewardsPage` | История покупок и достижений |
| `/achievements` | `FamilyAchievements` | Достижения |

**Parent only:**

| Путь | Компонент | Назначение |
|---|---|---|
| `/parent` | `Dashboard` | Главный экран родителя |
| `/parent/children` | `ChildrenPage` | Управление детьми |
| `/parent/tasks` | `TasksPage` | Шаблоны задач |
| `/parent/templates` | `TemplatesPage` | Шаблоны дня |
| `/parent/store` | `ParentStorePage` | Управление магазином |
| `/parent/jobs` | `ParentJobBoardPage` | Управление доской задач |
| `/parent/profile` | `ProfilePage` | Профиль, инвайты в семью |
| `/parent/security` | `SecurityPrivacyPage` | Приватность, удаление аккаунта |

## Правила принятия решений

- **Если** пользователь не авторизован → `<ProtectedRoute>` редиректит на `/auth`.
- **Если** авторизован, но нет связанной семьи → `<FamilySetup>` показывает онбординг создания/присоединения к семье.
- **Если** роль не `parent` (по `user_roles` в БД) → `<ParentOnlyRoute>` блокирует доступ к `/parent/*` и показывает сообщение.
- **Если** в `AppContext` `role === 'child'` → шапка и навигация сворачиваются под детский режим (Header/BottomNav).
- **Если** `currentChild` не выбран при множестве детей → UI задач/store работает в агрегированном режиме (`useAllTodayTasks`, `useAggregatedWishlists`).
- **Любая мутация** проходит через хук в `src/hooks/`, который вызывает Supabase mutation; RLS на стороне БД — последняя линия защиты.
- **Когда поведение неоднозначно** (например, удалить ребёнка с активными задачами) → диалог подтверждения перед мутацией, не «гадаем по умолчанию».

## Worked examples

### Example 1: Ребёнок выполняет задачу из сегодняшнего расписания

Вход: ребёнок открывает `/` → `FamilyTodayPage`.

Прохождение:
1. `useTaskGeneration` срабатывает на mount страницы — проверяет, есть ли task_instances на сегодня для этого `child_id`. Если нет — генерирует из активных `task_templates` с `recurring_rule` (daily / weekly / monthly).
2. `useTasks` загружает task_instances + linked task_templates для `currentChild.id` и сегодняшней даты через react-query.
3. UI рендерит карточки задач (`TaskCard`). Если у задачи есть `task_steps` — показывает чекбоксы шагов через `useTaskSteps` / `useStepCompletions`.
4. Ребёнок отмечает шаги → `toggleStepCompletion` пишет в `task_step_completions`. Когда все шаги отмечены, или ребёнок жмёт «Готово» — `completeTask` ставит `task_instances.state = 'done'` и `completed_at = now()`.
5. Триггер БД (см. миграцию) создаёт запись в `transactions` с `type='earn'`, `amount = template.reward_amount`, обновляет `children.balance`.
6. React Query инвалидирует `['task_instances']` и `['transactions']` → UI перерисовывается.

Выход: задача в зелёной колонке, баланс ребёнка увеличен, конфетти (`Confetti` компонент).

### Example 2: Родитель применяет day template

Вход: родитель открывает `/parent/templates`, жмёт «Применить шаблон» на конкретный день.

Прохождение:
1. `useDayTemplates` загружает list templates со связанными `day_template_tasks`.
2. Диалог `ApplyTemplateDialog` спрашивает: к какому ребёнку, на какую дату, какие из задач шаблона включить.
3. Mutation создаёт массив `task_instances` за один запрос (RLS проверяет, что `family_id` шаблона = `family_id` родителя).
4. После успеха — toast + react-query invalidate.

### Example 3: Failure mode — Supabase недоступен

- Все хуки настроены через react-query. При ошибке fetch — мутация/запрос возвращает error, на UI отображается `Sonner` toast с сообщением.
- В `src/hooks/useTaskSteps.ts` явно прописан `onError: (error) => console.error(...)` для toggle step completion (добавлено в коммите `8fe4506`).
- Если `useTaskGeneration` падает — сегодняшние задачи не появятся, но старые видны (graceful degradation, не блокируем UI).

## Точки остановки

Где система **не** действует автоматически — требует явного подтверждения от пользователя:

- Удаление ребёнка из семьи (есть зависимости в task_instances, transactions, purchases)
- Удаление аккаунта / семьи (через `/parent/security`)
- Применение day template к ребёнку (диалог `ApplyTemplateDialog`)
- Покупка из магазина (двухстадийная: child делает request → parent approve в Parent Store)
- Любая операция, которая может затронуть >1 ребёнка одновременно

## Anti-patterns

- **Не вызываем Supabase напрямую из компонента** — только через хук в `src/hooks/`. Иначе теряем react-query кеш и инвалидацию.
- **Не пишем строки в JSX без i18n** — добавляем ключ в `src/i18n/translations.ts` (оба языка).
- **Не редактируем `00000000000000_initial.sql`** — для новых изменений схемы создаём новую миграцию с timestamped именем.
- **Не добавляем таблицу без RLS-политики** — UI начинает молча возвращать пустоту, баг неотлавливаемый без проверки политик.
- **Не плодим новые top-level Context'ы** — расширяем `AppContext` или используем react-query.
- **Не используем `service_role` Supabase ключ в клиенте** — это публичный SPA, утечка ключа = утечка всех данных.
- **Не делаем «попутный рефакторинг»** в pre-launch — у владельца нет ресурса ревьюить лишние изменения. Минимальное изменение под задачу.
