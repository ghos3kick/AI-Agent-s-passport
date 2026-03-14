import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import { limit } from '@grammyjs/ratelimiter';
import { BotContext, BaseContext, SessionData } from './context';
import { config } from './config';
import { logMiddleware } from './middleware/logging';
import { registerStartHandler } from './handlers/start';
import { registerHelpHandler } from './handlers/help';
import { registerConnectHandler } from './handlers/connect';
import { registerMyPassportHandler } from './handlers/mypassport';
import { registerLookupHandler } from './handlers/lookup';
import { registerVerifyHandler } from './handlers/verify';
import { registerStatsHandler } from './handlers/stats';
import { registerMintHandler } from './handlers/mint';
import { registerAppHandler } from './handlers/app';
import { mintConversation } from './conversations/mintFlow';

export function createBot(): Bot<BotContext> {
    const bot = new Bot<BotContext>(config.botToken);

    // Rate limiter — max 3 messages per second per user
    bot.use(limit({
        timeFrame: 1000,
        limit: 3,
        onLimitExceeded: async (ctx) => {
            await ctx.reply('⏳ Too many requests. Please wait a moment.');
        },
    }));

    // Session middleware (must come before conversations)
    bot.use(
        session<SessionData, BotContext>({
            initial: () => ({}),
        }),
    );

    // Conversations middleware (must come after session)
    bot.use(conversations<BaseContext, BaseContext>());

    // Register conversation handlers
    bot.use(createConversation<BaseContext, BaseContext>(mintConversation, 'mintFlow'));

    // Logging middleware
    bot.use(logMiddleware);

    // Register command handlers
    registerStartHandler(bot);
    registerHelpHandler(bot);
    registerConnectHandler(bot);
    registerMyPassportHandler(bot);
    registerLookupHandler(bot);
    registerVerifyHandler(bot);
    registerStatsHandler(bot);
    registerMintHandler(bot);
    registerAppHandler(bot);

    // Error handler
    bot.catch((err) => {
        console.error('Bot error:', err.message);
    });

    return bot;
}
