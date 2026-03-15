import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../context';
import { getSDK } from '../services/passport';
import { formatRegistryStats } from '../utils/format';
import { config } from '../config';

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

    // Inline button callbacks — redirect to actual command handlers
    bot.callbackQuery('action:lookup', async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply(
            'Send /lookup &lt;address&gt; to find a passport.\n\nProvide a passport contract or wallet address.',
            { parse_mode: 'HTML' },
        );
    });
    bot.callbackQuery('action:verify', async (ctx) => {
        await ctx.answerCallbackQuery();
        if (ctx.session.walletAddress) {
            // Auto-verify connected wallet
            ctx.match = ctx.session.walletAddress;
            await ctx.api.sendMessage(ctx.chat!.id, `/verify ${ctx.session.walletAddress}`);
        } else {
            await ctx.reply(
                'Send /verify &lt;address&gt; to verify a passport.\n\nOr /connect your wallet first.',
                { parse_mode: 'HTML' },
            );
        }
    });
    bot.callbackQuery('action:stats', async (ctx) => {
        await ctx.answerCallbackQuery();
        // Execute stats directly
        try {
            const sdk = getSDK();
            const total = await sdk.getTotalPassports();
            await ctx.reply(
                formatRegistryStats(total, config.registryAddress, config.network),
                { parse_mode: 'HTML' },
            );
        } catch {
            await ctx.reply('Failed to fetch stats. Try /stats later.');
        }
    });
    bot.callbackQuery('action:help', async (ctx) => {
        await ctx.answerCallbackQuery();
        const helpKb = new InlineKeyboard()
            .webApp('\ud83e\udeaa Open Mini App', MINI_APP_URL);
        await ctx.reply(
            [
                '\ud83e\udeaa <b>Agent Passport \u2014 Help</b>',
                '',
                '/app \u2014 Open Mini App',
                '/mint \u2014 Mint passport (admin)',
                '/lookup &lt;address&gt; \u2014 Find passport',
                '/verify &lt;address&gt; \u2014 Verify agent',
                '/stats \u2014 Registry stats',
            ].join('\n'),
            { parse_mode: 'HTML', reply_markup: helpKb },
        );
    });
}
