import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../context';

const MINI_APP_URL = 'https://194-87-31-34.sslip.io/mini-app/';

export function registerHelpHandler(bot: Bot<BotContext>) {
    bot.command('help', async (ctx) => {
        const keyboard = new InlineKeyboard()
            .webApp('\ud83e\udeaa Open Mini App', MINI_APP_URL);

        await ctx.reply(
            [
                '\ud83e\udeaa <b>Agent Passport \u2014 Help</b>',
                '',
                '<b>Bot Commands:</b>',
                '/start \u2014 Welcome message',
                '/app \u2014 Open Mini App',
                '/mint \u2014 Mint passport (admin)',
                '/lookup &lt;address&gt; \u2014 Find passport',
                '/verify &lt;address&gt; \u2014 Verify agent',
                '/stats \u2014 Registry stats',
                '/help \u2014 This message',
                '',
                '<b>Mini App Features:</b>',
                '\u2022 Connect wallet (TON Connect)',
                '\u2022 Mint passport (Quick or Self)',
                '\u2022 Search & verify passports',
                '\u2022 Trust Score & reputation',
                '',
                'All features are available in the Mini App \u2193',
            ].join('\n'),
            { parse_mode: 'HTML', reply_markup: keyboard },
        );
    });
}
