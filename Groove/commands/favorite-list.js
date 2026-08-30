const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const { formatDuration } = require('../helpers/musicHelpers');
const Favorite = require('../../database/models/Favorite');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favoritelist')
        .setDescription('Show your favorite songs'),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const userId = interaction.user.id;

        const favorites = await Favorite.findAll({
            where: { userId },
            order: [['createdAt', 'ASC']],
        });

        if (!favorites || favorites.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You don't have any favorite songs yet!`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const itemsPerPage = 10;
        const totalPages = Math.ceil(favorites.length / itemsPerPage) || 1;

        async function createFavoriteListContainer(page = 1) {
            page = Math.max(1, Math.min(page, totalPages));
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const currentPageFavorites = favorites.slice(start, end);

            const list = currentPageFavorites.map((f, idx) => 
                `**${start + idx + 1}.** [${f.title}](${f.uri}) - \`${formatDuration(f.length)}\``
            ).join('\n');

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`favoritelist_prev_${page}`)
                    .setEmoji(emojis.prevPage)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId(`favoritelist_next_${page}`)
                    .setEmoji(emojis.nextPage)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages)
            );

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ${emojis.favorite} Your Favorite Songs`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(list)
                )
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addActionRowComponents(buttons)
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `Page ${page} of ${totalPages} | Total: ${favorites.length} songs`
                    )
                );

            return {
                components: [container],
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                fetchReply: true,
            };
        }

        const initialPage = 1;
        const messageOptions = await createFavoriteListContainer(initialPage);
        const message = await interaction.editReply(messageOptions);

        const collector = message.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 5 * 60 * 1000,
        });

        collector.on('collect', async (buttonInteraction) => {
            const [prefix, action, currentPageStr] = buttonInteraction.customId.split('_');
            let currentPage = parseInt(currentPageStr, 10);

            if (action === 'next') {
                currentPage++;
            } else if (action === 'prev') {
                currentPage--;
            }

            const updatedMessageOptions = await createFavoriteListContainer(currentPage);
            await buttonInteraction.update(updatedMessageOptions);
        });

        collector.on('end', async () => {
            if (message.editable) {
                const finalState = await createFavoriteListContainer(1);
                finalState.components = [];
                await message.edit(finalState).catch(() => {});
            }
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
