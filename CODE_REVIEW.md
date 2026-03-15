# Code Review — Agent Passport

Ты проводишь независимое code review проекта **Agent Passport** — on-chain identity и trust verification система для AI-агентов на TON blockchain. Проект использует SBT (Soulbound Token, TEP-85) для выпуска непередаваемых "паспортов" агентов.

## Стек

- **Контракты:** Tact (компилируется в FunC → TVM), Blueprint + Sandbox для тестов
- **SDK:** TypeScript, tonapi-sdk-js, @ton/core
- **Telegram Bot:** grammY v1, @grammyjs/conversations v2, Express API
- **Mini App:** Vite + React, @telegram-apps/sdk-react, @tonconnect/ui-react
- **Web Dashboard:** Next.js 16 (App Router), Tailwind v4, TanStack Query, @tonconnect/ui-react
- **Сеть:** TON testnet

## Структура монорепо

```
contracts/           — 2 Tact-контракта (registry + passport)
tests/               — Sandbox-тесты (16 тестов)
wrappers/            — Авто-сгенерированные Tact-обёртки
scripts/             — Deploy + mint скрипты
packages/
  sdk/               — @agent-passport/sdk (~550 строк)
  bot/               — Telegram бот + HTTP API (~800 строк)
  mini-app/          — Telegram Mini App (Vite + React, ~10 компонентов)
  web/               — Next.js dashboard (~100+ файлов)
```

---

## На что обратить внимание

### 1. БЕЗОПАСНОСТЬ (критично)

#### 1.1 Приватные ключи и мнемоника
- `packages/bot/src/services/directWallet.ts` — мнемоника загружается из `process.env.MNEMONIC`, разбивается в массив, передаётся в `mnemonicToPrivateKey()`. Приватный ключ хранится в памяти на весь lifetime процесса. Никогда не очищается.
- Проверь: есть ли `.env` файлы в `.gitignore`? Нет ли случайных коммитов с секретами в истории?

#### 1.2 CORS
- `packages/bot/src/api.ts` — Express API использует `cors({ origin: '*' })`. Любой домен может вызвать `/api/mint`, `/api/public-mint-payload`, `/api/reputation/:address`.
- Вопрос: почему mint endpoint доступен с любого origin? Достаточно ли API-ключа для защиты?

#### 1.3 Admin API Key
- `packages/bot/src/api.ts` — `/api/mint` защищён простым сравнением строк: `req.headers['x-api-key'] === config.adminApiKey`. Нет ротации, нет expiration, нет rate limiting по ключу (только по IP).
- Если ключ утёк — полный доступ к минту паспортов от имени registry.

#### 1.4 Type safety в catch-блоках
- `packages/bot/src/api.ts` строки 85, 141, 234 — `catch (error: any)`, затем `error.message` без type guard. Может раскрыть внутренние детали в HTTP-ответе.

#### 1.5 Number overflow
- `packages/sdk/src/passport.ts` строки 49-51, 62-64 — `Number()` conversion на uint64 значениях из блокчейна. JavaScript Number максимум 2^53-1. TON значения могут быть больше. Нужен BigInt.

---

### 2. АРХИТЕКТУРА И ДУБЛИРОВАНИЕ

#### 2.1 Trust Score в трёх местах
Одна и та же логика расчёта trust score:
- `packages/bot/src/services/reputation.ts` (59 строк)
- `packages/mini-app/src/utils/reputation.ts` (дублирует бота)
- Хардкод формулы: existence(20) + activity(tx*4, max 40) + age(days, max 20) + capabilities(count*5, max 20)

Проверь: совпадают ли формулы во всех трёх местах? Что если одну обновят, а другие нет?

#### 2.2 Formatting утилиты
`format.ts` существует в трёх пакетах (bot, mini-app, web) с перекрывающейся логикой (форматирование адресов, capabilities, дат). Должно быть в SDK.

#### 2.3 Хардкод опкодов
- `packages/bot/src/services/mint.ts` — опкод MintPassport: `3867318038`
- `packages/bot/src/api.ts` — опкод PublicMintPassport: `534822672`
- Эти значения должны экспортироваться из Tact wrappers или быть константами.

---

### 3. ХАРДКОД URL И АДРЕСОВ

#### 3.1 IP-адрес в коде
- `packages/bot/src/index.ts` строка 28: `https://194-87-31-34.sslip.io/mini-app/`
- Тот же URL в `handlers/start.ts`, `handlers/app.ts`, `handlers/connect.ts`
- Должен быть env-переменной.

#### 3.2 Registry address
- Bot: `process.env.REGISTRY_ADDRESS!` — крашится если нет
- Web: `process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? 'EQplaceholder000...'` — молча использует плейсхолдер
- Mini-app: хардкод в `utils/contract.ts`
- Три разных подхода к одному адресу.

#### 3.3 TonConnect manifest
- Web: `https://agent-passport.example.com/tonconnect-manifest.json` как default — нерабочий URL
- Mini-app: свой хардкод в `utils/contract.ts`

---

### 4. ОБРАБОТКА ОШИБОК

#### 4.1 Тихие fallback'ы в SDK
- `packages/sdk/src/client.ts` строки 104-106, 139-141 — при сетевой ошибке возвращает пустой массив `[]` вместо throw. Невозможно отличить "нет результатов" от "сеть недоступна".
- `packages/sdk/src/verify.ts` — возвращает `false` на любую ошибку. Сетевая ошибка = "не верифицирован".

#### 4.2 Fetch без timeout
- `packages/sdk/src/registry.ts` строка 113 — `fetch(metadataUrl)` без timeout. Может зависнуть навсегда.
- Нет проверки что метаданные — валидный JSON по TEP-64.

#### 4.3 Нет retry стратегии в SDK
- Bot имеет retry (3 попытки с exponential backoff в directWallet.ts), но SDK запросы к tonapi — single attempt.

---

### 5. КОНТРАКТЫ (Tact)

#### 5.1 Ревью контрактов
- `contracts/agent_registry.tact` (215 строк) — коллекция, минт, fee collection
- `contracts/agent_passport.tact` (269 строк) — SBT, owner/capabilities/endpoint/metadata

Проверь:
- Соответствие TEP-85 (SBT): `transfer` должен быть отключен, `prove_ownership` и `request_owner` обязательны
- Авторизация: только authority может `IncrementTxCounter`, `UpdateCapabilities`, `Revoke`
- Reentrancy: есть ли проблемы с порядком state changes vs external calls?
- Gas: достаточно ли остатка на сообщения? Нет ли unbounded loops?
- Public mint: `PublicMintPassport` — проверяется ли оплата `mintFee`?

#### 5.2 Тесты контрактов
- `tests/AgentRegistry.spec.ts` — 16 тестов. Покрывают mint, revoke, proxy messages.
- Проверь: есть ли тесты на edge cases? Двойной минт одному owner? Revoke несуществующего? Mint с недостаточным fee?

---

### 6. ТЕСТЫ И ПОКРЫТИЕ

- **Контракты:** 16 тестов (Sandbox) — единственное место с нормальным покрытием
- **SDK:** 1 файл (`sdk.spec.ts`) — базовая инициализация, нет тестов ошибок
- **Bot:** 0 тестов — API endpoints, handlers, conversations не тестируются
- **Mini-app:** 0 тестов
- **Web:** 0 тестов

Вопросы:
- Насколько критично отсутствие тестов для hackathon-проекта?
- Какие тесты дали бы максимум value при минимуме усилий?

---

### 7. DEAD CODE

- `packages/bot/src/services/wallet.ts` (38 строк) — legacy TonConnect wallet service, заменён на `directWallet.ts`. Импортируется но не вызывается.
- `packages/sdk/src/utils.ts` — `isValidTonAddress()` определён но почти не используется (валидация через `Address.parse()` try-catch).
- `packages/bot/src/handlers/mint.ts` (9 строк) — stub, просто редиректит на conversation.

---

### 8. КОНФИГУРАЦИЯ И ДЕПЛОЙ

- `vercel.json` — деплой web на Vercel. Проверь: работает ли с Next.js 16?
- `start.sh` / `stop.sh` — скрипты запуска. Проверь: безопасны ли? Нет ли hardcoded secrets?
- `tact.config.json` — конфигурация компилятора Tact
- Монорепо через npm workspaces — проверь что `packages/*` корректно резолвятся

---

### 9. WEB DASHBOARD (Next.js 16)

- App Router с 6 routes
- TonConnect integration для подключения кошелька
- TanStack Query для data fetching
- Tailwind v4 для стилей

Проверь:
- SSR vs CSR: правильно ли разделены серверные и клиентские компоненты?
- `api/tonapi/[...path]/route.ts` — прокси к tonapi. Нет ли path traversal? Фильтруются ли пути?
- `lib/constants.ts` — placeholder values вместо fail-fast

---

### 10. MINI APP (Telegram)

- Vite + React, отдельный от web dashboard
- `MemoryRouter` (не BrowserRouter) — из-за конфликта с Telegram hash
- TonConnect UI для подключения кошелька
- Публичный минт через BOC payload

Проверь:
- Работает ли TonConnect в Telegram WebView?
- Нет ли XSS через пользовательский ввод (endpoint URL, capabilities)?
- Правильно ли обрабатывается отмена транзакции пользователем?

---

## Формат ревью

Для каждого найденного issue:

```
### [SEVERITY] Краткое описание
**Файл:** `path/to/file.ts:line`
**Категория:** Security | Architecture | Code Quality | Testing | UX
**Описание:** Что не так и почему это проблема
**Рекомендация:** Как исправить
```

Severity levels:
- **CRITICAL** — security vulnerability, data loss, funds at risk
- **HIGH** — серьёзный баг или архитектурная проблема
- **MEDIUM** — code quality, maintainability, потенциальный баг
- **LOW** — style, minor improvements, nice-to-have

В конце — summary таблица всех issues по severity и общая оценка проекта.
