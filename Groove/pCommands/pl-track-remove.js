const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const Playlist = require('../../database/models/Playlist');
const PlaylistTrack = require('../../database/models/PlaylistTrack');
const emojis = require('../emojis.json');

module.exports = {
    name: 'pl track remove',
    aliases: ['playlist-track-remove', 'pltrackremove', 'pl-track-remove'],
    description: 'Remove a track from one of your playlists',
    
    async execute(message, args) {
        if (args.length < 2) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Please provide both playlist name and position! Usage: \`pl track remove <playlist name> | <position>\``)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        const fullText = args.join(' ');
        const parts = fullText.split('|').map(p => p.trim());
        
        if (parts.length !== 2) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Please use \`|\` to separate playlist and position! Usage: \`pl track remove <playlist name> | <position>\``)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        const playlistName = parts[0];
        const position = parseInt(parts[1]);
        
        if (isNaN(position) || position < 1) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Invalid position! Please provide a valid number.`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

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
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        if (!playlist.tracks || playlist.tracks.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Playlist **${playlistName}** is empty!`)
                );
            return message.reply({ 
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
            return message.reply({ 
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
        
        return message.reply({ 
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
