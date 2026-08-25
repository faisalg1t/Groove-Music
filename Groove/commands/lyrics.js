const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { hexToDecimal } = require('../helpers/colorHelper');
const { formatDuration } = require('../helpers/musicHelpers');
const config = require('../config');
const emojis = require('../emojis.json');
const Genius = require('genius-lyrics');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Show the lyrics of the currently playing song'),
    
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

        const player = client.poru.players.get(guild.id);
        if (!player) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} No music is currently playing!`)
                );
            return interaction.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, 
                ephemeral: true 
            });
        }

        await interaction.deferReply();

        const track = player.currentTrack;
        if (!track) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} No track is currently playing!`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        let artist, titleForSearch;
        const separators = ['-', '–', '|'];
        let potentialSplit = null;
        const originalTitle = track.info.title || '';

        for (const sep of separators) {
            if (originalTitle.includes(sep)) {
                potentialSplit = originalTitle.split(sep);
                break;
            }
        }

        if (potentialSplit && potentialSplit.length >= 2) {
            artist = potentialSplit[0].trim();
            titleForSearch = potentialSplit.slice(1).join(' ').trim();
        } else {
            artist = track.info.author || '';
            titleForSearch = originalTitle;
        }

        const cleanUpRegex = /official|lyric|video|audio|mv|hd|hq|ft|feat/gi;
        artist = artist.replace(cleanUpRegex, '').trim();
        titleForSearch = titleForSearch.replace(cleanUpRegex, '').trim();
        titleForSearch = titleForSearch.replace(/\(.*?\)|\[.*?\]/g, '').trim();

        let lyrics = null;
        let foundRecord = null;
        let embedArtist = artist;
        let embedTitle = titleForSearch;

        try {
            const params = new URLSearchParams();
            if (titleForSearch) {
                params.set('track_name', titleForSearch);
            } else if (originalTitle) {
                params.set('q', originalTitle);
            }

            if (artist) params.set('artist_name', artist);

            const headers = {
                'User-Agent': 'Groove-Music Bot v1.0',
            };

            const lrclibUrl = `https://lrclib.net/api/search?${params.toString()}`;
            const response = await fetch(lrclibUrl, { headers });
            
            if (response.status === 200) {
                const list = await response.json();
                if (Array.isArray(list) && list.length > 0) {
                    foundRecord = list.find(record => {
                        return (
                            record.trackName &&
                            record.artistName &&
                            record.trackName.toLowerCase().includes(titleForSearch.toLowerCase()) &&
                            record.artistName.toLowerCase().includes(artist.toLowerCase())
                        );
                    }) || list[0];

                    if (foundRecord && (foundRecord.plainLyrics || foundRecord.syncedLyrics)) {
                        lyrics = foundRecord.plainLyrics || foundRecord.syncedLyrics;
                    }
                }
            }
        } catch (e) {
            console.error('LRCLIB API request failed:', e);
        }

        if (!lyrics && artist && titleForSearch) {
            try {
                const lyricsOvhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(titleForSearch)}`;
                const response = await fetch(lyricsOvhUrl);
                
                if (response.status === 200) {
                    const data = await response.json();
                    if (data && data.lyrics) {
                        lyrics = data.lyrics;
                        foundRecord = { source: 'lyrics.ovh' };
                    }
                }
            } catch (e) {
                console.error('Lyrics.ovh API request failed:', e);
            }
        }

        if (!lyrics && config.GENIUS && config.GENIUS.API_KEY) {
            try {
                const searchQuery = `${artist} ${titleForSearch}`.trim();
                
                if (searchQuery.length > 0) {
                    const geniusClient = new Genius.Client(config.GENIUS.API_KEY);
                    const searches = await geniusClient.songs.search(searchQuery);
                    
                    if (searches && searches.length > 0) {
                        const song = searches[0];
                        lyrics = await song.lyrics();
                        
                        if (lyrics) {
                            embedArtist = song.artist.name;
                            embedTitle = song.title;
                            foundRecord = { source: 'genius' };
                        }
                    }
                }
            } catch (e) {
                console.error('Genius API request failed:', e);
            }
        }

        if (!lyrics) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} Could not find lyrics for this song.`)
                );
            return interaction.editReply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        const trimmedLyrics = lyrics.length > 3900 ? lyrics.substring(0, 3897) + '...' : lyrics;

        if (foundRecord && foundRecord.source !== 'genius') {
            embedArtist = foundRecord.artistName || embedArtist;
            embedTitle = foundRecord.trackName || embedTitle;
        }

        const lyricsSource = foundRecord?.source === 'genius' ? 'genius.com' : foundRecord?.source === 'lyrics.ovh' ? 'lyrics.ovh' : 'lrclib.net';
        
        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${emojis.lyrics} ${embedArtist} - ${embedTitle}`)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`[View on YouTube](${track.info.uri})`)
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(trimmedLyrics)
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`Source: ${lyricsSource}`)
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
