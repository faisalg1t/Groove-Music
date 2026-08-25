const config = require('../config');
const emojis = require('../emojis.json');

class Logger {
    constructor() {
        this.logChannel = null;
    }

    /**
     * Set the Discord channel for logging
     * @param {Object} channel - Discord channel object
     */
    setLogChannel(channel) {
        this.logChannel = channel;
    }

    /**
     * Log server creation
     * @param {Object} serverData - Server creation data
     * @param {Object} user - Discord user who created it
     */
    async logServerCreation(serverData, user) {
        const logMessage = {
            embeds: [{
                color: 0x00ff00,
                title: `${emojis.pterodactyl.server} Server Created`,
                fields: [
                    { name: 'Server Name', value: serverData.name, inline: true },
                    { name: 'Server ID', value: serverData.id?.toString() || 'Unknown', inline: true },
                    { name: 'Owner Email', value: serverData.ownerEmail || 'Unknown', inline: true },
                    { name: 'RAM', value: serverData.ram || 'Unknown', inline: true },
                    { name: 'CPU', value: serverData.cpu || 'Unknown', inline: true },
                    { name: 'Disk', value: serverData.disk || 'Unknown', inline: true },
                    { name: 'Node', value: serverData.node || 'Unknown', inline: true },
                    { name: 'Egg', value: serverData.egg || 'Unknown', inline: true },
                    { name: 'Created By', value: `${user.tag} (${user.id})`, inline: true }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Pterodactyl Bot Audit Log' }
            }]
        };

        await this.sendLog(logMessage);
        this.consoleLog('SERVER_CREATE', `Server ${serverData.name} created by ${user.tag}`);
    }

    /**
     * Log server deletion
     * @param {Object} serverData - Server data
     * @param {Object} user - Discord user who deleted it
     */
    async logServerDeletion(serverData, user) {
        const logMessage = {
            embeds: [{
                color: 0xff0000,
                title: `${emojis.general.trash} Server Deleted`,
                fields: [
                    { name: 'Server Name', value: serverData.name, inline: true },
                    { name: 'Server ID', value: serverData.id?.toString() || 'Unknown', inline: true },
                    { name: 'Owner Email', value: serverData.ownerEmail || 'Unknown', inline: true },
                    { name: 'Deleted By', value: `${user.tag} (${user.id})`, inline: true }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Pterodactyl Bot Audit Log' }
            }]
        };

        await this.sendLog(logMessage);
        this.consoleLog('SERVER_DELETE', `Server ${serverData.name} deleted by ${user.tag}`);
    }

    /**
     * Log user creation
     * @param {Object} userData - User data
     * @param {Object} user - Discord user who created it
     */
    async logUserCreation(userData, user) {
        const logMessage = {
            embeds: [{
                color: 0x0099ff,
                title: `${emojis.pterodactyl.user} User Created`,
                fields: [
                    { name: 'Email', value: userData.email, inline: true },
                    { name: 'Username', value: userData.username, inline: true },
                    { name: 'Full Name', value: `${userData.first_name} ${userData.last_name}`, inline: true },
                    { name: 'User ID', value: userData.id?.toString() || 'Unknown', inline: true },
                    { name: 'Created By', value: `${user.tag} (${user.id})`, inline: true }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Pterodactyl Bot Audit Log' }
            }]
        };

        await this.sendLog(logMessage);
        this.consoleLog('USER_CREATE', `User ${userData.email} created by ${user.tag}`);
    }

    /**
     * Log server suspension/unsuspension
     * @param {Object} serverData - Server data
     * @param {string} action - 'suspend' or 'unsuspend'
     * @param {Object} user - Discord user who performed action
     * @param {string} reason - Reason for action
     */
    async logServerSuspension(serverData, action, user, reason) {
        const logMessage = {
            embeds: [{
                color: action === 'suspend' ? 0xff6600 : 0x00ff00,
                title: action === 'suspend' ? `${emojis.general.ban} Server Suspended` : `${emojis.general.check_mark} Server Unsuspended`,
                fields: [
                    { name: 'Server Name', value: serverData.name, inline: true },
                    { name: 'Server ID', value: serverData.id?.toString() || 'Unknown', inline: true },
                    { name: 'Owner Email', value: serverData.ownerEmail || 'Unknown', inline: true },
                    { name: 'Action By', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Reason', value: reason || 'No reason provided', inline: false }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Pterodactyl Bot Audit Log' }
            }]
        };

        await this.sendLog(logMessage);
        this.consoleLog('SERVER_SUSPEND', `Server ${serverData.name} ${action}ed by ${user.tag}: ${reason}`);
    }

    /**
     * Log user ban/unban
     * @param {Object} userData - User data
     * @param {string} action - 'ban' or 'unban'
     * @param {Object} user - Discord user who performed action
     * @param {string} reason - Reason for action
     */
    async logUserBan(userData, action, user, reason) {
        const logMessage = {
            embeds: [{
                color: action === 'ban' ? 0xff0000 : 0x00ff00,
                title: action === 'ban' ? `${emojis.general.ban} User Banned` : `${emojis.general.check_mark} User Unbanned`,
                fields: [
                    { name: 'Email', value: userData.email, inline: true },
                    { name: 'Username', value: userData.username, inline: true },
                    { name: 'User ID', value: userData.id?.toString() || 'Unknown', inline: true },
                    { name: 'Action By', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Reason', value: reason || 'No reason provided', inline: false }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Pterodactyl Bot Audit Log' }
            }]
        };

        await this.sendLog(logMessage);
        this.consoleLog('USER_BAN', `User ${userData.email} ${action}ned by ${user.tag}: ${reason}`);
    }

    /**
     * Log password reset
     * @param {Object} userData - User data
     * @param {Object} user - Discord user who reset it
     */
    async logPasswordReset(userData, user) {
        const logMessage = {
            embeds: [{
                color: 0xffa500,
                title: `${emojis.general.key} Password Reset`,
                fields: [
                    { name: 'Email', value: userData.email, inline: true },
                    { name: 'Username', value: userData.username, inline: true },
                    { name: 'User ID', value: userData.id?.toString() || 'Unknown', inline: true },
                    { name: 'Reset By', value: `${user.tag} (${user.id})`, inline: true }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Pterodactyl Bot Audit Log' }
            }]
        };

        await this.sendLog(logMessage);
        this.consoleLog('PASSWORD_RESET', `Password reset for ${userData.email} by ${user.tag}`);
    }

    /**
     * Log API errors
     * @param {string} operation - Operation that failed
     * @param {Object} error - Error object
     * @param {Object} user - Discord user who triggered it
     */
    async logApiError(operation, error, user) {
        const logMessage = {
            embeds: [{
                color: 0xff0000,
                title: `${emojis.general.cross_mark} API Error`,
                fields: [
                    { name: 'Operation', value: operation, inline: true },
                    { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Error', value: error.message.substring(0, 1024), inline: false }
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Pterodactyl Bot Error Log' }
            }]
        };

        await this.sendLog(logMessage);
        this.consoleLog('API_ERROR', `${operation} failed for ${user.tag}: ${error.message}`);
    }

    /**
     * Send log message to Discord channel
     * @param {Object} logMessage - Discord message object
     */
    async sendLog(logMessage) {
        if (!this.logChannel) return;

        try {
            await this.logChannel.send(logMessage);
        } catch (error) {
            console.error('Failed to send log to Discord channel:', error);
        }
    }

    /**
     * Console logging with timestamps
     * @param {string} type - Log type
     * @param {string} message - Log message
     */
    consoleLog(type, message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }
}

const logger = new Logger();
module.exports = logger;

/*
 * Project: Groove Music
 * Author: faisalg1t (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisalg1t
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
