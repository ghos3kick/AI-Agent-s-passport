import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../context';
import { isValidTonAddress } from '@agent-passport/sdk';

const MINI_APP_URL = 'https://194-87-31-34.sslip.io/mini-app/';

export function registerConnectHandler(bot: Bot<BotContext>) {
    bot.command('connect', async (ctx) => {
        // Still allow manual address for session (used by /mypassport, /lookup)
        const addressArg = ctx.match?.trim();

        if (addressArg && isValidTonAddress(addressArg)) {
            ctx.session.walletAddress = addressArg;
            await ctx.reply(
                `\u2705 Wallet set: <code>${addressArg}</code>`,
                { parse_mode: 'HTML' },
            );
            return;
        }

        const keyboard = new InlineKeyboard()
            .webApp('\ud83e\udeaa Open Mini App', MINI_APP_URL);

        await ctx.reply(
            '\u2705 Wallet is connected automatically for minting.\n\n' +
            'To set your address for lookups:\n' +
            '/connect &lt;your-wallet-address&gt;\n\n' +
            'Or use the Mini App to connect via TON Connect:',
            { parse_mode: 'HTML', reply_markup: keyboard },
        );
    });

    bot.command('disconnect', async (ctx) => {
        if (!ctx.session.walletAddress) {
            await ctx.reply('No wallet connected.');
            return;
        }
        ctx.session.walletAddress = undefined;
        await ctx.reply('\ud83d\udd13 Wallet disconnected.');
    });
}
