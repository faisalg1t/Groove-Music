const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s latency'),
    
    async execute(interaction) {
        const sent = await interaction.reply({ 
            content: 'Pinging...', 
            fetchReply: true,
            ephemeral: true 
        });

        const wsLatency = interaction.client.ws.ping;
        const editLatency = sent.createdTimestamp - interaction.createdTimestamp;
        const uptime = Math.floor(interaction.client.uptime / 1000);

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

        await interaction.editReply({
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
