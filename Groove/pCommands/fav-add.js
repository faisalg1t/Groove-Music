const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const Favorite = require('../../database/models/Favorite');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    name: 'fav add',
    aliases: ['favadd', 'favoriteadd', 'fav-add'],
    description: 'Add a song to your favorites',

    async execute(message, args) {
        const { client, guild } = message;
        
        const userId = message.author.id;
        const query = args.join(' ');
        let track;

        if (query) {
            const loadingContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.music} Searching for song...`)
                );
            const loadingMsg = await message.reply({ 
                components: [loadingContainer], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });

            const res = await client.poru.resolve({ query, requester: message.author });
            if (!res || !res.tracks || res.tracks.length === 0) {
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.error} Could not find that song!`)
                    );
                return loadingMsg.edit({ 
                    components: [container], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }
            track = res.tracks[0];
            
            const existing = await Favorite.findOne({
                where: {
                    userId,
                    identifier: track.info.identifier,
                },
            });

            if (existing) {
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.error} **${track.info.title}** is already in your favorites!`)
                    );
                return loadingMsg.edit({ 
                    components: [container], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }

            await Favorite.create({
                userId,
                identifier: track.info.identifier,
                title: track.info.title,
                author: track.info.author,
                length: track.info.length,
                uri: track.info.uri,
            });

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.favorite} Added **[${track.info.title}](${track.info.uri})** to your favorites!`)
                );
            
            return loadingMsg.edit({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        } else {
            const player = client.poru.players.get(guild.id);
            track = player?.currentTrack;

            if (!track) {
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.error} No track to add! Either search for a song or play music first.`)
                    );
                return message.reply({ 
                    components: [container], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }

            const existing = await Favorite.findOne({
                where: {
                    userId,
                    identifier: track.info.identifier,
                },
            });

            if (existing) {
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.error} **${track.info.title}** is already in your favorites!`)
                    );
                return message.reply({ 
                    components: [container], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }

            await Favorite.create({
                userId,
                identifier: track.info.identifier,
                title: track.info.title,
                author: track.info.author,
                length: track.info.length,
                uri: track.info.uri,
            });

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.favorite} Added **[${track.info.title}](${track.info.uri})** to your favorites!`)
                );
            
            return message.reply({ 
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
