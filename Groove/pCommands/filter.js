const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require('discord.js');
const { customFilter } = require('poru');
const emojis = require('../emojis.json');

module.exports = {
    name: 'filter',
    description: 'Apply audio filter (equalizer)',
    
    async execute(message) {
        const { client, member, guild } = message;
        
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

        const player = client.poru.players.get(guild.id);
        if (!player) {
            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`${emojis.error} No music is currently playing!`)
                );
            return message.reply({ 
                components: [container], 
                flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2
            });
        }

        if (!(player.filters instanceof customFilter)) {
            player.filters = new customFilter(player);
        }

        const filterList = [
            { id: 'nightcore', label: 'Nightcore', emoji: emojis.nightcore },
            { id: 'vaporwave', label: 'Vaporwave', emoji: emojis.vaporwave },
            { id: 'bassboost', label: 'Bassboost', emoji: emojis.bassboost },
            { id: 'eightD', label: '8D', emoji: emojis.eightD },
            { id: 'karaoke', label: 'Karaoke', emoji: emojis.karaoke },
            { id: 'vibrato', label: 'Vibrato', emoji: emojis.vibrato },
            { id: 'tremolo', label: 'Tremolo', emoji: emojis.tremolo },
            { id: 'slowed', label: 'Slowed', emoji: emojis.slowed },
            { id: 'distortion', label: 'Distortion', emoji: emojis.distortion },
            { id: 'pop', label: 'Pop', emoji: emojis.pop },
            { id: 'soft', label: 'Soft', emoji: emojis.soft },
        ];

        const resetButton = new ButtonBuilder()
            .setCustomId('filter_reset')
            .setLabel('Reset')
            .setStyle(ButtonStyle.Danger);

        const rows = [new ActionRowBuilder(), new ActionRowBuilder(), new ActionRowBuilder()];

        for (let i = 0; i < filterList.length; i++) {
            const filter = filterList[i];
            const btn = new ButtonBuilder()
                .setCustomId(`filter_${filter.id}`)
                .setLabel(filter.label)
                .setStyle(ButtonStyle.Secondary);
            if (i < 5) rows[0].addComponents(btn);
            else if (i < 10) rows[1].addComponents(btn);
            else rows[2].addComponents(btn);
        }
        rows[2].addComponents(resetButton);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## ${emojis.filter} Audio Filters\nSelect a filter to apply to the music:`)
            )
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addActionRowComponents(rows[0])
            .addActionRowComponents(rows[1])
            .addActionRowComponents(rows[2])
            .addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`Powered by Eleone Hub`)
            );

        const filterMsg = await message.reply({
            components: [container],
            fetchReply: true,
            flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
        });

        if (player.filterCollector) player.filterCollector.stop();
        const collector = filterMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 0,
        });
        player.filterCollector = collector;

        collector.on('collect', async (btnInt) => {
            if (btnInt.user.id !== message.author.id) {
                const errorContainer = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.error} Only the command user can use these buttons!`)
                    );
                return btnInt.reply({ 
                    components: [errorContainer], 
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2, 
                    ephemeral: true 
                });
            }

            if (!(player.filters instanceof customFilter)) {
                player.filters = new customFilter(player);
            }

            if (btnInt.customId === 'filter_reset') {
                player.filters.clearFilters(true);
                await player.filters.updateFilters();
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.success} All filters have been reset!`)
                    );
                await btnInt.reply({
                    components: [container],
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                    ephemeral: true
                });
                return;
            }

            const filterId = btnInt.customId.replace('filter_', '');
            let applied = false;
            
            switch (filterId) {
                case 'nightcore':
                    player.filters.setNightcore(true);
                    applied = true;
                    break;
                case 'vaporwave':
                    player.filters.setVaporwave(true);
                    applied = true;
                    break;
                case 'bassboost':
                    player.filters.setBassboost(true);
                    applied = true;
                    break;
                case 'eightD':
                    player.filters.set8D(true);
                    applied = true;
                    break;
                case 'karaoke':
                    player.filters.setKaraoke(true);
                    applied = true;
                    break;
                case 'vibrato':
                    player.filters.setVibrato(true);
                    applied = true;
                    break;
                case 'tremolo':
                    player.filters.setTremolo(true);
                    applied = true;
                    break;
                case 'slowed':
                    player.filters.setSlowmode(true);
                    applied = true;
                    break;
                case 'distortion':
                    player.filters.setDistortion(true);
                    applied = true;
                    break;
                case 'pop':
                    player.filters.setEqualizer([
                        { band: 1, gain: 0.35 },
                        { band: 2, gain: 0.25 },
                        { band: 3, gain: 0.0 },
                        { band: 4, gain: -0.25 },
                        { band: 5, gain: -0.3 },
                        { band: 6, gain: -0.2 },
                        { band: 7, gain: -0.1 },
                        { band: 8, gain: 0.15 },
                        { band: 9, gain: 0.25 },
                    ]);
                    applied = true;
                    break;
                case 'soft':
                    player.filters.setEqualizer([
                        { band: 0, gain: 0 },
                        { band: 1, gain: 0 },
                        { band: 2, gain: 0 },
                        { band: 3, gain: 0 },
                        { band: 4, gain: 0 },
                        { band: 5, gain: 0 },
                        { band: 6, gain: 0 },
                        { band: 7, gain: 0 },
                        { band: 8, gain: -0.25 },
                        { band: 9, gain: -0.25 },
                        { band: 10, gain: -0.25 },
                        { band: 11, gain: -0.25 },
                        { band: 12, gain: -0.25 },
                        { band: 13, gain: -0.25 },
                    ]);
                    applied = true;
                    break;
            }

            if (applied) {
                await player.filters.updateFilters();
                const container = new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(`${emojis.success} Applied **${filterId}** filter!`)
                    );
                await btnInt.reply({
                    components: [container],
                    flags: MessageFlags.IsPersistent | MessageFlags.IsComponentsV2,
                    ephemeral: true
                });
            }
        });

        player.on('destroy', () => {
            if (player.filterCollector) player.filterCollector.stop();
            player.filterCollector = null;
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
