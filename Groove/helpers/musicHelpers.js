const { PermissionFlagsBits } = require('discord.js');

function formatDuration(ms) {
    if (typeof ms !== 'number' || isNaN(ms) || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function createProgressBar(player) {
    if (!player.currentTrack || !player.currentTrack.info.length) return '';
    if (player.currentTrack.info.isStream) return '`00:00|▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔴 LIVE`';

    const current = player.position;
    const total = player.currentTrack.info.length;
    const size = 25;

    let percent = Math.round((current / total) * size);
    if (percent < 0) percent = 0;
    if (percent > size) percent = size;

    const empty = size - percent;
    const safeEmpty = empty < 0 ? 0 : empty;

    const progress = '▬'.repeat(percent) + '🔵' + '▬'.repeat(safeEmpty);
    return `\`${formatDuration(current)}|${progress}|${formatDuration(total)}\``;
}

function hasControlPermission(interactionOrMessage, player) {
    if (!player.currentTrack) return false;
    
    const member = interactionOrMessage.member;
    const userId = interactionOrMessage.user?.id || interactionOrMessage.author?.id;
    
    if (member.permissions.has(PermissionFlagsBits.ManageGuild) ||
        member.permissions.has(PermissionFlagsBits.Administrator)) {
        return true;
    }

    const requesterId = player.currentTrack.info.requester?.id;
    if (userId === requesterId) return true;

    return false;
}

module.exports = {
    formatDuration,
    createProgressBar,
    hasControlPermission
};

/*
 * Project: Groove Music
 * Author: faisalg1t (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisalg1t
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
