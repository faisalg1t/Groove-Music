const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const Favorite = require('../../database/models/Favorite');
const emojis = require('../emojis.json');

module.exports = {
    name: 'fav play',
    aliases: ['favplay', 'favoriteplay', 'fav-play'],
    description: 'Play all songs from your favorites',
    
    async execute(message, args) {
        const { client, member, guild, channel } = message;
        
        if (!member.voice.channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You need to be in a voice channel!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        const loadingContainer = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emojis.music} Loading your favorites...`)
            );
        const loadingMsg = await message.reply({ 
            components: [loadingContainer], 
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
        });

        const append = args[0] === 'append' || args[0] === 'add';
        const userId = message.author.id;

        const favorites = await Favorite.findAll({
            where: { userId },
            order: [['createdAt', 'ASC']],
        });

        if (!favorites || favorites.length === 0) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} You don't have any favorite songs yet!`)
                );
            return loadingMsg.edit({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 
            });
        }

        let player = client.poru.players.get(guild.id);
        
        if (player && !append) {
            player.queue.clear();
        }

        if (!player) {
            player = client.poru.createConnection({
                guildId: guild.id,
                voiceChannel: member.voice.channel.id,
                textChannel: channel.id,
                deaf: true,
            });
            if (player.autoplayEnabled === undefined) player.autoplayEnabled = false;
        }

        let added = 0;
        for (const fav of favorites) {
            try {
                const poruTrack = await client.poru.resolve({ query: fav.uri, requester: message.author });
                if (poruTrack.tracks && poruTrack.tracks[0]) {
                    player.queue.add(poruTrack.tracks[0]);
                    added++;
                }
            } catch (e) {
                console.error(`Failed to resolve favorite: ${fav.title}`, e);
            }
        }

        if (!player.isPlaying && player.isConnected) player.play();

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${emojis.success} ${append ? 'Added' : 'Loaded'} **${added}** songs from your favorites to the queue!`
                )
            );
        
        return loadingMsg.edit({ 
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
