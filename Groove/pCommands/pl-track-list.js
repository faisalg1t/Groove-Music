

const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require('discord.js');
const { formatDuration } = require('../helpers/musicHelpers');
const Playlist = require('../../database/models/Playlist');
const PlaylistTrack = require('../../database/models/PlaylistTrack');
const emojis = require('../emojis.json');

module.exports = {
    name: 'pl track list',
    aliases: ['pl-track-list'],
    description: 'Show the list of tracks in a playlist',
    
    async execute(message, args) {
        if (!args.length) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Please provide a playlist name!\nUsage: \`pl track list <name>\``)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const playlistName = args.join(' ');
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

        const createTrackListPage = async (page = 1) => {
            const itemsPerPage = 5;
            const totalPages = Math.ceil(playlist.tracks.length / itemsPerPage) || 1;
            page = Math.max(1, Math.min(page, totalPages));

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const currentPageTracks = playlist.tracks.slice(start, end);

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`playlisttracks_prev_${page}`)
                    .setEmoji(emojis.prevPage)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId(`playlisttracks_next_${page}`)
                    .setEmoji(emojis.nextPage)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages)
            );

            const container = new ContainerBuilder();
            
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${emojis.music} ${playlistName}`)
            );
            
            container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
            
            currentPageTracks.forEach((track, index) => {
                if (!track) {
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`**${start + index + 1}.** Unknown Track`)
                    );
                } else {
                    let title = track.title || 'Unknown Title';
                    title = title.replace(/[[\]()]/g, '');
                    const uri = track.uri || '#';
                    const length = track.length || 0;
                    const artworkUrl = track.artworkUrl || track.image;
                    
                    if (artworkUrl) {
                        container.addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(
                                    new TextDisplayBuilder().setContent(
                                        `**${start + index + 1}.** [${title.length > 55 ? title.slice(0, 52) + '…' : title}](${uri}) \`${formatDuration(length)}\``
                                    )
                                )
                                .setThumbnailAccessory(
                                    new ThumbnailBuilder()
                                        .setDescription(title)
                                        .setURL(artworkUrl)
                                )
                        );
                    } else {
                        container.addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                `**${start + index + 1}.** [${title.length > 55 ? title.slice(0, 52) + '…' : title}](${uri}) \`${formatDuration(length)}\``
                            )
                        );
                    }
                    
                    if (index < currentPageTracks.length - 1) {
                        container.addSeparatorComponents(
                            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                        );
                    }
                }
            });
            
            container
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addActionRowComponents(buttons)
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Page ${page}/${totalPages}** • **${playlist.tracks.length} tracks in playlist**`
                    )
                );

            return { components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, fetchReply: true };
        };

        const response = await message.reply(await createTrackListPage(1));

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== message.author.id) {
                return i.reply({ content: `${emojis.error} Only the command user can navigate!`, ephemeral: true });
            }

            const customId = i.customId;
            const currentPage = parseInt(customId.split('_')[2]);
            let newPage = currentPage;

            if (customId.startsWith('playlisttracks_prev')) {
                newPage = currentPage - 1;
            } else if (customId.startsWith('playlisttracks_next')) {
                newPage = currentPage + 1;
            }

            await i.update(await createTrackListPage(newPage));
        });

        collector.on('end', () => {
            response.edit({ components: [] }).catch(() => {});
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
