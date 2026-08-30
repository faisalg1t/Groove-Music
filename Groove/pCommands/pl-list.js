const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require('discord.js');
const Playlist = require('../../database/models/Playlist');
const emojis = require('../emojis.json');

module.exports = {
    name: 'pl list',
    aliases: ['playlist-list', 'playlists', 'pllist', 'pl-list'],
    description: 'Show all of your saved playlists',
    
    async execute(message) {
        const userId = message.author.id;

        const playlists = await Playlist.findAll({
            where: { userId },
            order: [['name', 'ASC']],
        });

        if (!playlists || playlists.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You don't have any playlists yet!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const itemsPerPage = 10;
        const totalPages = Math.ceil(playlists.length / itemsPerPage) || 1;

        async function createPlaylistListContainer(page = 1) {
            page = Math.max(1, Math.min(page, totalPages));
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const currentPagePlaylists = playlists.slice(start, end);

            const list = currentPagePlaylists.map((p, idx) => `**${start + idx + 1}.** ${p.name}`).join('\n');

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`playlistlist_prev_${page}`)
                    .setEmoji(emojis.prevPage)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId(`playlistlist_next_${page}`)
                    .setEmoji(emojis.nextPage)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages)
            );

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`## ${emojis.music} Your Playlists`)
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(list)
                )
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addActionRowComponents(buttons)
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `Page ${page} of ${totalPages} | Total: ${playlists.length} playlists`
                    )
                );

            return {
                components: [container],
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                fetchReply: true,
            };
        }

        const initialPage = 1;
        const messageOptions = await createPlaylistListContainer(initialPage);
        const reply = await message.reply(messageOptions);

        const collector = reply.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
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

            const updatedMessageOptions = await createPlaylistListContainer(currentPage);
            await buttonInteraction.update(updatedMessageOptions);
        });

        collector.on('end', async () => {
            if (reply.editable) {
                const finalState = await createPlaylistListContainer(1);
                finalState.components = [];
                await reply.edit(finalState).catch(() => {});
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
