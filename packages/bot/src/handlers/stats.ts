import { Bot } from 'grammy';
import { BotContext } from '../context';
import { getSDK } from '../services/passport';
import { formatRegistryStats } from '../utils/format';
import { config } from '../config';

export function registerStatsHandler(bot: Bot<BotContext>) {
    bot.command('stats', async (ctx) => {
        try {
            const sdk = getSDK();
            const total = await sdk.getTotalPassports();

            await ctx.reply(
                formatRegistryStats(total, config.registryAddress, config.network),
                { parse_mode: 'HTML' },
            );
        } catch (e) {
            console.error('stats error:', e);
            await ctx.reply('\u274c Error fetching stats. Please try again later.');
        }
    });
}
