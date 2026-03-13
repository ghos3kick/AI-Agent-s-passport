import { Bot } from 'grammy';
import { BotContext } from '../context';
import { isValidTonAddress } from '@agent-passport/sdk';
import { getSDK } from '../services/passport';
import { formatPassportCard } from '../utils/format';

export function registerLookupHandler(bot: Bot<BotContext>) {
    bot.command('lookup', async (ctx) => {
        const address = ctx.match?.trim();

        if (!address) {
            await ctx.reply(
                'Usage: /lookup &lt;address&gt;\n\nProvide a passport contract address or wallet address.',
                { parse_mode: 'HTML' },
            );
            return;
        }

        if (!isValidTonAddress(address)) {
            await ctx.reply('\u274c Invalid TON address. Please check and try again.');
            return;
        }

        try {
            await ctx.reply('\ud83d\udd0e Looking up...');
            const sdk = getSDK();

            // Try as passport address first
            try {
                const passport = await sdk.getPassport(address);
                await ctx.reply(formatPassportCard(passport), { parse_mode: 'HTML' });
                return;
            } catch {
                // Not a passport address, try as wallet owner
            }

            // Try as wallet address
            const passports = await sdk.getPassportsByOwner(address);
            if (passports.length > 0) {
                for (const passport of passports) {
                    await ctx.reply(formatPassportCard(passport), { parse_mode: 'HTML' });
                }
                return;
            }

            await ctx.reply('\u274c No passport found for this address.');
        } catch (e) {
            console.error('lookup error:', e);
            await ctx.reply('\u274c Error looking up passport. Please try again later.');
        }
    });
}
