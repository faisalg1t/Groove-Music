const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { hasControlPermission } = require('../helpers/musicHelpers');
const emojis = require('../emojis.json');

module.exports = {
    name: 'autoplay',
    description: 'Enable or disable autoplay',

    async execute(message) {
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

        player.autoplayEnabled = !player.autoplayEnabled;
        const status = player.autoplayEnabled ? 'enabled' : 'disabled';
        console.log(`[Autoplay Command] Toggled autoplay to: ${player.autoplayEnabled}`);
        
        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.autoplay} Autoplay ${status}.`));
        
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
