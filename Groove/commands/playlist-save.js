const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const Playlist = require('../../database/models/Playlist');
const PlaylistTrack = require('../../database/models/PlaylistTrack');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlistsave')
        .setDescription('Save the current queue as a playlist')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name for your new playlist')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const { client, member, guild } = interaction;
        
        if (!member.voice.channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You need to be in a voice channel!`)
                );
            return interaction.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, 
                ephemeral: true 
            });
        }

        await interaction.deferReply({ ephemeral: true });

        const playlistName = interaction.options.getString('name');
        const userId = interaction.user.id;

        const playlistCount = await Playlist.count({ where: { userId } });

        if (playlistCount >= config.MUSIC.PLAYLIST_LIMIT) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emojis.error} You have reached the maximum playlist limit (**${config.MUSIC.PLAYLIST_LIMIT}** playlists)!`
                    )
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const player = client.poru.players.get(guild.id);

        if (!player || (!player.currentTrack && player.queue.length === 0)) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} The queue is empty! Play some songs first.`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const existing = await Playlist.findOne({ where: { userId, name: playlistName } });
        if (existing) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emojis.error} You already have a playlist named **${playlistName}**!`
                    )
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const playlist = await Playlist.create({ userId, name: playlistName });

        const tracksToSave = [];
        if (player.currentTrack) {
            tracksToSave.push({
                playlistId: playlist.id,
                title: player.currentTrack.info.title,
                identifier: player.currentTrack.info.identifier,
                author: player.currentTrack.info.author,
                length: player.currentTrack.info.length,
                uri: player.currentTrack.info.uri,
                artworkUrl: player.currentTrack.info.artworkUrl || player.currentTrack.info.image || null,
            });
        }
        for (const track of player.queue) {
            tracksToSave.push({
                playlistId: playlist.id,
                title: track.info.title,
                identifier: track.info.identifier,
                author: track.info.author,
                length: track.info.length,
                uri: track.info.uri,
                artworkUrl: track.info.artworkUrl || track.info.image || null,
            });
        }

        await PlaylistTrack.bulkCreate(tracksToSave);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.success} Created playlist **${playlistName}** with **${tracksToSave.length}** songs!`
                )
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
