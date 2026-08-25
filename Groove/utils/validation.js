const config = require('../config');

/**
 * Validates memory format with smart unit detection
 * @param {string} input - Memory input (e.g., "512", "2048", "2.5")
 * @returns {boolean} - True if valid format
 */
function validateMemory(input) {
    if (typeof input !== 'string') return false;
    
    const memoryRegex = /^(\d+(?:\.\d+)?)\s*(MiB|GiB|MB|GB|M|G)?$/i;
    const match = input.match(memoryRegex);
    
    if (!match) return false;
    
    const value = parseFloat(match[1]);
    
    if (value <= 0) return false;
    
    if (value > 100000) return false; 
    
    return true;
}

/**
 * Converts memory input to MB with smart unit detection
 * @param {string} input - Memory input (e.g., "512", "2048", "2.5GiB")
 * @returns {number} - Memory in MB
 */
function convertToMB(input) {
    if (!validateMemory(input)) {
        throw new Error('Invalid memory format');
    }
    
    const memoryRegex = /^(\d+(?:\.\d+)?)\s*(MiB|GiB|MB|GB|M|G)?$/i;
    const match = input.match(memoryRegex);
    
    const value = parseFloat(match[1]);
    let unit = match[2] ? match[2].toUpperCase() : null;
    
    if (!unit) {
        if (value >= 64) {
            unit = 'MIB';
        } else {
            unit = 'GIB';
        }
    }
    
    if (unit === 'M' || unit === 'MB') unit = 'MIB';
    if (unit === 'G' || unit === 'GB') unit = 'GIB';
    
    switch (unit) {
        case 'MIB':
            return Math.round(value);
        case 'GIB':
            return Math.round(value * 1024);
        default:
            throw new Error('Unsupported memory unit');
    }
}

/**
 * Gets readable memory format with detected units
 * @param {string} input - Memory input (e.g., "512", "2048", "2.5GiB")
 * @returns {string} - Readable format (e.g., "512 MiB", "2 GiB")
 */
function getReadableMemoryFormat(input) {
    if (!validateMemory(input)) {
        return input;
    }
    
    const memoryRegex = /^(\d+(?:\.\d+)?)\s*(MiB|GiB|MB|GB|M|G)?$/i;
    const match = input.match(memoryRegex);
    
    const value = parseFloat(match[1]);
    let unit = match[2] ? match[2].toUpperCase() : null;
    
    if (!unit) {
        if (value >= 64) {
            unit = 'MiB';
        } else {
            unit = 'GiB';
        }
    } else {
        if (unit === 'M' || unit === 'MB' || unit === 'MIB') unit = 'MiB';
        if (unit === 'G' || unit === 'GB' || unit === 'GIB') unit = 'GiB';
    }
    
    return `${value} ${unit}`;
}

/**
 * Validates email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid email
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates CPU input
 * @param {string} cpu - CPU input (cores or percentage)
 * @returns {object} - { valid: boolean, value: number, type: 'cores'|'percentage' }
 */
function validateCPU(cpu) {
    if (typeof cpu !== 'string') {
        return { valid: false, error: 'CPU must be a string' };
    }
    
    if (cpu.endsWith('%')) {
        const percentage = parseInt(cpu.slice(0, -1));
        if (isNaN(percentage) || percentage <= 0 || percentage > 1000) {
            return { valid: false, error: 'CPU percentage must be between 1% and 1000%' };
        }
        return { valid: true, value: percentage, type: 'percentage' };
    } else {
        const cores = parseFloat(cpu);
        if (isNaN(cores) || cores <= 0) {
            return { valid: false, error: 'CPU cores must be a positive number' };
        }
        return { valid: true, value: cores * 100, type: 'cores' };
    }
}

/**
 * Validates username format
 * @param {string} username - Username
 * @returns {object} - { valid: boolean, error?: string }
 */
function validateUsername(username) {
    if (typeof username !== 'string') {
        return { valid: false, error: 'Username must be a string' };
    }
    
    if (username.length < 3 || username.length > 20) {
        return { valid: false, error: 'Username must be between 3 and 20 characters' };
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    
    return { valid: true };
}

/**
 * Validates password strength
 * @param {string} password - Password
 * @returns {object} - { valid: boolean, error?: string }
 */
function validatePassword(password) {
    if (typeof password !== 'string') {
        return { valid: false, error: 'Password must be a string' };
    }
    
    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    
    if (password.length > 128) {
        return { valid: false, error: 'Password cannot be longer than 128 characters' };
    }
    
    return { valid: true };
}

/**
 * Validates server name
 * @param {string} name - Server name
 * @returns {object} - { valid: boolean, error?: string }
 */
function validateServerName(name) {
    if (typeof name !== 'string') {
        return { valid: false, error: 'Server name must be a string' };
    }
    
    if (name.length < 1 || name.length > 255) {
        return { valid: false, error: 'Server name must be between 1 and 255 characters' };
    }
    
    if (!/^[a-zA-Z0-9\s\-_.()]+$/.test(name)) {
        return { valid: false, error: 'Server name contains invalid characters' };
    }
    
    return { valid: true };
}

module.exports = {
    validateMemory,
    convertToMB,
    getReadableMemoryFormat,
    validateEmail,
    validateCPU,
    validateUsername,
    validatePassword,
    validateServerName
};

/*
 * Project: Groove Music
 * Author: faisalg1t (Faisal)
 * Organization: Eleone Hub
 * GitHub: https://github.com/faisalg1t
 * License: MIT
 * © 2026 Eleone Hub. All rights reserved.
 */
