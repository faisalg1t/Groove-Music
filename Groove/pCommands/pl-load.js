const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const Playlist = require('../../database/models/Playlist');
const PlaylistTrack = require('../../database/models/PlaylistTrack');
const emojis = require('../emojis.json');

module.exports = {
    name: 'pl load',
    aliases: ['playlist-load', 'plload', 'pl-load'],
    description: 'Clear the queue and load a playlist',
    
    async execute(message, args) {
        const { client, member, guild, channel } = message;
        
        if (!member.voice.channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You need to be in a voice channel!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        const playlistName = args.join(' ');
        
        if (!playlistName) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Please provide a playlist name!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        const loadingContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emojis.music} Loading playlist **${playlistName}**...`)
            );
        const loadingMsg = await message.reply({ 
            components: [loadingContainer], 
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });

        const userId = message.author.id;

        const playlist = await Playlist.findOne({
            where: { userId, name: playlistName },
            include: [{ model: PlaylistTrack, as: 'tracks' }],
        });

        if (!playlist) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Playlist **${playlistName}** not found!`)
                );
            return loadingMsg.edit({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        if (!playlist.tracks || playlist.tracks.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Playlist **${playlistName}** is empty!`)
                );
            return loadingMsg.edit({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        let player = client.poru.players.get(guild.id);
        
        if (player) {
            player.queue.clear();
        } else {
            player = client.poru.createConnection({
                guildId: guild.id,
                voiceChannel: member.voice.channel.id,
                textChannel: channel.id,
                deaf: true,
            });
            if (player.autoplayEnabled === undefined) player.autoplayEnabled = false;
        }

        let added = 0;
        for (const trackData of playlist.tracks) {
            try {
                const poruTrack = await client.poru.resolve({ query: trackData.uri, requester: message.author });
                if (poruTrack.tracks && poruTrack.tracks[0]) {
                    player.queue.add(poruTrack.tracks[0]);
                    added++;
                }
            } catch (e) {
                console.error(`Failed to resolve track: ${trackData.title}`, e);
            }
        }

        if (!player.isPlaying && player.isConnected) player.play();

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.success} Loaded **${added}** songs from playlist **${playlistName}**!`
                )
            );
        
        return loadingMsg.edit({ 
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
