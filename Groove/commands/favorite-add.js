const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const Favorite = require('../../database/models/Favorite');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favoriteadd')
        .setDescription('Add a song to your favorites')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('Song title or URL (leave empty to add current track)')
                .setRequired(false)
                .setAutocomplete(true)
        ),
    
    async autocomplete(interaction) {
        const { client } = interaction;
        const focusedValue = interaction.options.getFocused();

        if (focusedValue.toLowerCase().includes('spotify') || focusedValue.toLowerCase().includes('youtube')) {
            const truncatedUrl = focusedValue.length > 50 ? focusedValue.slice(0, 47) + '...' : focusedValue;
            return interaction.respond([{ 
                name: `Add: ${truncatedUrl}`, 
                value: focusedValue 
            }]);
        }

        if (!client._musicAutocompleteCache) client._musicAutocompleteCache = new Map();
        const searchCache = client._musicAutocompleteCache;

        if (searchCache.has(focusedValue)) {
            return interaction.respond(searchCache.get(focusedValue));
        }

        if (!focusedValue || focusedValue.trim().length === 0) {
            return interaction.respond([]);
        }

        if (!client.poru || typeof client.poru.resolve !== 'function') {
            return interaction.respond([]);
        }

        try {
            let source = config.MUSIC.DEFAULT_PLATFORM || 'ytsearch';
            const res = await client.poru.resolve({ query: focusedValue, source: source, requester: interaction.user });
            if (!res || !res.tracks || !Array.isArray(res.tracks) || res.tracks.length === 0) {
                return interaction.respond([]);
            }
            const choices = res.tracks.slice(0, config.MUSIC.AUTOCOMPLETE_LIMIT).map((choice) => ({
                name: choice.info.title.length > 90 ? choice.info.title.slice(0, 87) + '…' : choice.info.title,
                value: choice.info.uri,
            }));
            searchCache.set(focusedValue, choices);
            return interaction.respond(choices);
        } catch (e) {
            return interaction.respond([]);
        }
    },

    async execute(interaction) {
        const { client, member, guild } = interaction;
        
        await interaction.deferReply({ ephemeral: true });
        
        const userId = interaction.user.id;
        const query = interaction.isChatInputCommand() ? interaction.options.getString('search') : null;
        let track;

        if (query) {
            const res = await client.poru.resolve({ query, requester: interaction.user });
            if (!res || !res.tracks || res.tracks.length === 0) {
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.error} Could not find that song!`)
                    );
                return interaction.editReply({ 
                    components: [container], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }
            track = res.tracks[0];
        } else {
            const player = client.poru.players.get(guild.id);
            track = player?.currentTrack;
        }

        if (!track) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} No track to add! Either search for a song or play music first.`)
                );
            return interaction.editReply({ 
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
            return interaction.editReply({ 
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
        
        return interaction.editReply({ 
            components: [container], 
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
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
