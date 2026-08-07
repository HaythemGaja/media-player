const { useState, useEffect, useContext } = React;
const { Star, Play, Plus, Check, Info } = window.LucideIcons;
const { AppContext } = window.UIP;

const HeroBanner = ({ endpoint }) => {
    const { tmdbKey, dbLanguage, hideAdult, favorites, toggleFavorite, openDetails } = useContext(AppContext);
    const [heroItem, setHeroItem] = useState(null);
    
    useEffect(() => {
        fetch(`https://api.themoviedb.org/3${endpoint}?api_key=${tmdbKey}&language=${dbLanguage}`)
            .then(res => res.json()).then(data => {
                const validList = (data.results || []).filter(i => hideAdult ? !i.adult : true);
                setHeroItem(validList.find(i => i.backdrop_path && i.overview) || validList[0]);
            });
    }, [endpoint, tmdbKey, dbLanguage, hideAdult]);

    if (!heroItem) return <div className="h-[60vh] w-full bg-neutral-900 animate-pulse"></div>;
    const isFav = favorites.some(f => f.id === heroItem.id);

    return (
        <div className="relative w-full h-[65vh] sm:h-[75vh] flex flex-col justify-end pb-12">
            <div className="absolute inset-0 z-0">
                <img src={`https://image.tmdb.org/t/p/original${heroItem.backdrop_path || heroItem.poster_path}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 hero-gradient"></div>
            </div>
            <div className="relative z-10 px-4 sm:px-8 flex flex-col items-center text-center space-y-4">
                <h1 className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-lg">{heroItem.title || heroItem.name}</h1>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                    <span className="text-green-500 font-bold">{Math.round((heroItem.vote_average || 0) * 10)}% Match</span>
                    <span className="flex items-center gap-1 text-amber-400"><Star size={12} className="fill-amber-400"/> {heroItem.vote_average ? heroItem.vote_average.toFixed(1) : 'NR'}</span>
                    <span>{(heroItem.release_date || heroItem.first_air_date || '').substring(0,4)}</span>
                    <span className="border border-gray-600 px-1 rounded text-[10px]">HD</span>
                </div>
                <div className="flex items-center justify-center gap-4 w-full max-w-sm mt-2">
                    <button onClick={() => toggleFavorite(heroItem)} className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors">
                        {isFav ? <Check size={24} /> : <Plus size={24} />}
                        <span className="text-[10px] font-medium">Watchlist</span>
                    </button>
                    <button onClick={() => openDetails(heroItem)} className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-2 rounded font-bold hover:bg-gray-200 transition-colors shadow-lg">
                        <Play size={20} className="fill-black" /> Play
                    </button>
                    <button onClick={() => openDetails(heroItem)} className="flex flex-col items-center gap-1 text-gray-300 hover:text-white transition-colors">
                        <Info size={24} />
                        <span className="text-[10px] font-medium">Info</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

window.UIP.HeroBanner = HeroBanner;