const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const Playlist = require('../../database/models/Playlist');
const emojis = require('../emojis.json');

module.exports = {
    name: 'pl share',
    aliases: ['playlist-share', 'plshare', 'pl-share'],
    description: 'Share a playlist with others',
    
    async execute(message, args) {
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

        const userId = message.author.id;

        const playlist = await Playlist.findOne({ 
            where: { userId, name: playlistName } 
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

        let shareCode = playlist.shareCode;

        if (!shareCode) {
            shareCode = `GROOVE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            playlist.shareCode = shareCode;
            await playlist.save();
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${emojis.music} Share Playlist: ${playlist.name}`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `Share this code with others so they can import your playlist using \`pl import\`:`
                )
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`**Share Code:** \`${shareCode}\``)
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
