const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { formatDuration } = require('../helpers/musicHelpers');
const { hexToDecimal } = require('../helpers/colorHelper');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or add it to the queue')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Song title or URL (YouTube, Spotify)')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    
    async autocomplete(interaction) {
        const { client } = interaction;
        const focusedValue = interaction.options.getFocused();

        if (focusedValue.toLowerCase().includes('spotify')) {
            const truncatedUrl = focusedValue.length > 60 ? focusedValue.slice(0, 57) + '...' : focusedValue;
            return interaction.respond([{ 
                name: `Play Spotify: ${truncatedUrl}`, 
                value: focusedValue 
            }]);
        } else if (focusedValue.toLowerCase().includes('youtube')) {
            const truncatedUrl = focusedValue.length > 60 ? focusedValue.slice(0, 57) + '...' : focusedValue;
            return interaction.respond([{ 
                name: `Play Youtube: ${truncatedUrl}`, 
                value: focusedValue 
            }]);
        } else if (/^https?:\/\//.test(focusedValue)) {
            const truncatedUrl = focusedValue.length > 70 ? focusedValue.slice(0, 67) + '...' : focusedValue;
            return interaction.respond([{ 
                name: `Play from URL: ${truncatedUrl}`, 
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
                name: `${choice.info.title.length > 85 ? choice.info.title.slice(0, 82) + '…' : choice.info.title} [${formatDuration(choice.info.length)}]`,
                value: choice.info.uri,
            }));
            searchCache.set(focusedValue, choices);
            return interaction.respond(choices);
        } catch (e) {
            return interaction.respond([]);
        }
    },

    async execute(interaction) {
        const { client, member, guild, options, channel } = interaction;
        
        if (!member.voice.channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You need to be in a voice channel to play music!`)
                );
            return interaction.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, 
                ephemeral: true 
            });
        }

        await interaction.deferReply();
        const query = interaction.options.getString('search');

        let res;
        try {
            res = await client.poru.resolve({ query, requester: interaction.user });
        } catch (e) {
            console.error('Poru resolve error:', e);
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Failed to search: ${e?.message || 'Unknown error'}`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const isSpotifyPlaylist = /^https?:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/i.test(query.trim());
        if (isSpotifyPlaylist) {
            if (!res || res.loadType !== 'PLAYLIST_LOADED' || !Array.isArray(res.tracks) || res.tracks.length === 0) {
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.error} No results found or invalid playlist.`)
                    );
                return interaction.editReply({ 
                    components: [container], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }

            const player = client.poru.createConnection({
                guildId: guild.id,
                voiceChannel: member.voice.channel.id,
                textChannel: channel.id,
                deaf: true,
            });

            if (player.autoplayEnabled === undefined) player.autoplayEnabled = false;

            for (const track of res.tracks) {
                track.info.requester = interaction.user;
                player.queue.add(track);
            }

            if (!player.isPlaying && player.isConnected) player.play();

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${emojis.music} Playlist ${res.playlistInfo?.name || 'Spotify Playlist'}\nAdded **${res.tracks.length}** tracks to the queue!`
                    )
                );
            
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        if (res.loadType === 'search') {
            const filteredTracks = res.tracks.filter((track) => !track.info.isStream && track.info.length > 70000);
            if (!filteredTracks.length) {
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.error} No results found (filtered out shorts).`)
                    );
                return interaction.editReply({ 
                    components: [container], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }
            res.tracks = filteredTracks;
        }

        if (res.loadType === 'error') {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Failed to load: ${res.exception?.message || 'Unknown error'}`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        if (res.loadType === 'empty') {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} No results found.`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const player = client.poru.createConnection({
            guildId: guild.id,
            voiceChannel: member.voice.channel.id,
            textChannel: channel.id,
            deaf: true,
        });

        if (player.autoplayEnabled === undefined) player.autoplayEnabled = false;

        if (res.loadType === 'playlist' || res.loadType === 'PLAYLIST_LOADED') {
            for (const track of res.tracks) {
                track.info.requester = interaction.user;
                player.queue.add(track);
            }

            if (!player.isPlaying && player.isConnected) player.play();

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${emojis.music} Playlist ${res.playlistInfo?.name || 'Playlist'}\nAdded **${res.tracks.length}** tracks to the queue!`
                    )
                );

            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        } else {
            const track = res.tracks[0];
            track.info.requester = interaction.user;
            player.queue.add(track);

            if (!player.isPlaying && player.isConnected) player.play();

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emojis.success} Added **[${track.info.title}](${track.info.uri})** to the queue!`
                    )
                );

            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }
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
