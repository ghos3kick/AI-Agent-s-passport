import { Conversation } from '@grammyjs/conversations';
import { InlineKeyboard } from 'grammy';
import { BaseContext } from '../context';
import { isValidTonAddress } from '@agent-passport/sdk';
import { buildMintBody, sendMintTransaction } from '../services/mint';
import { getTonConnect } from '../services/wallet';
import { config } from '../config';
import { Address } from '@ton/core';

// Conversation<OC, C>:
//   OC = BaseContext (outside context, without ConversationFlavor — matches ConversationFlavor<BaseContext> = BotContext)
//   C  = BaseContext (inner context type — has session but no conversation controls)
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

    // Step 2: Endpoint
    await ctx.reply('Enter the agent endpoint URL:');
    const endpointCtx = await conversation.waitFor('message:text');
    const endpoint = endpointCtx.message.text.trim();

    // Step 3: Capabilities
    await ctx.reply('Enter capabilities (comma-separated, e.g.: trading, analysis, alerts):');
    const capsCtx = await conversation.waitFor('message:text');
    const capabilities = capsCtx.message.text.trim();

    // Step 4: Metadata URL
    await ctx.reply('Enter metadata URL (JSON, TEP-64 format):');
    const metaCtx = await conversation.waitFor('message:text');
    const metadataUrl = metaCtx.message.text.trim();

    // Step 5: Confirmation
    const keyboard = new InlineKeyboard()
        .text('✅ Confirm', 'mint_confirm')
        .text('❌ Cancel', 'mint_cancel');

    await ctx.reply(
        `<b>── Confirm Mint ──</b>\n\nOwner: <code>${ownerAddress}</code>\nEndpoint: ${endpoint}\nCapabilities: ${capabilities}\nMetadata: ${metadataUrl}`,
        { parse_mode: 'HTML', reply_markup: keyboard },
    );

    const confirmCtx = await conversation.waitForCallbackQuery(['mint_confirm', 'mint_cancel']);
    await confirmCtx.answerCallbackQuery();

    if (confirmCtx.callbackQuery.data === 'mint_cancel') {
        await confirmCtx.reply('❌ Mint cancelled.');
        return;
    }

    // Step 6: Build and send transaction
    await ctx.reply('📝 Preparing transaction...');

    try {
        const mintBody = buildMintBody({
            queryId: BigInt(Date.now()),
            owner: Address.parse(ownerAddress),
            capabilities,
            endpoint,
            metadataUrl,
        });

        const chatId = ctx.chat!.id;
        const tc = getTonConnect(chatId);

        await ctx.reply('Please approve the transaction in your wallet...');

        const boc = await sendMintTransaction(tc, config.registryAddress, mintBody);

        await ctx.reply(
            `✅ <b>Passport minted!</b>\n\nTransaction sent.\nBOC: <code>${boc.slice(0, 32)}...</code>`,
            { parse_mode: 'HTML' },
        );
    } catch (e) {
        await ctx.reply(`❌ Failed to send transaction: ${(e as Error).message}`);
    }
}
