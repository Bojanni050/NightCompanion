import { useMemo, useState } from 'react';
import { Search, Zap } from 'lucide-react';
import { MODELS } from '../lib/models-data';

// Helper to pseudo-randomly generate realistic stats based on model ID
function generateModelStats(id: string, tags: string[], provider: string) {
    let seed = 0;
    for (let i = 0; i < id.length; i++) {
        seed += id.charCodeAt(i);
    }

    // Base stats (0-10)
    let art = 5 + (seed % 5);
    let prompting = 4 + ((seed * 2) % 6);
    let realism = 3 + ((seed * 3) % 7);
    let typography = 2 + ((seed * 4) % 8);
    let costStr = '$$$';

    if (tags.includes('artistic') || tags.includes('painterly')) art = Math.min(10, art + 3);
    if (tags.includes('photorealistic')) realism = Math.min(10, realism + 4);
    if (id.includes('v3') || id.includes('2.0') || id.includes('v4') || id.includes('pro')) prompting = Math.min(10, prompting + 3);
    if (tags.includes('typography') || id.includes('ideogram') || id.includes('dalle3')) typography = Math.max(8, typography);

    if (id.includes('fast') || id.includes('turbo') || id.includes('lightning') || id.includes('schnell')) {
        costStr = provider === 'NightCafe' ? 'Free' : '$';
    } else if (id.includes('pro') || id.includes('ultra') || id.includes('high')) {
        costStr = '$$$$';
    } else if (id.includes('gpt1-5') || id.includes('flux-pro')) {
        costStr = '$$$$$';
    } else {
        costStr = ['$$', '$$$', '$$$$'][seed % 3] as string;
    }

    const isPro = id.includes('pro') || costStr.length >= 4;

    return { art, prompting, realism, typography, costStr, isPro };
}

function StatBar({ label, value }: { label: string, value: number }) {
    const percentage = (value / 5) * 100; // Rating is 0-5

    return (
        <div className="flex items-center gap-2 mt-1">
            <span className="w-16 text-[8px] sm:text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default function NCModels() {
    const [searchTerm, setSearchTerm] = useState('');

    const ncModels = useMemo(() => {
        return MODELS.map(m => {
            return {
                ...m,
                art: m.artRating || m.qualityRating || 3,
                prompting: m.promptingRating || 3,
                realism: m.realismRating || 3,
                typography: m.typographyRating || 1,
                costStr: m.costLevel ? '$'.repeat(m.costLevel) : 'Free',
                isPro: (m.costLevel || 0) >= 4 || m.id.includes('pro')
            };
        });
    }, []);

    const filteredModels = useMemo(() => {
        if (!searchTerm) return ncModels;
        const lower = searchTerm.toLowerCase();
        return ncModels.filter(m =>
            m.name.toLowerCase().includes(lower) ||
            m.description.toLowerCase().includes(lower) ||
            m.keywords.some(k => k.toLowerCase().includes(lower))
        );
    }, [ncModels, searchTerm]);

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        NightCafe Models <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-medium ml-2">{ncModels.length} available</span>
                    </h1>
                    <p className="text-slate-400 mt-1 text-sm">Comprehensive guide to all available models and their capabilities.</p>
                </div>

                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search models or tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredModels.map((model) => (
                    <div key={model.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors group flex flex-col h-full">
                        {/* Image Header Area (Placeholder matching NC style) */}
                        <div className="h-32 bg-slate-800 relative overflow-hidden shrink-0">
                            {/* Just a stylized gradient background to make it look like the reference image since we don't have local thumbnails */}
                            <div className="absolute inset-x-0 top-0 h-full opacity-60 mix-blend-overlay">
                                <div className={`w-full h-full bg-gradient-to-br from-slate-700 to-slate-900`} />
                            </div>

                            {/* Generative art pattern placeholder */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_2px_2px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />

                            <div className="absolute top-2 left-2 flex gap-1">
                                {model.id.includes('lightning') || model.id.includes('turbo') || model.id.includes('fast') ? (
                                    <span className="px-1.5 py-0.5 bg-amber-500/90 text-[9px] font-bold text-white rounded shadow-sm flex items-center gap-0.5 uppercase tracking-wider backdrop-blur-md">
                                        <Zap size={8} className="fill-white" /> Fast
                                    </span>
                                ) : null}
                                {model.isPro && (
                                    <span className="px-1.5 py-0.5 bg-pink-600/90 text-[9px] font-bold text-white rounded shadow-sm uppercase tracking-wider backdrop-blur-md">
                                        Pro Model
                                    </span>
                                )}
                            </div>

                            {/* Model Title Overlay */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-3 pt-8">
                                <h3 className="text-white font-bold text-sm leading-tight drop-shadow-md">{model.name}</h3>
                            </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col gap-3">
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">
                                {model.description}
                            </p>

                            <div className="space-y-1.5 mt-auto pt-2 border-t border-slate-800/50">
                                <StatBar label="Art" value={model.art} />
                                <StatBar label="Prompting" value={model.prompting} />
                                <StatBar label="Realism" value={model.realism} />
                                <StatBar label="Typography" value={model.typography} />
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Cost:</span>
                                    <span className={`text-xs font-bold tracking-widest ${model.costStr === 'Free' ? 'text-teal-400' :
                                        model.costStr.length >= 4 ? 'text-rose-400' :
                                            model.costStr.length === 3 ? 'text-amber-400' :
                                                'text-emerald-400'
                                        }`}>
                                        {model.costStr}
                                    </span>
                                </div>

                                <div className="flex gap-1">
                                    {model.bestFor.slice(0, 2).map(bf => (
                                        <span key={bf} className="text-[9px] px-1.5 py-0.5 bg-slate-800/80 text-slate-400 rounded-md capitalize border border-slate-700/50">
                                            {bf}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredModels.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                    <Search size={32} className="opacity-20" />
                    <p>No models found matching "{searchTerm}"</p>
                </div>
            )}
        </div>
    );
}
