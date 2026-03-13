import { NextFunction } from 'grammy';
import { BotContext } from '../context';
import { config } from '../config';

export async function requireAdmin(ctx: BotContext, next: NextFunction) {
    const walletAddress = ctx.session.walletAddress;

    if (!walletAddress) {
        await ctx.reply('You need to connect your wallet first. Use /connect');
        return;
    }

    if (config.adminAddress && walletAddress !== config.adminAddress) {
        await ctx.reply('This command is for registry admins only.');
        return;
    }

    await next();
}
