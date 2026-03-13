import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../context';
import { isValidTonAddress } from '@agent-passport/sdk';
import { getTonConnect } from '../services/wallet';
import { config } from '../config';

export function registerConnectHandler(bot: Bot<BotContext>) {
    bot.command('connect', async (ctx) => {
        // Check if already connected
        if (ctx.session.walletAddress) {
            await ctx.reply(
                `\u2705 Wallet already connected: <code>${ctx.session.walletAddress}</code>\n\nSend /disconnect to disconnect.`,
                { parse_mode: 'HTML' },
            );
            return;
        }

        const addressArg = ctx.match?.trim();

        // Simple mode: accept address as text argument
        if (addressArg && isValidTonAddress(addressArg)) {
            ctx.session.walletAddress = addressArg;
            await ctx.reply(
                `\u2705 Wallet connected: <code>${addressArg}</code>`,
                { parse_mode: 'HTML' },
            );
            return;
        }

        // TON Connect mode
        if (config.tonconnectManifestUrl) {
            try {
                const tc = getTonConnect(ctx.chat!.id);
                const wallets = await tc.getWallets();

                if (wallets.length === 0) {
                    await ctx.reply('No wallets available. Send /connect <address> to connect manually.');
                    return;
                }

                // Generate universal link for first available wallet
                const universalLink = tc.connect({
                    universalLink: (wallets[0] as any).universalLink,
                    bridgeUrl: (wallets[0] as any).bridgeUrl,
                });

                const keyboard = new InlineKeyboard().url(
                    '\ud83d\udd17 Open Wallet',
                    universalLink as string,
                );

                await ctx.reply(
                    '\ud83d\udd17 <b>Connect Wallet</b>\n\nClick the button below to connect your TON wallet.\n\nOr send: /connect &lt;your-wallet-address&gt;',
                    { parse_mode: 'HTML', reply_markup: keyboard },
                );

                // Listen for connection
                const unsubscribe = tc.onStatusChange((wallet) => {
                    if (wallet) {
                        const address = wallet.account.address;
                        ctx.session.walletAddress = address;
                        ctx.reply(
                            `\u2705 Wallet connected: <code>${address}</code>`,
                            { parse_mode: 'HTML' },
                        ).catch(console.error);
                        unsubscribe();
                    }
                });

                // Timeout after 2 minutes
                setTimeout(() => {
                    unsubscribe();
                }, 120_000);

                return;
            } catch (e) {
                // Fall through to manual mode
                console.error('TON Connect error:', e);
            }
        }

        // Fallback: manual address entry
        await ctx.reply(
            '\ud83d\udd17 <b>Connect Wallet</b>\n\nSend your wallet address:\n/connect &lt;your-wallet-address&gt;\n\nExample: /connect EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA',
            { parse_mode: 'HTML' },
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
