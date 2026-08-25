const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { hasControlPermission, formatDuration } = require('../helpers/musicHelpers');
const emojis = require('../emojis.json');

module.exports = {
    name: 'backward',
    aliases: ['bwd', 'rewind', 'rw'],
    description: 'Skip backward in the current song',

    async execute(message, args) {
        const { client, member, guild } = message;
        
        if (!member.voice.channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} You need to be in a voice channel!`));
            return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        }

        const player = client.poru.players.get(guild.id);
        
        if (!player) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} No music is currently playing!`));
            return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        }

        if (member.voice.channel.id !== player.voiceChannel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} You must be in the same voice channel as the bot!`));
            return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        }

        if (!hasControlPermission(message, player)) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} Only the requester, admins, or server managers can control the music!`));
            return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        }

        if (!player.currentTrack) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} There is no track playing!`));
            return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        }

        if (!args[0]) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} Please provide the number of seconds to skip backward!`));
            return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        }

        const seconds = parseInt(args[0]);
        
        if (isNaN(seconds) || seconds <= 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} Invalid time! Please provide a positive number in seconds.`));
            return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        }

        const currentPosition = player.position || 0;
        const newPosition = Math.max(0, currentPosition - (seconds * 1000));

        player.seekTo(newPosition);
        
        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.back} Skipped backward **${seconds}s** to **${formatDuration(newPosition)}**.`));
        
        return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
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
