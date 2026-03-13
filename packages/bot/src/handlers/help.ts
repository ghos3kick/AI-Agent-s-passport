import { Bot } from 'grammy';
import { BotContext } from '../context';

export function registerHelpHandler(bot: Bot<BotContext>) {
    bot.command('help', async (ctx) => {
        await ctx.reply(
            [
                '\u2753 <b>Agent Passport Bot \u2014 Help</b>',
                '',
                '/connect \u2014 Connect your TON wallet',
                '/mypassport \u2014 View your Agent Passport SBT',
                '/lookup &lt;address&gt; \u2014 Look up a passport by contract or wallet address',
                '/verify &lt;address&gt; \u2014 Check if an address has an active Agent Passport',
                '/stats \u2014 Show registry statistics',
                '/help \u2014 Show this help message',
                '',
                '<i>Agent Passport is an on-chain identity system for AI agents on TON, based on TEP-85 (SBT).</i>',
            ].join('\n'),
            { parse_mode: 'HTML' },
        );
    });
}
