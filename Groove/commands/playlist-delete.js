const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const Playlist = require('../../database/models/Playlist');
const PlaylistTrack = require('../../database/models/PlaylistTrack');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlistdelete')
        .setDescription('Delete one of your playlists')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the playlist to delete')
                .setRequired(true)
                .setAutocomplete(true)
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
        const userId = interaction.user.id;

        const playlist = await Playlist.findOne({ 
            where: { userId, name: playlistName } 
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

        await PlaylistTrack.destroy({ where: { playlistId: playlist.id } });
        await playlist.destroy();

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emojis.success} Deleted playlist **${playlistName}**!`)
            );
        
        return interaction.editReply({ 
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
