import json

# Load the generated JSON
with open('updated_models.json', 'r', encoding='utf-8') as f:
    models = json.load(f)

models_ts = json.dumps(models, indent=2)

content = """export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  bestFor: string[];
  styleTags: string[];
  qualityRating: number;
  speedRating: number;
  keywords: string[];
  recommendedPreset?: string;
  // New specific ratings from CSV
  artRating?: number;
  promptingRating?: number;
  realismRating?: number;
  typographyRating?: number;
  costLevel?: number; // 1-5 scale based on $
  modelType?: 'Image' | 'Video' | 'Edit';
}

export const PRESET_OPTIONS = [
  'NightCafe', 'Cinematic', 'Realistic Anime', 'Artistic Portrait',
  'Detailed Gouache', 'Neo Impressionist', 'Pop Art', 'Anime',
  'Striking', '2.5D Anime', 'Anime v2', 'Hyperreal',
  'Candy v2', 'Photo', 'B&W Portrait', 'Color Portrait',
  'Vibrant', 'Epic Origami', '3D Game v2', 'Color Painting',
  'Oil Painting', 'Cosmic', 'Sinister', 'Candy',
  'Mecha', 'CGI Character', 'Epic', 'Dark Fantasy',
  'Cubist', '3D Game', 'Fantasy', 'Gouache',
  'Modern Comic', 'Abstract Curves', 'Bon Voyage', 'Cubist v2',
  'Matte', 'Charcoal', 'Horror', 'Surreal',
  'Steampunk', 'Cyberpunk', 'Synthwave', 'Heavenly'
] as const;

export const CATEGORY_OPTIONS = [
  'landscape',
  'character',
  'portrait',
  'abstract',
  'architecture',
  'concept art',
  'illustration',
  'photography',
  'anime',
  'fantasy',
  'sci-fi',
  'nature',
  'general',
] as const;

export const MODELS: ModelInfo[] = """ + models_ts + """;

export function analyzePrompt(prompt: string): { model: ModelInfo; score: number; reasons: string[] }[] {
  const lower = prompt.toLowerCase();
  const words = lower.split(/\\s+/);

  return MODELS.map((model) => {
    let score = 0;
    const reasons: string[] = [];

    const keywordMatches = model.keywords.filter((kw) => lower.includes(kw));
    if (keywordMatches.length > 0) {
      score += keywordMatches.length * 10;
      reasons.push(`Matches keywords: ${keywordMatches.slice(0, 4).join(', ')}`);
    }

    if (lower.includes('photo') || lower.includes('realistic') || lower.includes('real')) {
      if (model.styleTags.includes('photorealistic') || (model.realismRating && model.realismRating >= 4)) {
        score += 25;
        reasons.push('Strong photorealistic capabilities');
      }
    }

    if (lower.includes('anime') || lower.includes('manga')) {
      if (model.styleTags.includes('anime') || model.keywords.includes('anime') || model.name.toLowerCase().includes('anime')) {
        score += 25;
        reasons.push('Trained for anime/manga styles');
      }
    }

    if (lower.includes('art') || lower.includes('painting') || lower.includes('artistic')) {
       if (model.artRating && model.artRating >= 4) {
           score += 20;
           reasons.push('High artistic quality');
       }
    }

    if (lower.includes('text') || lower.includes('sign') || lower.includes('typography')) {
      if (model.id.startsWith('ideogram') || model.id === 'dalle3' || model.id === 'recraft-v3' || (model.typographyRating && model.typographyRating >= 4)) {
        score += 35;
        reasons.push('Excellent typography support');
      }
    }

    // Use general quality rating
    score += (model.qualityRating || 0) * 2;
    
    // Boost newer/pro models slightly if prompt is complex
    if (words.length > 20 && (model.id.includes('pro') || model.id.includes('flux-2'))) {
        score += 10;
        reasons.push('Handles complex prompts well');
    }

    return { model, score, reasons: reasons.length > 0 ? reasons : ['General-purpose model'] };
  })
    .sort((a, b) => b.score - a.score);
}

export function getTopCandidates(prompt: string, n: number = 5): { id: string; name: string; score: number }[] {
  const results = analyzePrompt(prompt);
  return results.slice(0, n).map(r => ({
    id: r.model.id,
    name: r.model.name,
    score: r.score
  }));
}

export function supportsNegativePrompt(modelId: string): boolean {
  if (!modelId) return true;
  if (modelId.includes('dalle3')) return false;
  if (modelId.startsWith('gpt')) return false;
  if (modelId.includes('flux')) return true;
  return true;
}
"""

with open('c:/Users/bojan/OneDrive/Documenten/GitHub/NightCompanion/src/lib/models-data.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Generated and updated models-data.ts")
