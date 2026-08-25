const { ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder, SeparatorBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { formatDuration, createProgressBar } = require('../helpers/musicHelpers');
const emojis = require('../emojis.json');

module.exports = {
    name: 'nowplaying',
    aliases: ['np'],
    description: 'Show the currently playing song',

    async execute(message) {
        const { client, member, guild } = message;
        
        if (!member.voice.channel) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} You need to be in a voice channel!`));
            return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        }

        const player = client.poru.players.get(guild.id);
        
        if (!player || !player.currentTrack) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.error} No music is currently playing!`));
            return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
        }

        const track = player.currentTrack;
        const progressBar = createProgressBar(player);

        const container = new ContainerBuilder();
        
        if (track.info.artworkUrl || track.info.image) {
            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.nowplaying} **Now Playing**\n**[${track.info.title}](${track.info.uri})**`)
                    )
                    .setThumbnailAccessory(
                        new ThumbnailBuilder()
                            .setDescription(track.info.title)
                            .setURL(track.info.artworkUrl || track.info.image)
                    )
            );
        } else {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${emojis.nowplaying} **Now Playing**\n**[${track.info.title}](${track.info.uri})**`)
            );
        }

        container
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.artist} Artist: ${track.info.author}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.duration} Duration: ${formatDuration(track.info.length)}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.progress} Progress: ${progressBar}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.loopQueue} Loop: ${player.loop === 'TRACK' ? `${emojis.loopTrack} Track` : player.loop === 'QUEUE' ? `${emojis.loopQueue} Queue` : `${emojis.loopOff} Off`}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.autoplay} Autoplay: ${player.autoplayEnabled ? `${emojis.enabled} On` : `${emojis.disabled} Off`}`))
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emojis.requester} Requested by ${track.info.requester}`));

        return message.reply({ components: [container], flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2 });
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
