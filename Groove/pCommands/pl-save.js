const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const Playlist = require('../../database/models/Playlist');
const PlaylistTrack = require('../../database/models/PlaylistTrack');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    name: 'pl save',
    aliases: ['playlist-save', 'plsave', 'pl-save'],
    description: 'Save the current queue as a playlist',
    
    async execute(message, args) {
        const { client, member, guild } = message;
        
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
                    new TextDisplayBuilder().setContent(`${emojis.error} Please provide a name for your playlist!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        const userId = message.author.id;

        const playlistCount = await Playlist.count({ where: { userId } });

        if (playlistCount >= config.MUSIC.PLAYLIST_LIMIT) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emojis.error} You have reached the maximum playlist limit (**${config.MUSIC.PLAYLIST_LIMIT}** playlists)!`
                    )
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const player = client.poru.players.get(guild.id);

        if (!player || (!player.currentTrack && player.queue.length === 0)) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} The queue is empty! Play some songs first.`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const existing = await Playlist.findOne({ where: { userId, name: playlistName } });
        if (existing) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emojis.error} You already have a playlist named **${playlistName}**!`
                    )
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const playlist = await Playlist.create({ userId, name: playlistName });

        const tracksToSave = [];
        if (player.currentTrack) {
            tracksToSave.push({
                playlistId: playlist.id,
                title: player.currentTrack.info.title,
                identifier: player.currentTrack.info.identifier,
                author: player.currentTrack.info.author,
                length: player.currentTrack.info.length,
                uri: player.currentTrack.info.uri,
                artworkUrl: player.currentTrack.info.artworkUrl || player.currentTrack.info.image || null,
            });
        }
        for (const track of player.queue) {
            tracksToSave.push({
                playlistId: playlist.id,
                title: track.info.title,
                identifier: track.info.identifier,
                author: track.info.author,
                length: track.info.length,
                uri: track.info.uri,
                artworkUrl: track.info.artworkUrl || track.info.image || null,
            });
        }

        await PlaylistTrack.bulkCreate(tracksToSave);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.success} Created playlist **${playlistName}** with **${tracksToSave.length}** songs!`
                )
            );
        
        return message.reply({ 
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
