const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SeparatorBuilder, SeparatorSpacingSize, MessageFlags, ComponentType } = require('discord.js');
const Playlist = require('../../database/models/Playlist');
const PlaylistTrack = require('../../database/models/PlaylistTrack');
const config = require('../config');
const emojis = require('../emojis.json');

module.exports = {
    name: 'pl import',
    aliases: ['playlist-import', 'plimport', 'pl-import'],
    description: 'Import playlist from share code or Spotify URL',
    
    async execute(message, args) {
        const { client, author } = message;
        
        if (args.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Please provide a share code or Spotify playlist URL!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        const codeOrUrl = args.join(' ');
        const userId = author.id;

        if (/^https?:\/\/open\.spotify\.com\/playlist\/[a-zA-Z0-9]+/i.test(codeOrUrl.trim())) {
            return _importFromSpotify(message, codeOrUrl);
        }

        try {
            const originalPlaylist = await Playlist.findOne({
                where: { shareCode: codeOrUrl },
                include: [{ model: PlaylistTrack, as: 'tracks' }],
            });

            if (!originalPlaylist) {
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `${emojis.error} Invalid share code! Please check the code and try again.`
                        )
                    );
                return message.reply({ 
                    components: [container], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }

            let newPlaylistName = originalPlaylist.name;

            const existing = await Playlist.findOne({ 
                where: { userId, name: newPlaylistName } 
            });
            
            if (existing) {
                newPlaylistName = `${newPlaylistName} (Imported)`;
            }

            const playlistCount = await Playlist.count({ where: { userId } });
            if (playlistCount >= config.MUSIC.PLAYLIST_LIMIT) {
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `${emojis.error} You have reached the maximum playlist limit (**${config.MUSIC.PLAYLIST_LIMIT}** playlists)!`
                        )
                    );
                return message.reply({ 
                    components: [container], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }

            const newPlaylist = await Playlist.create({
                userId: userId,
                name: newPlaylistName,
            });

            const tracksToCopy = originalPlaylist.tracks.map((track) => ({
                playlistId: newPlaylist.id,
                title: track.title,
                identifier: track.identifier,
                author: track.author,
                length: track.length,
                uri: track.uri,
            }));

            await PlaylistTrack.bulkCreate(tracksToCopy);

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emojis.success} Successfully imported **${tracksToCopy.length}** tracks from **${originalPlaylist.name}** as **${newPlaylist.name}**!`
                    )
                );

            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        } catch (error) {
            console.error('Playlist import from code failed:', error);
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emojis.error} Failed to import playlist. Please try again.`
                    )
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }
    },
};

async function _importFromSpotify(message, url) {
    const { client, author } = message;
    const userId = author.id;

    const loadingContainer = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`${emojis.music} Loading Spotify playlist...`)
        );
    const loadingMsg = await message.reply({ 
        components: [loadingContainer], 
        flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
    });

    const res = await client.poru.resolve({
        query: url,
        requester: author,
    });
    
    if (!res || res.loadType !== 'PLAYLIST_LOADED' || !res.tracks.length) {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.error} Failed to load Spotify playlist! Make sure the URL is valid.`
                )
            );
        return loadingMsg.edit({ 
            components: [container], 
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
        });
    }

    const spotifyPlaylistName = res.playlistInfo.name;
    const tracksFromSpotify = res.tracks;

    const existingPlaylist = await Playlist.findOne({ 
        where: { userId, name: spotifyPlaylistName } 
    });
    
    if (existingPlaylist) {
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ${emojis.music} Playlist Already Exists\nYou already have a playlist named **${spotifyPlaylistName}**. What would you like to do?`
                )
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('import_overwrite')
                .setLabel('Overwrite')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('import_copy')
                .setLabel('Create Copy')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('import_cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

        container.addActionRowComponents(row);

        const reply = await loadingMsg.edit({ 
            components: [container], 
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
        });

        const collector = reply.createMessageComponentCollector({
            filter: (i) => i.user.id === author.id,
            time: 60000,
        });

        collector.on('collect', async (i) => {
            await i.deferUpdate();

            if (i.customId === 'import_overwrite') {
                await PlaylistTrack.destroy({ where: { playlistId: existingPlaylist.id } });
                await _saveTracksToPlaylist(existingPlaylist, tracksFromSpotify);

                const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `${emojis.success} Overwritten playlist **${spotifyPlaylistName}** with **${tracksFromSpotify.length}** tracks from Spotify!`
                        )
                    );
                await i.editReply({ 
                    components: [successContainer], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            } else if (i.customId === 'import_copy') {
                let newName = '';
                let copyNum = 1;
                let isNameAvailable = false;

                while (!isNameAvailable) {
                    newName = `${spotifyPlaylistName} (${copyNum})`;
                    const check = await Playlist.findOne({ where: { userId, name: newName } });
                    if (!check) {
                        isNameAvailable = true;
                    } else {
                        copyNum++;
                    }
                }

                const newPlaylist = await Playlist.create({ userId, name: newName });
                await _saveTracksToPlaylist(newPlaylist, tracksFromSpotify);

                const successContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `${emojis.success} Created new playlist **${newName}** with **${tracksFromSpotify.length}** tracks from Spotify!`
                        )
                    );
                await i.editReply({ 
                    components: [successContainer], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            } else if (i.customId === 'import_cancel') {
                const cancelContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.error} Import cancelled.`)
                    );
                await i.editReply({ 
                    components: [cancelContainer], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }
            collector.stop();
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                const timeoutContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.error} Import timed out. Please try again.`)
                    );
                loadingMsg.edit({ 
                    components: [timeoutContainer], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
                });
            }
        });
    } else {
        const playlistCount = await Playlist.count({ where: { userId } });
        if (playlistCount >= config.MUSIC.PLAYLIST_LIMIT) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `${emojis.error} You have reached the maximum playlist limit (**${config.MUSIC.PLAYLIST_LIMIT}** playlists)!`
                    )
                );
            return loadingMsg.edit({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const newPlaylist = await Playlist.create({ userId, name: spotifyPlaylistName });
        await _saveTracksToPlaylist(newPlaylist, tracksFromSpotify);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.success} Successfully imported **${tracksFromSpotify.length}** tracks from Spotify playlist **${spotifyPlaylistName}**!`
                )
            );
        await loadingMsg.edit({ 
            components: [container], 
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
        });
    }
}

async function _saveTracksToPlaylist(playlist, tracks) {
    const tracksToSave = tracks.map((track) => ({
        playlistId: playlist.id,
        title: track.info.title,
        identifier: track.info.identifier,
        author: track.info.author,
        length: track.info.length,
        uri: track.info.uri,
    }));
    await PlaylistTrack.bulkCreate(tracksToSave);
}

/*
 * Project: Groove Music
 * Author: faisalg1t (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisalg1t
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
