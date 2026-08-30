const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const Playlist = require('../../database/models/Playlist');
const PlaylistTrack = require('../../database/models/PlaylistTrack');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlisttrackadd')
        .setDescription('Add a single song to one of your playlists')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the playlist to add the song to')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('search')
                .setDescription('The song title or URL to add')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        
        if (focusedOption.name === 'name') {
            const userId = interaction.user.id;
            const focusedValue = focusedOption.value;

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
        }
        
        if (focusedOption.name === 'search') {
            const { client } = interaction;
            const focusedValue = focusedOption.value;

            if (focusedValue.toLowerCase().includes('spotify') || focusedValue.toLowerCase().includes('youtube')) {
                const truncatedUrl = focusedValue.length > 60 ? focusedValue.slice(0, 57) + '...' : focusedValue;
                return interaction.respond([{ 
                    name: `Add: ${truncatedUrl}`, 
                    value: focusedValue 
                }]);
            }

            if (!client._musicAutocompleteCache) client._musicAutocompleteCache = new Map();
            const searchCache = client._musicAutocompleteCache;

            if (searchCache.has(focusedValue)) {
                return interaction.respond(searchCache.get(focusedValue));
            }

            if (!focusedValue || focusedValue.trim().length === 0) {
                return interaction.respond([]);
            }

            if (!client.poru || typeof client.poru.resolve !== 'function') {
                return interaction.respond([]);
            }

            try {
                let source = config.MUSIC.DEFAULT_PLATFORM || 'ytsearch';
                const res = await client.poru.resolve({ query: focusedValue, source: source, requester: interaction.user });
                if (!res || !res.tracks || !Array.isArray(res.tracks) || res.tracks.length === 0) {
                    return interaction.respond([]);
                }
                const choices = res.tracks.slice(0, config.MUSIC.AUTOCOMPLETE_LIMIT).map((choice) => ({
                    name: choice.info.title.length > 90 ? choice.info.title.slice(0, 87) + '…' : choice.info.title,
                    value: choice.info.uri,
                }));
                searchCache.set(focusedValue, choices);
                return interaction.respond(choices);
            } catch (e) {
                return interaction.respond([]);
            }
        }
    },

    async execute(interaction) {
        const { client } = interaction;
        
        await interaction.deferReply({ ephemeral: true });
        
        const playlistName = interaction.options.getString('name');
        const query = interaction.options.getString('search');
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

        const res = await client.poru.resolve({ query, requester: interaction.user });
        if (!res || !res.tracks || res.tracks.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Could not find that song!`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const track = res.tracks[0];

        await PlaylistTrack.create({
            playlistId: playlist.id,
            title: track.info.title,
            identifier: track.info.identifier,
            author: track.info.author,
            length: track.info.length,
            uri: track.info.uri,
            artworkUrl: track.info.artworkUrl || track.info.image || null,
        });

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.success} Added **[${track.info.title}](${track.info.uri})** to playlist **${playlistName}**!`
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
 * Author: faisaljs (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisaljs
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
