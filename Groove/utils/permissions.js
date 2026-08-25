const config = require('../config');
const emojis = require('../emojis.json');

/**
 * Checks if user has admin permissions
 * @param {Object} interaction - Discord interaction object
 * @returns {Promise<boolean>} - True if user is admin
 */
async function checkAdminPermissions(interaction) {
    const userId = interaction.user.id;
    const member = interaction.member;
    
    if (config.ADMIN_USER_IDS.includes(userId)) {
        if (config.DEBUG) {
            console.log(`${emojis.general.check_mark} User ${interaction.user.tag} (${userId}) authorized via ADMIN_USER_IDS`);
        }
        return true;
    }
    
    if (config.ADMIN_ROLE_ID && member) {
        if (member.roles.cache.has(config.ADMIN_ROLE_ID)) {
            if (config.DEBUG) {
                console.log(`${emojis.general.check_mark} User ${interaction.user.tag} (${userId}) authorized via ADMIN_ROLE_ID`);
            }
            return true;
        }
    }
    
    if (member && member.permissions.has('Administrator')) {
        if (config.DEBUG) {
            console.log(`${emojis.general.check_mark} User ${interaction.user.tag} (${userId}) authorized via Administrator permission`);
        }
        return true;
    }
    
    if (member && member.permissions.has('ManageGuild')) {
        if (config.DEBUG) {
            console.log(`${emojis.general.check_mark} User ${interaction.user.tag} (${userId}) authorized via ManageGuild permission`);
        }
        return true;
    }
    
    if (config.DEBUG) {
        console.log(`${emojis.general.cross_mark} User ${interaction.user.tag} (${userId}) denied access - insufficient permissions`);
    }
    
    return false;
}

/**
 * Checks if user is server owner
 * @param {Object} interaction - Discord interaction object
 * @returns {boolean} - True if user is server owner
 */
function isServerOwner(interaction) {
    return interaction.guild && interaction.guild.ownerId === interaction.user.id;
}

/**
 * Logs permission check for audit purposes
 * @param {Object} interaction - Discord interaction object
 * @param {boolean} granted - Whether permission was granted
 * @param {string} reason - Reason for permission decision
 */
function logPermissionCheck(interaction, granted, reason) {
    const timestamp = new Date().toISOString();
    const user = interaction.user.tag;
    const userId = interaction.user.id;
    const command = interaction.commandName;
    const guild = interaction.guild ? interaction.guild.name : 'DM';
    
    const status = granted ? `${emojis.general.check_mark} GRANTED` : `${emojis.general.cross_mark} DENIED`;
    
    console.log(`[${timestamp}] ${status} - User: ${user} (${userId}) | Command: ${command} | Guild: ${guild} | Reason: ${reason}`);
    
}

/**
 * Enhanced admin permission check with logging
 * @param {Object} interaction - Discord interaction object
 * @returns {Promise<boolean>} - True if user is admin
 */
async function checkAdminPermissionsWithLogging(interaction) {
    const userId = interaction.user.id;
    const member = interaction.member;
    
    if (config.ADMIN_USER_IDS.includes(userId)) {
        logPermissionCheck(interaction, true, 'User in ADMIN_USER_IDS');
        return true;
    }
    
    if (config.ADMIN_ROLE_ID && member && member.roles.cache.has(config.ADMIN_ROLE_ID)) {
        logPermissionCheck(interaction, true, 'User has ADMIN_ROLE_ID');
        return true;
    }
    
    if (member && member.permissions.has('Administrator')) {
        logPermissionCheck(interaction, true, 'User has Administrator permission');
        return true;
    }
    
    if (member && member.permissions.has('ManageGuild')) {
        logPermissionCheck(interaction, true, 'User has ManageGuild permission');
        return true;
    }
    
    if (isServerOwner(interaction)) {
        logPermissionCheck(interaction, true, 'User is server owner');
        return true;
    }
    
    logPermissionCheck(interaction, false, 'No valid permissions found');
    return false;
}

/**
 * Gets permission level for a user
 * @param {Object} interaction - Discord interaction object
 * @returns {string} - Permission level: 'owner', 'admin', 'user'
 */
function getUserPermissionLevel(interaction) {
    if (isServerOwner(interaction)) {
        return 'owner';
    }
    
    if (checkAdminPermissions(interaction)) {
        return 'admin';
    }
    
    return 'user';
}

module.exports = {
    checkAdminPermissions,
    checkAdminPermissionsWithLogging,
    isServerOwner,
    logPermissionCheck,
    getUserPermissionLevel
};

/*
 * Project: Groove Music
 * Author: faisalg1t (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisalg1t
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
