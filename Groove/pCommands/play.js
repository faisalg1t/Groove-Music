const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { formatDuration } = require('../helpers/musicHelpers');
const { hexToDecimal } = require('../helpers/colorHelper');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    name: 'play',
    description: 'Play a song or add it to the queue',
    
    async execute(message, args) {
        const { client, member, guild, channel } = message;
        
        if (!member.voice.channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You need to be in a voice channel to play music!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        if (!args || args.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Please provide a song title or URL!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        const query = args.join(' ');

        

        const searchContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emojis.music} Searching for **${query}**...`)
            );
        const loadingMsg = await message.reply({ 
            components: [searchContainer], 
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });

        let res;
        try {
            res = await client.poru.resolve({ query, requester: message.author });
        } catch (e) {
            console.error('Poru resolve error:', e);
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Failed to search: ${e?.message || 'Unknown error'}`)
                );
            return loadingMsg.edit({ 
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
                return loadingMsg.edit({ 
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
                track.info.requester = message.author;
                player.queue.add(track);
            }

            if (!player.isPlaying && player.isConnected) player.play();

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${emojis.music} Playlist ${res.playlistInfo?.name || 'Spotify Playlist'}\nAdded **${res.tracks.length}** tracks to the queue!`
                    )
                );
            return loadingMsg.edit({ 
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
                return loadingMsg.edit({ 
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
            return loadingMsg.edit({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        if (res.loadType === 'empty') {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} No results found.`)
                );
            return loadingMsg.edit({ 
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
                track.info.requester = message.author;
                player.queue.add(track);
            }

            if (!player.isPlaying && player.isConnected) player.play();

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${emojis.music} Playlist ${res.playlistInfo?.name || 'Playlist'}\nAdded **${res.tracks.length}** tracks to the queue!`
                    )
                );
            return loadingMsg.edit({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        } else {
            const track = res.tracks[0];
            track.info.requester = message.author;
            player.queue.add(track);

            if (!player.isPlaying && player.isConnected) player.play();

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emojis.success} Added **[${track.info.title}](${track.info.uri})** to the queue!`
                    )
                );
            return loadingMsg.edit({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }
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
