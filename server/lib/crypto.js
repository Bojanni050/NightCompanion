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

    const textParts = text.split(':');
    if (textParts.length < 2) return null;

    const ivHex = textParts.shift();
    const encryptedText = textParts.join(':');
    const iv = Buffer.from(ivHex, 'hex');

    // Pass 1: Try salted decryption (New standard)
    try {
        const key = getCipherKey(machineId);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // Fallback: Try unsalted decryption (Legacy mode)
        try {
            const legacyKey = getCipherKey('');
            const decipher = crypto.createDecipheriv(ALGORITHM, legacyKey, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            // Log once so we know legacy keys are still present
            console.log('🔓 Note: Successfully decrypted key using legacy (unsalted) fallback.');
            return decrypted;
        } catch (fallbackErr) {
            console.error('Decryption failed (even with fallback):', fallbackErr.message);
            return null;
        }
    }
}

function maskKey(key) {
    if (!key || key.length <= 4) return '****';
    return '****' + key.slice(-4);
}

module.exports = { encrypt, decrypt, maskKey };
