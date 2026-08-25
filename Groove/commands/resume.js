const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused song'),

    async execute(interaction) {
        const { client, member, guild } = interaction;
        
        if (!member.voice.channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} You need to be in a voice channel!`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const player = client.poru.players.get(guild.id);
        
        if (!player) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} No music is currently playing!`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, ephemeral: true });
        }

        if (member.voice.channel.id !== player.voiceChannel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} You must be in the same voice channel as the bot!`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, ephemeral: true });
        }

        if (!player.isPaused) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.resume} The music is already playing.`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        }

        player.pause(false);
        
        const container = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.resume} Resumed.`));
        
        return interaction.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
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
