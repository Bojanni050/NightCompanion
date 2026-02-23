const crypto = require('crypto');

const machineId = 'test-machine-id';
const RAW_ENCRYPTION_KEY = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
const ALGORITHM = 'aes-256-cbc';

function getCipherKey(salt) {
    return crypto.pbkdf2Sync(RAW_ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
}

function encrypt(text, salt) {
    const key = getCipherKey(salt);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// SIMULATE the new logic in server/lib/crypto.js
function decryptImproved(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');

    // Pass 1: Salted
    try {
        const key = getCipherKey(machineId);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return `SUCCESS (Salted): ${decrypted}`;
    } catch (e) {
        // Pass 2: Legacy
        try {
            const legacyKey = getCipherKey('');
            const decipher = crypto.createDecipheriv(ALGORITHM, legacyKey, iv);
            let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return `SUCCESS (Legacy): ${decrypted}`;
        } catch (e2) {
            return `FAILED: ${e2.message}`;
        }
    }
}

const testText = 'my-secret-api-key';
const encryptedWithSalt = encrypt(testText, machineId);
const encryptedWithoutSalt = encrypt(testText, '');

console.log('--- Testing Two-Pass Decryption Fallback ---');
console.log('Deciphering Salted Input: ', decryptImproved(encryptedWithSalt));
console.log('Deciphering Unsalted Input:', decryptImproved(encryptedWithoutSalt));
