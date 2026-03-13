---
name: grammy
description: >
  Reference for grammY — a TypeScript/JavaScript framework for building Telegram bots.
  Covers bot setup, context handling, middleware, sessions, conversations, inline keyboards,
  callback queries, menus, and integration with TON wallets (TON Connect). Use this skill
  whenever the user builds a Telegram bot, works with the Telegram Bot API via grammY,
  creates inline keyboards, handles callback queries, uses grammY plugins (sessions,
  conversations, menu, etc.), or integrates a Telegram bot with blockchain/TON features.
  Also trigger for any .ts/.js file that imports 'grammy'.
---

# grammY — Telegram Bot Framework (TypeScript)

## Overview

grammY is a modern, type-safe framework for building Telegram bots in TypeScript/JavaScript.

**Docs:** https://grammy.dev/
**GitHub:** https://github.com/grammyjs/grammY
**Telegram Bot API:** https://core.telegram.org/bots/api

## Setup

```bash
npm install grammy
# Common plugins:
npm install @grammyjs/conversations @grammyjs/session @grammyjs/menu
npm install @grammyjs/runner      # for long polling with graceful shutdown
npm install @grammyjs/hydrate     # shortcuts on ctx
```

### Basic Bot

```typescript
import { Bot, Context, session } from "grammy";

const bot = new Bot<Context>("YOUR_BOT_TOKEN");

// Command handler
bot.command("start", async (ctx) => {
    await ctx.reply("Hello! Welcome to the bot.");
});

// Text message handler
bot.on("message:text", async (ctx) => {
    await ctx.reply(`You said: ${ctx.message.text}`);
});

// Start bot
bot.start();
```

## Context (`ctx`)

Every handler receives a `Context` object with:

```typescript
ctx.message          // incoming message object
ctx.message.text     // message text
ctx.message.from     // sender User object
ctx.chat.id          // chat ID (number)
ctx.from.id          // user ID (number)
ctx.from.username    // username (string | undefined)

// Reply methods
await ctx.reply("text");
await ctx.reply("text", { parse_mode: "HTML" });
await ctx.reply("text", { parse_mode: "MarkdownV2" });
await ctx.reply("text", { reply_markup: keyboard });

// Edit last message (for callback queries)
await ctx.editMessageText("updated text");
await ctx.editMessageReplyMarkup({ reply_markup: newKeyboard });

// Answer callback query (MUST be called for inline button presses)
await ctx.answerCallbackQuery();
await ctx.answerCallbackQuery({ text: "Done!", show_alert: true });

// Delete message
await ctx.deleteMessage();

// Send to specific chat
await ctx.api.sendMessage(chatId, "text");
```

## Inline Keyboards

```typescript
import { InlineKeyboard } from "grammy";

// Build keyboard
const keyboard = new InlineKeyboard()
    .text("Option A", "callback_a")
    .text("Option B", "callback_b")
    .row()                              // new row
    .url("Visit Site", "https://example.com")
    .row()
    .text("Cancel", "cancel");

await ctx.reply("Choose an option:", { reply_markup: keyboard });

// Handle callbacks
bot.callbackQuery("callback_a", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "You chose A!" });
    await ctx.editMessageText("You selected Option A.");
});

bot.callbackQuery("callback_b", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("You selected Option B.");
});

// Dynamic callback data with prefix matching
bot.callbackQuery(/^select:(.+)$/, async (ctx) => {
    const value = ctx.match[1];
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`Selected: ${value}`);
});
```

## Custom Keyboards (Reply Keyboards)

```typescript
import { Keyboard } from "grammy";

const keyboard = new Keyboard()
    .text("Option 1").text("Option 2").row()
    .text("Option 3")
    .resized()       // fit to content
    .oneTime();      // hide after use

await ctx.reply("Pick one:", { reply_markup: keyboard });

// Remove keyboard
await ctx.reply("Done.", {
    reply_markup: { remove_keyboard: true },
});
```

## Sessions

Sessions store per-chat or per-user data across messages.

```typescript
import { Bot, Context, session } from "grammy";
import { type SessionFlavor } from "grammy";

// Define session data
interface SessionData {
    step: string;
    language: string;
    walletAddress?: string;
}

// Create flavored context
type MyContext = Context & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>("TOKEN");

// Initialize session middleware
bot.use(session({
    initial: (): SessionData => ({
        step: "idle",
        language: "en",
    }),
}));

// Use in handlers
bot.command("set_lang", async (ctx) => {
    ctx.session.language = "ru";
    await ctx.reply("Language set to Russian");
});

bot.command("status", async (ctx) => {
    await ctx.reply(`Step: ${ctx.session.step}, Lang: ${ctx.session.language}`);
});
```

### External Session Storage

```typescript
import { freeStorage } from "@grammyjs/storage-free";
// or: FileAdapter, MongoDBAdapter, RedisAdapter, etc.

bot.use(session({
    initial: () => ({ step: "idle" }),
    storage: freeStorage<SessionData>(bot.token),
}));
```

## Conversations Plugin

For multi-step flows (wizards, forms):

```typescript
import { Bot, Context, session } from "grammy";
import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
} from "@grammyjs/conversations";

type MyContext = Context & ConversationFlavor;
type MyConversation = Conversation<MyContext>;

const bot = new Bot<MyContext>("TOKEN");

// Register plugins (ORDER MATTERS)
bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

// Define conversation
async function registerFlow(conversation: MyConversation, ctx: MyContext) {
    await ctx.reply("What is your name?");
    const nameCtx = await conversation.waitFor("message:text");
    const name = nameCtx.message.text;

    await ctx.reply(`Hi ${name}! Enter your wallet address:`);
    const walletCtx = await conversation.waitFor("message:text");
    const wallet = walletCtx.message.text;

    // Validate
    if (!wallet.startsWith("EQ") && !wallet.startsWith("UQ")) {
        await ctx.reply("Invalid TON address. Try /register again.");
        return;
    }

    await ctx.reply(`Registered!\nName: ${name}\nWallet: ${wallet}`);
}

// Register and trigger
bot.use(createConversation(registerFlow));
bot.command("register", async (ctx) => {
    await ctx.conversation.enter("registerFlow");
});
```

### Conversation Tips

- `conversation.waitFor("message:text")` — wait for text message
- `conversation.waitFor("callback_query")` — wait for button press
- `conversation.wait()` — wait for any update
- Conversations are **serializable** — they survive bot restarts if using persistent session storage
- Call `conversation.skip()` to ignore irrelevant updates
- Use `conversation.external(() => fetch(...))` for API calls inside conversations

## Menu Plugin

For complex interactive menus:

```typescript
import { Menu } from "@grammyjs/menu";

const mainMenu = new Menu<MyContext>("main-menu")
    .text("Profile", async (ctx) => {
        await ctx.editMessageText("Your profile info...");
    })
    .text("Settings", async (ctx) => {
        ctx.menu.nav("settings-menu");
    })
    .row()
    .text("Help", async (ctx) => {
        await ctx.reply("Send /help for more info.");
    });

const settingsMenu = new Menu<MyContext>("settings-menu")
    .text("Language", async (ctx) => {
        await ctx.editMessageText("Choose language...");
    })
    .text("← Back", async (ctx) => {
        ctx.menu.nav("main-menu");
        await ctx.editMessageText("Main menu:");
    });

mainMenu.register(settingsMenu); // register sub-menu
bot.use(mainMenu);

bot.command("menu", async (ctx) => {
    await ctx.reply("Main menu:", { reply_markup: mainMenu });
});
```

## Middleware

```typescript
// Custom middleware
bot.use(async (ctx, next) => {
    const start = Date.now();
    await next(); // call downstream
    const ms = Date.now() - start;
    console.log(`Response time: ${ms}ms`);
});

// Error handling
bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error for ${ctx.update.update_id}:`, err.error);
});
```

## Sending Media

```typescript
import { InputFile } from "grammy";

// Photo
await ctx.replyWithPhoto(new InputFile("./image.png"));
await ctx.replyWithPhoto("https://example.com/photo.jpg");

// Document
await ctx.replyWithDocument(new InputFile(buffer, "report.pdf"));

// With caption
await ctx.replyWithPhoto(new InputFile("./badge.png"), {
    caption: "<b>Your SBT Badge</b>\nIssued: 2024-01-15",
    parse_mode: "HTML",
});
```

## Webhooks (Production)

```typescript
import express from "express";
import { webhookCallback } from "grammy";

const app = express();
app.use(express.json());

// Set webhook
app.use("/webhook", webhookCallback(bot, "express"));

app.listen(3000, () => {
    bot.api.setWebhook("https://yourdomain.com/webhook");
});
```

## Integration with TON Connect

Common pattern — connect TON wallet via Telegram bot:

```typescript
import { TonConnect } from "@tonconnect/sdk";

// Generate connect URL
async function getConnectUrl(chatId: number): Promise<string> {
    const connector = new TonConnect({
        manifestUrl: "https://yourdomain.com/tonconnect-manifest.json",
    });

    const url = connector.connect({
        universalLink: "https://app.tonkeeper.com/ton-connect",
        bridgeUrl: "https://bridge.tonapi.io/bridge",
    });

    // Store connector state keyed by chatId
    connectors.set(chatId, connector);

    // Listen for connection
    connector.onStatusChange(async (wallet) => {
        if (wallet) {
            const address = wallet.account.address;
            await bot.api.sendMessage(chatId, `Wallet connected: ${address}`);
        }
    });

    return url;
}

bot.command("connect", async (ctx) => {
    const url = await getConnectUrl(ctx.chat.id);
    const keyboard = new InlineKeyboard()
        .url("Connect Wallet", url);
    await ctx.reply("Connect your TON wallet:", { reply_markup: keyboard });
});
```

## Project Structure (recommended)

```
bot/
├── src/
│   ├── index.ts          # bot init & start
│   ├── bot.ts            # bot instance & middleware setup
│   ├── handlers/
│   │   ├── start.ts      # /start command
│   │   ├── register.ts   # registration flow
│   │   └── sbt.ts        # SBT-related handlers
│   ├── conversations/
│   │   └── register.ts   # multi-step flows
│   ├── menus/
│   │   └── main.ts       # menu definitions
│   ├── keyboards/
│   │   └── inline.ts     # shared keyboard builders
│   ├── services/
│   │   ├── tonapi.ts     # TON API client
│   │   └── sbt.ts        # SBT verification logic
│   ├── types/
│   │   └── context.ts    # custom context type
│   └── config.ts         # env vars, constants
├── package.json
└── tsconfig.json
```

## Common Patterns

### Command with Arguments

```typescript
bot.command("send", async (ctx) => {
    const args = ctx.match; // everything after /send
    if (!args) {
        await ctx.reply("Usage: /send <address> <amount>");
        return;
    }
    const [address, amount] = args.split(" ");
    // ...
});
```

### User State Machine

```typescript
bot.on("message:text", async (ctx) => {
    switch (ctx.session.step) {
        case "awaiting_name":
            ctx.session.name = ctx.message.text;
            ctx.session.step = "awaiting_wallet";
            await ctx.reply("Now enter your wallet address:");
            break;
        case "awaiting_wallet":
            ctx.session.wallet = ctx.message.text;
            ctx.session.step = "idle";
            await ctx.reply("Registration complete!");
            break;
        default:
            await ctx.reply("Send /start to begin.");
    }
});
```
