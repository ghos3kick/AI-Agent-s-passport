import { Bot } from 'grammy';
import { BotContext } from '../context';
import { isValidTonAddress } from '@agent-passport/sdk';
import { getSDK } from '../services/passport';

export function registerVerifyHandler(bot: Bot<BotContext>) {
    bot.command('verify', async (ctx) => {
        let address = ctx.match?.trim();

        // Use connected wallet if no address provided
        if (!address && ctx.session.walletAddress) {
            address = ctx.session.walletAddress;
        }

        if (!address) {
            await ctx.reply(
                'Usage: /verify &lt;address&gt;\n\nOr connect your wallet first with /connect, then run /verify.',
                { parse_mode: 'HTML' },
            );
            return;
        }

        if (!isValidTonAddress(address)) {
            await ctx.reply('\u274c Invalid TON address.');
            return;
        }

        try {
            const sdk = getSDK();
            const has = await sdk.hasPassport(address);

            if (has) {
                const passports = await sdk.getPassportsByOwner(address);
                const active = passports.filter((p) => p.isActive);

                if (active.length > 0) {
                    await ctx.reply(
                        `\u2705 <b>Verified</b>\n\n<code>${address}</code>\n\nHas ${active.length} active Agent Passport(s).`,
                        { parse_mode: 'HTML' },
                    );
                } else {
                    await ctx.reply(
                        `\u274c <b>Revoked</b>\n\n<code>${address}</code>\n\nPassport found but revoked.`,
                        { parse_mode: 'HTML' },
                    );
                }
            } else {
                await ctx.reply(
                    `\u274c <b>Not verified</b>\n\n<code>${address}</code>\n\nNo Agent Passport found.`,
                    { parse_mode: 'HTML' },
                );
            }
        } catch (e) {
            console.error('verify error:', e);
            await ctx.reply('\u274c Error during verification. Please try again later.');
        }
    });
}
