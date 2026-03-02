require('dotenv').config();
const { pool } = require('../db');
const { decrypt } = require('../lib/crypto');

const SYSTEM_PROMPT = `Extract 5-10 keywords from this image prompt. Focus on: subject, style, mood, setting, color palette, art technique. Return ONLY a JSON array of lowercase single words or short phrases. Example: ["portrait", "neon", "cyberpunk", "rain", "dramatic lighting"]`;

async function getOpenRouterKey() {
    const { rows } = await pool.query(`SELECT hash, iv FROM api_keys WHERE provider = 'openrouter' AND is_active = true LIMIT 1`);
    if (rows.length === 0) return null;
    return decrypt(rows[0].hash, rows[0].iv);
}

async function extractKeywords(promptText, apiKey) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'NightCafe Companion'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: promptText }
            ],
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return [];
    
    try {
        let parsed = JSON.parse(content);
        if (parsed.keywords && Array.isArray(parsed.keywords)) {
            return parsed.keywords;
        }
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return Object.values(parsed).filter(x => typeof x === 'string');
    } catch (e) {
        // Fallback for non-JSON returns
        return content.replace(/[\[\]"]/g, '').split(',').map(s => s.trim().toLowerCase());
    }
}

async function migrate() {
    try {
        console.log('🔍 Starting auto_keywords backfill migration...');
        
        const apiKey = await getOpenRouterKey();
        if (!apiKey) {
            console.log('⚠️ No active OpenRouter API key found. Please add one in settings or manually run the script later.');
            process.exit(1);
        }

        // Get prompts missing keywords
        const { rows: prompts } = await pool.query(`
            SELECT id, content 
            FROM prompts 
            WHERE auto_keywords IS NULL 
              AND content IS NOT NULL
              AND trim(content) != ''
        `);

        console.log(`📋 Found ${prompts.length} prompts to backfill.`);

        const BATCH_SIZE = 10;
        let processed = 0;
        let updatedCount = 0;

        for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
            const batch = prompts.slice(i, i + BATCH_SIZE);
            console.log(`⏳ Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(prompts.length / BATCH_SIZE)}...`);

            await Promise.all(batch.map(async (prompt) => {
                try {
                    const keywords = await extractKeywords(prompt.content, apiKey);
                    if (keywords && keywords.length > 0) {
                        // Store formatted PG array format: {"kw1","kw2"}
                        const pgArrayStr = `{${keywords.map(k => `"${k.replace(/"/g, '\\"')}"`).join(',')}}`;
                        await pool.query(`UPDATE prompts SET auto_keywords = $1 WHERE id = $2`, [pgArrayStr, prompt.id]);
                        updatedCount++;
                    }
                } catch (e) {
                    console.error(`❌ Error extracting keywords for prompt ${prompt.id}:`, e.message);
                }
            }));
            
            processed += batch.length;
            console.log(`✅ Processed ${processed}/${prompts.length} prompts.`);
            
            // Artificial delay to avoid rate-limiting
            if (i + BATCH_SIZE < prompts.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.log(`\n🎉 Migration Complete! Updated ${updatedCount} prompts with keywords.`);
    } catch (err) {
        console.error('🚨 Migration failed:', err);
    } finally {
        pool.end();
    }
}

migrate();
