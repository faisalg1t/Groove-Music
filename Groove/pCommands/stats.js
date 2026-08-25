
const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    name: 'stats',
    description: 'View bot statistics',
    aliases: ['statistics', 'botinfo'],
    
    async execute(message) {
        const { client } = message;
        
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalChannels = client.channels.cache.size;
        const uptime = Math.floor(client.uptime / 1000);
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const activePlayers = client.poru.players.size;
        const wsLatency = client.ws.ping;
        const nodeCount = client.poru.nodes.size;
        
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# ${client.user.username} Statistics`)
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**Server Statistics**`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.dots} Servers: \`${totalGuilds}\`\n` +
                    `${emojis.dots} Users: \`${totalUsers.toLocaleString()}\`\n` +
                    `${emojis.dots} Channels: \`${totalChannels}\``
                )
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**Music System**`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.dots} Active Players: \`${activePlayers}\`\n` +
                    `${emojis.dots} LavaLink Nodes: \`${nodeCount}\``
                )
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**System Resources**`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.dots} Uptime: \`${uptimeString}\`\n` +
                    `${emojis.dots} Memory Usage: \`${memoryUsage} MB\`\n` +
                    `${emojis.dots} Websocket Latency: \`${wsLatency}ms\``
                )
            );

        await message.reply({
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });
    },
};

/*
 * Project: Groove Music
 * Author: faisalg1t (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisalg1t
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
