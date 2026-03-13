import { InlineKeyboard } from 'grammy';

export function getMainMenu(): InlineKeyboard {
    return new InlineKeyboard()
        .text('\ud83d\udd17 Connect Wallet', 'action:connect')
        .row()
        .text('\ud83d\udccb My Passport', 'action:mypassport')
        .text('\ud83d\udd0d Lookup', 'action:lookup')
        .row()
        .text('\ud83d\udcca Stats', 'action:stats')
        .text('\u2753 Help', 'action:help');
}
