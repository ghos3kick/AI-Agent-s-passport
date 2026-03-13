import { createBot } from './bot';

async function main() {
    const bot = createBot();

    // Graceful shutdown
    const stop = () => {
        console.log('Shutting down...');
        bot.stop();
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);

    console.log('Agent Passport Bot is starting...');
    await bot.start();
}

main().catch(console.error);
