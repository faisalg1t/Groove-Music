const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const Favorite = require('../../database/models/Favorite');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favoriteplay')
        .setDescription('Play all songs from your favorites')
        .addBooleanOption(option =>
            option.setName('append')
                .setDescription('Append the songs to the current queue')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        const { client, member, guild, channel } = interaction;
        
        if (!member.voice.channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You need to be in a voice channel!`)
                );
            return interaction.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, 
                ephemeral: true 
            });
        }

        await interaction.deferReply();

        const append = interaction.options.getBoolean('append') || false;
        const userId = interaction.user.id;

        const favorites = await Favorite.findAll({
            where: { userId },
            order: [['createdAt', 'ASC']],
        });

        if (!favorites || favorites.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You don't have any favorite songs yet!`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        let player = client.poru.players.get(guild.id);
        
        if (player && !append) {
            player.queue.clear();
        }

        if (!player) {
            player = client.poru.createConnection({
                guildId: guild.id,
                voiceChannel: member.voice.channel.id,
                textChannel: channel.id,
                deaf: true,
            });
            if (player.autoplayEnabled === undefined) player.autoplayEnabled = false;
        }

        let added = 0;
        for (const fav of favorites) {
            try {
                const poruTrack = await client.poru.resolve({ query: fav.uri, requester: interaction.user });
                if (poruTrack.tracks && poruTrack.tracks[0]) {
                    player.queue.add(poruTrack.tracks[0]);
                    added++;
                }
            } catch (e) {
                console.error(`Failed to resolve favorite: ${fav.title}`, e);
            }
        }

        if (!player.isPlaying && player.isConnected) player.play();

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.success} ${append ? 'Added' : 'Loaded'} **${added}** songs from your favorites to the queue!`
                )
            );
        
        return interaction.editReply({ 
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
