import { Conversation } from '@grammyjs/conversations';
import { InlineKeyboard } from 'grammy';
import { BaseContext } from '../context';
import { isValidTonAddress } from '@agent-passport/sdk';
import { buildMintBody, sendMintTransaction } from '../services/mint';
import { getTonConnect } from '../services/wallet';
import { config } from '../config';
import { Address } from '@ton/core';

const MAX_FIELD_LENGTH = 256;

function isValidUrl(s: string): boolean {
    try { new URL(s); return true; } catch { return false; }
}

export async function mintConversation(
    conversation: Conversation<BaseContext, BaseContext>,
    ctx: BaseContext,
) {
    await ctx.reply('🔑 <b>Admin Mint Flow</b>\n\nLet\'s mint a new Agent Passport.', {
        parse_mode: 'HTML',
    });

    // Step 1: Owner address
    await ctx.reply('Enter the owner wallet address (who will receive the SBT):');
    let ownerAddress = '';
    while (true) {
        const ownerCtx = await conversation.waitFor('message:text');
        const input = ownerCtx.message.text.trim();
        if (isValidTonAddress(input)) {
            ownerAddress = input;
            break;
        }
        await ownerCtx.reply('❌ Invalid TON address. Please try again:');
    }

    // Step 2: Endpoint (URL validation)
    await ctx.reply('Enter the agent endpoint URL:');
    let endpoint = '';
    while (true) {
        const endpointCtx = await conversation.waitFor('message:text');
        const input = endpointCtx.message.text.trim();
        if (!input) { await endpointCtx.reply('⚠️ Field cannot be empty. Try again:'); continue; }
        if (input.length > MAX_FIELD_LENGTH) { await endpointCtx.reply(`⚠️ Too long (max ${MAX_FIELD_LENGTH} chars). Try again:`); continue; }
        if (!isValidUrl(input)) { await endpointCtx.reply('⚠️ Invalid URL format. Try again:'); continue; }
        endpoint = input;
        break;
    }

    // Step 3: Capabilities (length validation)
    await ctx.reply('Enter capabilities (comma-separated, e.g.: trading, analysis, alerts):');
    let capabilities = '';
    while (true) {
        const capsCtx = await conversation.waitFor('message:text');
        const input = capsCtx.message.text.trim();
        if (!input) { await capsCtx.reply('⚠️ Field cannot be empty. Try again:'); continue; }
        if (input.length > MAX_FIELD_LENGTH) { await capsCtx.reply(`⚠️ Too long (max ${MAX_FIELD_LENGTH} chars). Try again:`); continue; }
        capabilities = input;
        break;
    }

    // Step 4: Metadata URL (URL validation)
    await ctx.reply('Enter metadata URL (JSON, TEP-64 format):');
    let metadataUrl = '';
    while (true) {
        const metaCtx = await conversation.waitFor('message:text');
        const input = metaCtx.message.text.trim();
        if (!input) { await metaCtx.reply('⚠️ Field cannot be empty. Try again:'); continue; }
        if (input.length > MAX_FIELD_LENGTH) { await metaCtx.reply(`⚠️ Too long (max ${MAX_FIELD_LENGTH} chars). Try again:`); continue; }
        if (!isValidUrl(input)) { await metaCtx.reply('⚠️ Invalid URL format. Try again:'); continue; }
        metadataUrl = input;
        break;
    }

    // Step 5: Confirmation
    const keyboard = new InlineKeyboard()
        .text('✅ Confirm', 'mint_confirm')
        .text('❌ Cancel', 'mint_cancel');

    const owner = Address.parse(ownerAddress);
    await ctx.reply(
        `📋 <b>Mint Summary</b>\n\n` +
        `👤 Owner: <code>${owner.toString({ bounceable: false })}</code>\n` +
        `🌐 Endpoint: ${endpoint}\n` +
        `⚡ Capabilities: ${capabilities}\n` +
        `📄 Metadata: ${metadataUrl}\n\n` +
        `Confirm mint?`,
        { parse_mode: 'HTML', reply_markup: keyboard },
    );

    const cbCtx = await conversation.waitForCallbackQuery(['mint_confirm', 'mint_cancel']);
    if (cbCtx.callbackQuery.data === 'mint_cancel') {
        await cbCtx.answerCallbackQuery('Cancelled');
        await cbCtx.editMessageText('❌ Mint cancelled.');
        return;
    }

    await cbCtx.answerCallbackQuery('Processing...');
    await cbCtx.editMessageText('⏳ Sending mint transaction...');

    try {
        const tc = getTonConnect(ctx.from!.id);
        const mintBody = buildMintBody({ queryId: BigInt(Date.now()), owner, capabilities, endpoint, metadataUrl });
        const result = await sendMintTransaction(tc, config.registryAddress, mintBody);

        await ctx.reply(
            `✅ <b>Mint transaction sent!</b>\n\n` +
            `Transaction should appear shortly.\n` +
            `Check your wallet or explorer for confirmation.`,
            { parse_mode: 'HTML' },
        );
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        await ctx.reply(`❌ Mint failed: ${msg}`);
    }
}
