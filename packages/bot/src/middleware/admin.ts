import { NextFunction } from 'grammy';
import { BotContext } from '../context';
import { config } from '../config';

export async function requireAdmin(ctx: BotContext, next: NextFunction) {
    const walletAddress = ctx.session.walletAddress;

    if (!walletAddress) {
        await ctx.reply('You need to connect your wallet first. Use /connect');
        return;
    }

    if (!config.adminAddress) {
        await ctx.reply('⛔ Admin not configured. Mint is disabled.');
        return;
    }

    if (walletAddress !== config.adminAddress) {
        await ctx.reply('⛔ Only the admin can mint passports.');
        return;
    }

    await next();
}
