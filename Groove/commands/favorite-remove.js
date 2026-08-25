const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const Favorite = require('../../database/models/Favorite');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favoriteremove')
        .setDescription('Remove a song from your favorites')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the song to remove')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    
    async autocomplete(interaction) {
        const userId = interaction.user.id;
        const focusedValue = interaction.options.getFocused();

        try {
            const favorites = await Favorite.findAll({
                where: { userId },
                limit: 25,
            });

            if (!favorites || favorites.length === 0) {
                return interaction.respond([]);
            }

            const filteredChoices = favorites
                .map((favorite) => favorite.title)
                .filter((name) => name.toLowerCase().includes(focusedValue.toLowerCase()))
                .map((name) => ({
                    name: name.length > 100 ? name.slice(0, 97) + '...' : name,
                    value: String(name).slice(0, 100),
                }));
            
            return interaction.respond(filteredChoices.slice(0, 25));
        } catch (error) {
            console.error('Favorite autocomplete error:', error);
            return interaction.respond([]);
        }
    },

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const userId = interaction.user.id;
        const name = interaction.options.getString('name');

        const favorite = await Favorite.findOne({
            where: {
                userId: userId,
                title: name,
            },
        });

        if (!favorite) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Could not find that song in your favorites!`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        await favorite.destroy();

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emojis.success} Removed **${favorite.title}** from your favorites!`)
            );
        
        return interaction.editReply({ 
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
