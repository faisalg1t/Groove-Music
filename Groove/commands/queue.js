const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const { formatDuration } = require('../helpers/musicHelpers');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current song queue'),

    async execute(interaction) {
        const { client, member, guild } = interaction;
        
        if (!member.voice.channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} You need to be in a voice channel!`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const player = client.poru.players.get(guild.id);
        
        if (!player) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} No music is currently playing!`));
            return interaction.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, ephemeral: true });
        }

        const createQueuePage = async (page = 1) => {
            const itemsPerPage = 5;
            const totalPages = Math.ceil(player.queue.length / itemsPerPage) || 1;
            page = Math.max(1, Math.min(page, totalPages));

            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const currentQueue = player.queue.slice(start, end);

            const nowPlaying = player.currentTrack;
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`queue_prev_${page}`)
                    .setEmoji(emojis.prevPage)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId(`queue_next_${page}`)
                    .setEmoji(emojis.nextPage)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages)
            );

            const container = new ContainerBuilder();
            
            if (nowPlaying) {
                let npTitle = nowPlaying.info.title || 'Unknown';
                npTitle = npTitle.replace(/[[\]()]/g, '');
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Now Playing:** [${npTitle}](${nowPlaying.info.uri}) \`${formatDuration(nowPlaying.info.length)}\``
                    )
                );
            } else {
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Now Playing:** Loading...`
                    )
                );
            }
            
            container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
            
            if (currentQueue.length === 0) {
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent('**No more tracks in queue**'));
            } else {
                currentQueue.forEach((track, index) => {
                    if (!track || !track.info) {
                        container.addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`**${start + index + 1}.** Unknown Track`)
                        );
                    } else {
                        let title = track.info.title || 'Unknown Title';
                        title = title.replace(/[[\]()]/g, '');
                        const uri = track.info.uri || '#';
                        const length = track.info.length || 0;
                        const artworkUrl = track.info.artworkUrl || track.info.image;
                        
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
                        
                        if (index < currentQueue.length - 1) {
                            container.addSeparatorComponents(
                                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                            );
                        }
                    }
                });
            }
            
            container
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addActionRowComponents(buttons)
                .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Page ${page}/${totalPages}** • **${player.queue.length} tracks in queue**`
                    )
                );

            return { components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, fetchReply: true };
        };

        const response = await interaction.reply(await createQueuePage(1));

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: `${emojis.error} Only the command user can navigate!`, ephemeral: true });
            }

            const customId = i.customId;
            const currentPage = parseInt(customId.split('_')[2]);
            let newPage = currentPage;

            if (customId.startsWith('queue_prev')) {
                newPage = currentPage - 1;
            } else if (customId.startsWith('queue_next')) {
                newPage = currentPage + 1;
            }

            await i.update(await createQueuePage(newPage));
        });

        collector.on('end', () => {
            response.edit({ components: [] }).catch(() => {});
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
