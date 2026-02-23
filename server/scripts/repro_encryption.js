const crypto = require('crypto');

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

function decrypt(text, salt) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = textParts.join(':');
        const key = getCipherKey(salt);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        return `FAILED: ${err.message}`;
    }
}

const testText = 'my-secret-api-key';
const machineId = 'test-machine-id';

console.log('--- Testing Key Derivation Impact ---');

const encryptedWithSalt = encrypt(testText, machineId);
const encryptedWithoutSalt = encrypt(testText, '');

console.log('Encrypted with salt:', encryptedWithSalt);
console.log('Encrypted without salt:', encryptedWithoutSalt);

console.log('\n--- Decryption Matrix ---');
console.log('EncWithSalt -> DecWithSalt:', decrypt(encryptedWithSalt, machineId));
console.log('EncWithSalt -> DecWithoutSalt:', decrypt(encryptedWithSalt, ''));
console.log('EncWithoutSalt -> DecWithSalt:', decrypt(encryptedWithoutSalt, machineId));
console.log('EncWithoutSalt -> DecWithoutSalt:', decrypt(encryptedWithoutSalt, ''));
