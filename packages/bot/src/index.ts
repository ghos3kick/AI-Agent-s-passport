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

    // Set the menu button to open Mini App
    await bot.api.setChatMenuButton({
        menu_button: {
            type: 'web_app',
            text: 'Open Passport',
            web_app: { url: 'https://194-87-31-34.sslip.io/mini-app/' },
        },
    });
    console.log('Menu button set to Mini App');

    console.log('Agent Passport Bot is starting...');
    await bot.start();
}

main().catch(console.error);
