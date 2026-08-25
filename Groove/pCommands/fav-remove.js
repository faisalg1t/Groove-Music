const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const Favorite = require('../../database/models/Favorite');
const emojis = require('../emojis.json');

module.exports = {
    name: 'fav remove',
    aliases: ['favremove', 'favoriteremove', 'fav-remove'],
    description: 'Remove a song from your favorites',

    async execute(message, args) {
        const userId = message.author.id;
        const name = args.join(' ');

        if (!name) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Please provide the song name to remove!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const favorites = await Favorite.findAll({
            where: { userId },
        });

        if (!favorites || favorites.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You don't have any favorites to remove!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const favorite = favorites.find(f => 
            f.title.toLowerCase().includes(name.toLowerCase())
        );

        if (!favorite) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Could not find that song in your favorites!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        await favorite.destroy();

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emojis.success} Removed **${favorite.title}** from your favorites!`)
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
