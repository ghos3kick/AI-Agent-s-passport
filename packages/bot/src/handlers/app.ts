import { Bot } from 'grammy';
import { BotContext } from '../context';

const MINI_APP_URL = 'https://194-87-31-34.sslip.io/mini-app/';

export function registerAppHandler(bot: Bot<BotContext>) {
    bot.command('app', async (ctx) => {
        await ctx.reply('Open Agent Passport Mini App', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '\uD83E\uDEAA Open Passport',
                            web_app: { url: MINI_APP_URL },
                        },
                    ],
                ],
            },
        });
    });
}
