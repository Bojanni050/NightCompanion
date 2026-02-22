export function PromptSkeleton() {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col w-full overflow-hidden animate-pulse">
            <div className="p-5 pb-0">
                <div className="flex items-start justify-between mb-2">
                    {/* Title skeleton */}
                    <div className="h-4 bg-slate-800 rounded w-1/3" />
                    {/* Favorite button skeleton */}
                    <div className="w-4 h-4 rounded bg-slate-800" />
                </div>

                <div className="flex items-center gap-3 mb-2">
                    <div className="h-2.5 bg-slate-800 rounded w-16" />
                    <div className="h-2.5 bg-slate-800 rounded w-12" />
                </div>

                {/* Content skeleton */}
                <div className="space-y-2 mb-3 mt-4">
                    <div className="h-3 bg-slate-800 rounded w-full" />
                    <div className="h-3 bg-slate-800 rounded w-5/6" />
                    <div className="h-3 bg-slate-800 rounded w-4/6" />
                </div>

                {/* Tags skeleton */}
                <div className="h-16 mb-4">
                    <div className="flex flex-wrap gap-1">
                        <div className="h-5 bg-slate-800 rounded-full w-16" />
                        <div className="h-5 bg-slate-800 rounded-full w-20" />
                        <div className="h-5 bg-slate-800 rounded-full w-12" />
                    </div>
                </div>
            </div>

            <div className="px-5 pb-5">
                {/* Image Grid Skeleton */}
                <div className="grid grid-cols-1 gap-2 mb-3">
                    <div className="relative w-full aspect-square bg-slate-800/80 rounded-xl overflow-hidden" />
                </div>

                {/* Footer skeleton */}
                <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="w-3 h-3 rounded bg-slate-800" />
                        ))}
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-6 h-6 rounded bg-slate-800" />
                        <div className="w-6 h-6 rounded bg-slate-800" />
                        <div className="w-6 h-6 rounded bg-slate-800" />
                    </div>
                </div>
            </div>
        </div>
    );
}
