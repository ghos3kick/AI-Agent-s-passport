import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../context';

export function registerStartHandler(bot: Bot<BotContext>) {
    bot.command('start', async (ctx) => {
        const keyboard = new InlineKeyboard()
            .text('\ud83d\udd17 Connect Wallet', 'action:connect')
            .row()
            .text('\ud83d\udccb My Passport', 'action:mypassport')
            .text('\ud83d\udd0d Lookup', 'action:lookup')
            .row()
            .text('\ud83d\udcca Stats', 'action:stats')
            .text('\u2753 Help', 'action:help');

        await ctx.reply(
            [
                '\ud83e\udd16 <b>Welcome to Agent Passport Bot!</b>',
                '',
                'I help you manage and explore SBT passports for AI agents on TON.',
                '',
                '\ud83d\udd17 /connect \u2014 Connect wallet',
                '\ud83d\udccb /mypassport \u2014 My passport',
                '\ud83d\udd0d /lookup &lt;address&gt; \u2014 Find passport',
                '\u2705 /verify &lt;address&gt; \u2014 Verify agent',
                '\ud83d\udcca /stats \u2014 Registry stats',
                '\u2753 /help \u2014 Help',
            ].join('\n'),
            { parse_mode: 'HTML', reply_markup: keyboard },
        );
    });

    // Inline button callbacks
    bot.callbackQuery('action:connect', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply('Send /connect to connect your wallet');
    });
    bot.callbackQuery('action:mypassport', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply('Send /mypassport to view your passport');
    });
    bot.callbackQuery('action:lookup', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply('Send /lookup <address> to find a passport');
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
