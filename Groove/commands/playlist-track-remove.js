const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const Playlist = require('../../database/models/Playlist');
const PlaylistTrack = require('../../database/models/PlaylistTrack');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlisttrackremove')
        .setDescription('Remove a track from one of your playlists')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the playlist to remove the track from')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('The position of the track to remove (use /playlisttracklist to see positions)')
                .setRequired(true)
                .setMinValue(1)
        ),
    
    async autocomplete(interaction) {
        const userId = interaction.user.id;
        const focusedValue = interaction.options.getFocused();

        try {
            const playlists = await Playlist.findAll({
                where: { userId },
                limit: 25,
            });

            if (!playlists || playlists.length === 0) {
                return interaction.respond([]);
            }

            const filteredChoices = playlists
                .map((playlist) => playlist.name)
                .filter((name) => name.toLowerCase().includes(focusedValue.toLowerCase()))
                .map((name) => ({ name: name.length > 100 ? name.slice(0, 97) + '...' : name, value: name }));
            
            return interaction.respond(filteredChoices.slice(0, 25));
        } catch (error) {
            console.error('Playlist autocomplete error:', error);
            return interaction.respond([]);
        }
    },

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const playlistName = interaction.options.getString('name');
        const position = interaction.options.getInteger('position');
        const userId = interaction.user.id;

        const playlist = await Playlist.findOne({
            where: { userId, name: playlistName },
            include: [{ model: PlaylistTrack, as: 'tracks' }],
        });
        
        if (!playlist) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Playlist **${playlistName}** not found!`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        if (!playlist.tracks || playlist.tracks.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Playlist **${playlistName}** is empty!`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        if (position < 1 || position > playlist.tracks.length) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emojis.error} Invalid position! Playlist has **${playlist.tracks.length}** tracks.`
                    )
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const trackToRemove = playlist.tracks[position - 1];
        await trackToRemove.destroy();

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.success} Removed **${trackToRemove.title}** from playlist **${playlistName}**!`
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
