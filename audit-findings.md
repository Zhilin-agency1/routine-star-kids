# Audit findings — Chunk 1 smoke

> Прокликано через Playwright (Chromium headless, 1280×900) на `npm run dev` (Vite 6.4 на :3010), реальный Supabase (`jafpmmldjsawheibkyoy`).
> Дата прохода: 2026-04-29. Тестовый юзер: `growee.audit.20260429152357@example.com`.
> Скриншоты: `/tmp/growee_shot_*.png`, `/tmp/growee_p2_*.png`, `/tmp/growee_p3_*.png`.

## Скоуп прохода

- ✅ Flow 1 — `/auth` signup + login (email confirmation off)
- ✅ Flow 2 — Family setup + add child через `/parent/children`
- ⚠️ Flow 3 — Parent area: 5 из 8 страниц рендерятся, 3 редиректят (см. B1)
- ⚠️ Flow 4 — Child area: 4 из 6 рендерятся, 2 дают 404 (см. B2)
- ⛔ Flow 5 — End-to-end task→balance→transaction: **не пройден полностью**, так как `/parent/templates` недостижим для свежего юзера (заблокировано B1+B3)

Никакого кода не менялось.

---

## Findings

| # | Флоу | Симптом | Серьёзность | Подозреваемая причина |
|---|---|---|---|---|
| B1 | Flow 3 (parent) | Newly-registered family owner лендится с `role='child'`. Sidebar показывает child-навигацию (Today/Schedule/Jobs/Store) даже на `/parent`; `/parent/templates`, `/parent/profile`, `/parent/security` редиректят на `/`. Чтобы попасть в parent-mode, юзер должен сам открыть User-icon dropdown в Header и выбрать «Parent» — нет онбординга или авто-детекта владельца семьи. | **blocker** | [src/contexts/AppContext.tsx:53](src/contexts/AppContext.tsx#L53) `useState<Role>('child')` без auto-detection через `useFamily().family.owner_user_id === user.id`. |
| B2 | Flow 4 (child) | `/rewards` и `/achievements` возвращают 404 (`NotFound` page). При этом файлы [src/pages/child/MyRewardsPage.tsx](src/pages/child/MyRewardsPage.tsx) и [src/pages/child/FamilyAchievements.tsx](src/pages/child/FamilyAchievements.tsx) **существуют**, но не зарегистрированы в роутере. Плана прохода без них нет. | **blocker** | [src/App.tsx:40-203](src/App.tsx#L40-L203) — отсутствуют `<Route>` записи для `/rewards` и `/achievements`. Orphan-pages после рефакторинга. |
| B3 | Перекрёсток Flow 1→3 | Role-state in-memory only, без localStorage. Reload любой ParentOnly-страницы (`/parent/templates|profile|security`) сбрасывает role на `'child'` → `ParentOnlyRoute` редиректит на `/`. Это будет триггериться у владельца семьи каждый раз после refresh, restart Chrome, перехода по deep-link. | **blocker** | Тот же [src/contexts/AppContext.tsx:53](src/contexts/AppContext.tsx#L53). Решение и B1, и B3 одной правкой: hydrate role из localStorage + auto-detect for family owner. |
| B4 | Flow 5 (E2E) | Невозможно надёжно пройти весь E2E «parent создаёт task template → ребёнок видит → балансы → транзакция», потому что `/parent/templates` заблокирован B1/B3 для свежего юзера, а после ручного role-toggle страница доступна только в рамках одной SPA-сессии без reload. Нужен повторный E2E-проход после фикса role. | **blocker (по плану)** | Зависит от B1+B3. |
| M1 | Sidebar / Parent nav | `AppSidebar.parentNavItems` не содержит ссылок на `/parent/children` и `/parent/templates` — даже с правильным `role='parent'` родитель не имеет UI-перехода на страницу управления детьми и шаблонами. На mobile `BottomNav.parentNavItems` дополнительно не содержит `/parent/security`. Нужно дойти URL вручную. | **major** | [src/components/AppSidebar.tsx:37-44](src/components/AppSidebar.tsx#L37-L44), [src/components/BottomNav.tsx:22-28](src/components/BottomNav.tsx#L22-L28). |
| M2 | Брендинг | UI везде показывает «Kids Routine» (sidebar header, header label, t('app_name')) вместо «Growee». Уже отмечено в CLAUDE.md как known issue, но пока запуск семьи под старым именем — это для них confusing. | **major** | Translation value `app_name`. Глобальная замена в `src/i18n/translations.ts` + проверка хардкодов. |
| M3 | A11y / Parent dashboard | На `/parent` Radix-консоль ругается `DialogContent requires a DialogTitle for accessibility` + `Missing Description or aria-describedby={undefined}`. Видимо в одном из диалогов на Dashboard (`TaskChooserDialog` / `AddChildDialog` / `ParentOnboardingDialog`) пропущен `<DialogTitle>` / `<DialogDescription>`. Скрин-ридерам страница недоступна. | **major** | Импорты диалогов в [src/pages/parent/Dashboard.tsx:15-18](src/pages/parent/Dashboard.tsx#L15-L18). |
| M4 | UX / `/exchange`, `/store` (child) | На обеих страницах рендерится инструкция "Select yourself to take a job" / "Select yourself to buy", **хотя ребёнок уже авто-выбран** и его аватар отрисован прямо рядом. Pre-launch family юзер увидит противоречие. | **major** | [src/pages/child/FamilyJobBoardPage.tsx](src/pages/child/FamilyJobBoardPage.tsx), [src/pages/child/StorePage.tsx](src/pages/child/StorePage.tsx) — placeholder-копия не учитывает auto-select из `AppContext` ([src/contexts/AppContext.tsx:68-72](src/contexts/AppContext.tsx#L68-L72)). |
| m1 | Loading state | [src/components/ProtectedRoute.tsx:20](src/components/ProtectedRoute.tsx#L20) использует hardcoded `«Загрузка…»` вместо `t()`. Английский юзер видит русскую строку при загрузке. | minor | i18n leak. |
| m2 | i18n / Header + Sidebar | "Sign in/out", "Management/Menu" — через `language === 'ru' ? 'X' : 'Y'` вместо `t()`. Дополнительно `AppSidebar` хранит **свой собственный** `translations` dict, дублируя `LanguageContext`. | minor | [src/components/Header.tsx:91](src/components/Header.tsx#L91), [src/components/Header.tsx:153](src/components/Header.tsx#L153), [src/components/AppSidebar.tsx:46-55](src/components/AppSidebar.tsx#L46-L55), [src/components/AppSidebar.tsx:75-77](src/components/AppSidebar.tsx#L75-L77), [src/components/AppSidebar.tsx:135](src/components/AppSidebar.tsx#L135), [src/components/AppSidebar.tsx:148](src/components/AppSidebar.tsx#L148). |
| m3 | i18n / ChildrenPage | Множество хардкоженных RU/EN-строк через ternary вместо `t()`: «Долгосрочные задачи», «Прогресс по дням», «Осталось N дн.», empty-state «Пока нет детей». | minor | [src/pages/parent/ChildrenPage.tsx:91](src/pages/parent/ChildrenPage.tsx#L91), [src/pages/parent/ChildrenPage.tsx:117](src/pages/parent/ChildrenPage.tsx#L117), [src/pages/parent/ChildrenPage.tsx:130-131](src/pages/parent/ChildrenPage.tsx#L130-L131), [src/pages/parent/ChildrenPage.tsx:152-153](src/pages/parent/ChildrenPage.tsx#L152-L153). |
| m4 | Family defaults | `useFamily.createFamily` defaults: `name='Моя семья'` (RU), `timezone='Europe/Moscow'`, `currency_name='Coins'` (EN). Mix локалей; не уважает выбранный язык интерфейса. | minor | [src/hooks/useFamily.ts:42-44](src/hooks/useFamily.ts#L42-L44). |
| m5 | Console / future flags | React Router v7 future-flag warnings (`v7_startTransition`, `v7_relativeSplatPath`) на каждой странице. Cosmetic, но мешают грепу логов и будут проблемой при апгрейде на RR v7. | minor | `App.tsx` — `<BrowserRouter>` без `future={{...}}` props. |
| m6 | Sidebar header «Toggle Sidebar» | Текст кнопки коллапса сайдбара — «Toggle Sidebar» (английский), не локализован. Видно даже в RU-режиме. | minor | shadcn `SidebarTrigger` — нужен i18n override либо aria-only label. |
| m7 | Network — aborted requests | Playwright фиксирует `net::ERR_ABORTED` для Supabase REST queries при быстрой навигации. Это **не баг**, а нормальное поведение TanStack Query (отмена in-flight на unmount). Включаю в чеклист только чтобы при следующем проходе не путать с реальными ошибками. | none (info) | TanStack Query default. |

---

## Что не успели в этом проходе

- Flow 5 E2E (см. B4) — после фикса B1+B3 надо повторить: parent создаёт template на `/parent/templates` → задача появляется в today для ребёнка → ставит шаги → балансы апдейтятся → parent видит транзакцию на Dashboard.
- `useTaskGeneration` параллельные табы (упомянуто в CLAUDE.md) — не воспроизведено в Playwright single-context. Перенести на Chunk 2 (Schema audit) либо отдельный stress-проход.
- Visual regression — скриншоты сделаны, но не сравнивались с baseline (нет baseline). Заведём в Chunk 4.
- InviteAcceptPage `/invite/:token` — не тестировалось (out of scope для семейной версии, см. plan «после запуска»).
- Wishlist UI — упомянут в схеме, но в плане Flow 4 не требуется. Не открывался.

## Schema/RLS issues

(Заполняется в Chunk 2 — Schema & RLS audit, по плану.)

---

## Прогресс по плану

- [x] Chunk 1 — Smoke audit (этот файл)
- [ ] Chunk 2 — Schema & RLS audit
- [ ] Chunk 3 — Per-flow fixes
- [ ] Chunk 4 — Pre-launch hardening
