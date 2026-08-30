const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, StringSelectMenuBuilder, ActionRowBuilder, MessageFlags, ComponentType, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');

const categories = {
    playback: {
        name: 'Music PlayBack',
        commands: [
            { name: 'play', description: 'Play a song or add it to the queue' },
            { name: 'pause', description: 'Pause the currently playing song' },
            { name: 'resume', description: 'Resume the paused song' },
            { name: 'skip', description: 'Skip the current song' },
            { name: 'back', description: 'Play the previous song' },
            { name: 'stop', description: 'Stop music and clear the queue' },
            { name: 'disconnect', description: 'Disconnect the bot from voice channel' },
            { name: 'nowplaying', description: 'Show the currently playing song' },
            { name: 'forward', description: 'Skip forward in the current song' },
            { name: 'backward', description: 'Skip backward in the current song' }
        ]
    },
    queue: {
        name: 'Queue Management',
        commands: [
            { name: 'queue', description: 'Show the current song queue' },
            { name: 'shuffle', description: 'Shuffle the queue order' },
            { name: 'clear', description: 'Clear the current queue' },
            { name: 'remove', description: 'Remove a song from queue' },
            { name: 'move', description: 'Move a track to a different position in the queue' }
        ]
    },
    favorites: {
        name: 'Favourites',
        commands: [
            { name: 'favoriteadd', description: 'Add a song to your favorites' },
            { name: 'favoritelist', description: 'Show your favorite songs' },
            { name: 'favoriteplay', description: 'Play all songs from your favorites' },
            { name: 'favoriteremove', description: 'Remove a song from your favorites' }
        ]
    },
    playlists: {
        name: 'Playlists',
        commands: [
            { name: 'playlistcreate', description: 'Create a new empty playlist' },
            { name: 'playlistsave', description: 'Save the current queue as a playlist' },
            { name: 'playlistload', description: 'Clear the queue and load a playlist' },
            { name: 'playlistappend', description: 'Add songs from a playlist to the current queue' },
            { name: 'playlistlist', description: 'Show all of your saved playlists' },
            { name: 'playlistdelete', description: 'Delete one of your playlists' },
            { name: 'playlistrename', description: 'Rename one of your playlists' },
            { name: 'playlistshare', description: 'Share a playlist with others' },
            { name: 'playlistimport', description: 'Import playlist from share code or Spotify URL' },
            { name: 'playlisttrackadd', description: 'Add a single song to one of your playlists' },
            { name: 'playlisttracklist', description: 'Show the list of tracks in a playlist' },
            { name: 'playlisttrackremove', description: 'Remove a track from one of your playlists' }
        ]
    },
    settings: {
        name: 'Settings & Filters',
        commands: [
            { name: 'filter', description: 'Apply audio filter (equalizer)' },
            { name: 'loop', description: 'Set repeat mode' },
            { name: 'autoplay', description: 'Enable or disable autoplay' },
            { name: 'volume', description: 'Set music volume' },
            { name: 'seek', description: 'Seek to a specific time in the current song' }
        ]
    },
    info: {
        name: 'Information',
        commands: [
            { name: 'lyrics', description: 'Show the lyrics of the currently playing song' },
            { name: 'ping', description: 'Check the bot\'s latency' },
            { name: 'stats', description: 'Show bot statistics and information' },
            { name: 'help', description: 'Show this help menu' }
        ]
    }
};

function createHelpContainer(categoryKey = null) {
    const container = new ContainerBuilder();

    if (!categoryKey) {
        container
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`#Groove Music Help`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent('Select a category from the menu below to view available commands.')
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

        const categoryList = Object.values(categories).map(cat => 
            `${cat.emoji} **${cat.name}**`
        ).join('\n');
        
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(categoryList)
        );
    } else {
        const category = categories[categoryKey];
        if (!category) return container;

        container
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`# ${category.emoji} ${category.name}`)
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

        const commandList = category.commands.map(cmd => 
            `**${cmd.name}**\n${cmd.description}`
        ).join('\n');
        
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(commandList)
        );
    }

    container
        .addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems([new MediaGalleryItemBuilder().setURL('https://imgs.search.brave.com/8xRwYYZ6NLPeuJ0KYvMOWyFME_ktfqrxonjNL6DkCp0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2ViLzMw/LzcwL2ViMzA3MDNh/YjFkZTY3ZjZjOGM5/OGJkYzE3NjRlMWI3/LmpwZw')])
        )
        .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    return container;
}

function createSelectMenu(currentCategory = null) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('Select a category');

    selectMenu.addOptions({
        label: 'Home',
        description: 'Return to main help page',
        value: 'home',
        default: currentCategory === null
    });

    for (const [key, category] of Object.entries(categories)) {
        selectMenu.addOptions({
            label: category.name,
            description: `${category.commands.length} commands`,
            value: key,
            default: currentCategory === key
        });
    }

    return new ActionRowBuilder().addComponents(selectMenu);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all available commands'),

    async execute(interaction) {
        const container = createHelpContainer();
        const selectMenuRow = createSelectMenu();

        container.addActionRowComponents(selectMenuRow);

        const message = await interaction.reply({
            components: [container],
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 300000
        });

        collector.on('collect', async (selectInteraction) => {
            if (selectInteraction.user.id !== interaction.user.id) {
                const errorContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent('Only the command user can use this menu!')
                    );
                return selectInteraction.reply({
                    components: [errorContainer],
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                    ephemeral: true
                });
            }

            const selectedCategory = selectInteraction.values[0];
            const newContainer = createHelpContainer(selectedCategory === 'home' ? null : selectedCategory);
            const newSelectMenu = createSelectMenu(selectedCategory === 'home' ? null : selectedCategory);

            newContainer.addActionRowComponents(newSelectMenu);

            await selectInteraction.update({
                components: [newContainer],
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        });
    }
};

/*
 * Project: Groove Music
 * Author: faisaljs (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisaljs
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
