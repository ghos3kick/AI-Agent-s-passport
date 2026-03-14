import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../context';

const MINI_APP_URL = 'https://194-87-31-34.sslip.io/mini-app/';

export function registerStartHandler(bot: Bot<BotContext>) {
    bot.command('start', async (ctx) => {
        const keyboard = new InlineKeyboard()
            .webApp('\ud83e\udeaa Open Agent Passport', MINI_APP_URL)
            .row()
            .text('\ud83d\udd0d Lookup', 'action:lookup')
            .text('\u2705 Verify', 'action:verify')
            .row()
            .text('\ud83d\udcca Stats', 'action:stats')
            .text('\u2753 Help', 'action:help');

        await ctx.reply(
            [
                '\ud83e\udeaa <b>Agent Passport</b>',
                '',
                'On-chain identity for AI agents on TON.',
                '',
                '<b>Commands:</b>',
                '/app \u2014 Open Mini App',
                '/mint \u2014 Mint passport (admin)',
                '/lookup &lt;address&gt; \u2014 Find passport',
                '/verify &lt;address&gt; \u2014 Verify agent',
                '/stats \u2014 Registry stats',
                '/help \u2014 Help',
                '',
                'Open the Mini App for the full experience \u2193',
            ].join('\n'),
            { parse_mode: 'HTML', reply_markup: keyboard },
        );
    });

    // Inline button callbacks
    bot.callbackQuery('action:lookup', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply('Send /lookup <address> to find a passport');
    });
    bot.callbackQuery('action:verify', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply('Send /verify <address> to verify a passport');
    });
    bot.callbackQuery('action:stats', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply('Send /stats to view registry stats');
    });
    bot.callbackQuery('action:help', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply('Send /help to see all commands');
    });
}
