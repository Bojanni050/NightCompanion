const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');

// Get machine specific ID to use as a salt so DB isn't portable just by copying the .env
let machineId = '';
try {
    machineId = machineIdSync();
} catch (err) {
    console.warn('⚠️ WARNING: Could not get machine ID for encryption salt, falling back to default.', err.message);
    machineId = 'fallback-machine-id-string';
}

// Ensure ENCRYPTION_KEY is set or use a fallback. 
const RAW_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'nightcafe-companion-secret-key';
const ALGORITHM = 'aes-256-cbc';

/**
 * Derive a secure 32-byte key using PBKDF2 hashing the ENCRYPTION_KEY with a salt.
 * @param {string} salt - The salt to use (usually machineId).
 */
function getCipherKey(salt) {
    return crypto.pbkdf2Sync(RAW_ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
}

function encrypt(text) {
    if (!text) return null;
    const key = getCipherKey(machineId);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (!text) return null;

    let iv, encryptedText;
    const hasColon = text.includes(':');

    if (hasColon) {
        const textParts = text.split(':');
        iv = Buffer.from(textParts.shift(), 'hex');
        encryptedText = textParts.join(':');
    } else if (text.length >= 32) {
        // Fallback: Assume first 32 hex chars is IV
        iv = Buffer.from(text.substring(0, 32), 'hex');
        encryptedText = text.substring(32);
    } else {
        // Too short to be standard encryption
        return text;
    }

    const salts = [machineId, '']; // Try modern, then legacy

    for (const salt of salts) {
        try {
            const key = getCipherKey(salt);
            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            if (salt === '') {
                console.log('🔓 Note: Successfully decrypted key using legacy (unsalted) fallback.');
            }
            return decrypted;
        } catch (err) {
            // Continue to next salt/fallback
        }
    }

    // Last resort: If decryption failed but it looks like it might be a raw key
    // (e.g. hex string of 64 chars or starts with common provider prefixes)
    if (text.startsWith('sk-') || text.startsWith('pk_') || text.length === 64) {
        console.warn('⚠️ Warning: Decryption failed, but string looks like a raw key. Returning as-is.');
        return text;
    }

    console.error('Decryption failed for key:', text.substring(0, 10) + '...');
    return null;
}

function maskKey(key) {
    if (!key || key.length <= 4) return '****';
    return '****' + key.slice(-4);
}

module.exports = { encrypt, decrypt, maskKey };
