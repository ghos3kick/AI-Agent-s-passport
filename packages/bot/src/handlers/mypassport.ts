import { Bot } from 'grammy';
import { BotContext } from '../context';
import { requireWallet } from '../middleware/auth';
import { getSDK } from '../services/passport';
import { formatPassportCard } from '../utils/format';

export function registerMyPassportHandler(bot: Bot<BotContext>) {
    bot.command('mypassport', requireWallet(), async (ctx) => {
        const walletAddress = ctx.session.walletAddress!;

        try {
            await ctx.reply('\ud83d\udd0e Looking up your passport...');

            const sdk = getSDK();
            const passports = await sdk.getPassportsByOwner(walletAddress);

            if (passports.length === 0) {
                await ctx.reply(
                    'You don\'t have an Agent Passport yet.\n\nVisit the project docs to learn how to register your AI agent.',
                );
                return;
            }

            for (const passport of passports) {
                await ctx.reply(formatPassportCard(passport), { parse_mode: 'HTML' });
            }
        } catch (e) {
            console.error('mypassport error:', e);
            await ctx.reply('\u274c Error fetching passport. Please try again later.');
        }
    });
}
