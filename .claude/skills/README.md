# TON SBT Project — Skills for Claude Code

## Содержимое

| Скилл | Описание | Строк |
|-------|----------|-------|
| `tact-lang/` | Язык Tact — типы, контракты, сообщения, паттерны | ~300 |
| `blueprint/` | Blueprint — тесты (Sandbox), деплой, структура проекта | ~400 |
| `tep85-sbt/` | TEP-85 SBT — спецификация, opcodes, верификация, Tact-реализация | ~400 |
| `grammy/` | grammY — Telegram-бот: клавиатуры, сессии, conversations, TON Connect | ~440 |
| `tonapi/` | tonapi.io — REST API: NFT/SBT запросы, транзакции, get-методы | ~370 |

## Установка в Claude Code

### Вариант 1: Через `.claude/skills/` в проекте

```bash
# В корне вашего проекта
mkdir -p .claude/skills
cp -r tact-lang blueprint tep85-sbt grammy tonapi .claude/skills/
```

Claude Code автоматически подхватит скиллы из `.claude/skills/`.

### Вариант 2: Глобально через `~/.claude/skills/`

```bash
mkdir -p ~/.claude/skills
cp -r tact-lang blueprint tep85-sbt grammy tonapi ~/.claude/skills/
```

### Вариант 3: Упомянуть в CLAUDE.md

Добавьте в ваш `CLAUDE.md` (корень проекта):

```markdown
## Skills

This project uses TON blockchain with Tact smart contracts and grammY Telegram bot.
Relevant skills are in `.claude/skills/`.
```

## Обновление

Скиллы основаны на документации по состоянию на начало 2025 года.
Для актуализации — обновите SKILL.md файлы вручную или попросите Claude Code
сделать это на основе свежей документации.
