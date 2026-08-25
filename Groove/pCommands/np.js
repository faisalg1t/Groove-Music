const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const NoPrefix = require('../../database/models/NoPrefix');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    name: 'np',
    aliases: [],
    description: 'Manage no-prefix access (Owner only)',

    async execute(message, args) {
        if (message.author.id !== config.OWNER_ID) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`This command can only be used by the bot owner!`)
                );
            return message.reply({
                components: [container],
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        const subCommand = args[0]?.toLowerCase();

        if (!subCommand || !['add', 'list', 'remove'].includes(subCommand)) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `Invalid usage!\n\n**Available commands:**\n\`np add @user\` - Grant no-prefix access\n\`np list\` - List all no-prefix users\n\`np remove @user\` - Revoke no-prefix access`
                    )
                );
            return message.reply({
                components: [container],
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        if (subCommand === 'add') {
            return handleAdd(message, args);
        } else if (subCommand === 'list') {
            return handleList(message);
        } else if (subCommand === 'remove') {
            return handleRemove(message, args);
        }
    },
};

async function handleAdd(message, args) {
    const targetUser = message.mentions.users.first();
    
    if (!targetUser) {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`Please mention a user!\nUsage: \`np add @user\``)
            );
        return message.reply({
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });
    }

    if (targetUser.bot) {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`You cannot grant no-prefix access to bots!`)
            );
        return message.reply({
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });
    }

    const existing = await NoPrefix.findOne({ where: { userId: targetUser.id } });
    if (existing) {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `[${targetUser.username}](https://discord.com/users/${targetUser.id}) already has no-prefix access!`
                )
            );
        return message.reply({
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`np_duration_${targetUser.id}`)
        .setPlaceholder('Select duration')
        .addOptions([
            {
                label: '1 Day',
                description: 'No-prefix access for 1 day',
                value: '1day'
            },
            {
                label: '1 Week',
                description: 'No-prefix access for 1 week',
                value: '1week'
            },
            {
                label: '1 Month',
                description: 'No-prefix access for 1 month',
                value: '1month'
            },
            {
                label: '1 Year',
                description: 'No-prefix access for 1 year',
                value: '1year'
            },
            {
                label: 'Lifetime',
                description: 'No-prefix access forever',
                value: 'lifetime'
            }
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## Grant No-Prefix Access\n\nUser: [${targetUser.username}](https://discord.com/users/${targetUser.id})\n\nSelect how long to grant no-prefix access:`
            )
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addActionRowComponents(row);

    const response = await message.reply({
        components: [container],
        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
        fetchReply: true
    });

    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000
    });

    collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id) {
            return i.reply({
                content: `Only the command user can select!`,
                ephemeral: true
            });
        }

        const duration = i.values[0];
        let expiresAt = null;
        let durationText = 'Lifetime';

        const now = new Date();
        switch (duration) {
            case '1day':
                expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                durationText = '1 Day';
                break;
            case '1week':
                expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                durationText = '1 Week';
                break;
            case '1month':
                expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                durationText = '1 Month';
                break;
            case '1year':
                expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
                durationText = '1 Year';
                break;
            case 'lifetime':
                expiresAt = null;
                durationText = 'Lifetime';
                break;
        }

        await NoPrefix.create({
            userId: targetUser.id,
            username: targetUser.username,
            grantedBy: message.author.id,
            grantedByUsername: message.author.username,
            expiresAt: expiresAt,
            duration: durationText
        });

        const successContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `Successfully granted no-prefix access to [${targetUser.username}](https://discord.com/users/${targetUser.id})\n\n**Duration:** ${durationText}${expiresAt ? `\n**Expires:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>` : ''}`
                )
            );

        await i.update({
            components: [successContainer],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });

        collector.stop();
    });

    collector.on('end', async (collected) => {
        if (collected.size === 0) {
            const timeoutContainer = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`Selection timed out!`)
                );
            
            await response.edit({
                components: [timeoutContainer],
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            }).catch(() => {});
        }
    });
}

async function handleList(message) {
    const users = await NoPrefix.findAll({ order: [['createdAt', 'DESC']] });

    if (!users || users.length === 0) {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`No users have no-prefix access!`)
            );
        return message.reply({
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });
    }

    const createListPage = async (page = 1) => {
        const itemsPerPage = 5;
        const totalPages = Math.ceil(users.length / itemsPerPage) || 1;
        page = Math.max(1, Math.min(page, totalPages));

        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const currentPageUsers = users.slice(start, end);

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`nplist_prev_${page}`)
                .setLabel('Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId(`nplist_next_${page}`)
                .setLabel('Next')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === totalPages)
        );

        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`## No-Prefix Users`)
        );

        container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

        for (let i = 0; i < currentPageUsers.length; i++) {
            const user = currentPageUsers[i];
            
            try {
                const discordUser = await message.client.users.fetch(user.userId);
                const avatarUrl = discordUser.displayAvatarURL({ extension: 'png', size: 128 });
                
                const guildMember = await message.guild.members.fetch(user.userId).catch(() => null);
                
                let contentText = `**${start + i + 1}.** [${user.username}](https://discord.com/users/${user.userId})\n\nAccount Created: <t:${Math.floor(discordUser.createdTimestamp / 1000)}:R>`;
                
                if (guildMember) {
                    contentText += `\nJoined Server: <t:${Math.floor(guildMember.joinedTimestamp / 1000)}:R>`;
                }
                
                container.addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(contentText)
                        )
                        .setThumbnailAccessory(
                            new ThumbnailBuilder()
                                .setDescription(user.username)
                                .setURL(avatarUrl)
                        )
                );
            } catch (error) {
                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**${start + i + 1}.** [${user.username}](https://discord.com/users/${user.userId})`
                    )
                );
            }

            if (i < currentPageUsers.length - 1) {
                container.addSeparatorComponents(
                    new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
                );
            }
        }

        container
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addActionRowComponents(buttons)
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Page ${page}/${totalPages}** • **${users.length} total users**`
                )
            );

        return { components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, fetchReply: true };
    };

    const response = await message.reply(await createListPage(1));

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

    collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id) {
            return i.reply({ content: `Only the command user can navigate!`, ephemeral: true });
        }

        const customId = i.customId;
        const currentPage = parseInt(customId.split('_')[2]);
        let newPage = currentPage;

        if (customId.startsWith('nplist_prev')) {
            newPage = currentPage - 1;
        } else if (customId.startsWith('nplist_next')) {
            newPage = currentPage + 1;
        }

        await i.update(await createListPage(newPage));
    });

    collector.on('end', () => {
        response.edit({ components: [] }).catch(() => {});
    });
}

async function handleRemove(message, args) {
    const targetUser = message.mentions.users.first();
    
    if (!targetUser) {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`Please mention a user!\nUsage: \`np remove @user\``)
            );
        return message.reply({
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });
    }

    const record = await NoPrefix.findOne({ where: { userId: targetUser.id } });

    if (!record) {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `[${targetUser.username}](https://discord.com/users/${targetUser.id}) does not have no-prefix access!`
                )
            );
        return message.reply({
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });
    }

    await record.destroy();

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Successfully revoked no-prefix access from [${targetUser.username}](https://discord.com/users/${targetUser.id})`
            )
        );

    return message.reply({
        components: [container],
        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
    });
}
