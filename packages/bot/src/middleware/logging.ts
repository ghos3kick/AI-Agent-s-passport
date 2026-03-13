import { NextFunction } from 'grammy';
import { BotContext } from '../context';

export async function logMiddleware(ctx: BotContext, next: NextFunction) {
    const start = Date.now();
    const user = ctx.from?.username || ctx.from?.id;
    console.log(`[${new Date().toISOString()}] ${user}: ${ctx.message?.text || 'callback'}`);
    await next();
    console.log(`[${new Date().toISOString()}] Response: ${Date.now() - start}ms`);
}
