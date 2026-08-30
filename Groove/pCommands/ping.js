const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const emojis = require('../emojis.json');

module.exports = {
    name: 'ping',
    description: 'Check the bot\'s latency',
    
    async execute(message) {
        const sent = await message.reply({ 
            content: 'Pinging...',
            fetchReply: true
        });

        const wsLatency = message.client.ws.ping;
        const editLatency = sent.createdTimestamp - message.createdTimestamp;
        const uptime = Math.floor(message.client.uptime / 1000);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('**Pong!**')
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emojis.dots} Websocket Latency: \`${wsLatency}ms\``)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emojis.dots} Edit Response: \`${editLatency}ms\``)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emojis.dots} Uptime: \`${uptime}s\``)
            );

        await sent.edit({
            content: null,
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });
    },
};

/*
 * Project: Groove Music
 * Author: faisaljs (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisaljs
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
