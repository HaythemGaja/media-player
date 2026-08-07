const { useState, useEffect, useContext } = React;
const { ArrowLeft, Star } = window.LucideIcons;
const { AppContext } = window.UIP;

const SeeAllView = ({ config, onBack }) => {
    const { tmdbKey, dbLanguage, hideAdult, openDetails } = useContext(AppContext);
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (Array.isArray(config.url)) { setItems(config.url); setHasMore(false); return; }
        setLoading(true);
        fetch(`https://api.themoviedb.org/3${config.url}${config.url.includes('?') ? '&' : '?'}api_key=${tmdbKey}&language=${dbLanguage}&page=${page}&include_adult=${!hideAdult}`)
            .then(res => res.json()).then(data => {
                const valid = (data.results || []).filter(i => i.poster_path && !i.known_for && (hideAdult ? !i.adult : true));
                setItems(prev => page === 1 ? valid : [...prev, ...valid]);
                setHasMore(data.page < data.total_pages);
                setLoading(false);
            }).catch(() => setLoading(false));
    }, [config.url, page, tmdbKey, dbLanguage, hideAdult]);

    return (
        <div className="pt-8 pb-24 px-4 max-w-5xl mx-auto min-h-screen animate-in fade-in">
            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-[#0f0f0f]/90 backdrop-blur-md py-4 z-20">
                <button onClick={onBack} className="p-2 bg-[#1e1e1e] hover:bg-[#2b2b2b] rounded-full"><ArrowLeft size={20}/></button>
                <h1 className="text-xl font-bold">{config.title}</h1>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {items.map(item => (
                    <div key={item.id} onClick={() => openDetails(item)} className="cursor-pointer transition-transform hover:scale-105 relative rounded-md">
                        <img src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : item.Poster} className="w-full aspect-[2/3] object-cover rounded-md shadow-lg" loading="lazy" />
                        <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400" /> {item.vote_average ? item.vote_average.toFixed(1) : 'NR'}</div>
                    </div>
                ))}
            </div>
            {hasMore && (
                <div className="mt-8 flex justify-center">
                    <button onClick={() => setPage(p => p + 1)} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-bold">{loading ? 'Loading...' : 'Load More'}</button>
                </div>
            )}
        </div>
    );
};

const FilteredGridView = ({ type, genre, year }) => {
    const { tmdbKey, dbLanguage, hideAdult, openDetails } = useContext(AppContext);
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => { setItems([]); setPage(1); setHasMore(true); }, [type, genre, year]);

    useEffect(() => {
        if (!genre && !year) return;
        setLoading(true);
        const url = `${type === 'movie' ? '/discover/movie' : '/discover/tv'}?sort_by=popularity.desc${genre ? `&with_genres=${genre}` : ''}${year ? `&${type === 'movie' ? 'primary_release_year' : 'first_air_date_year'}=${year}` : ''}&api_key=${tmdbKey}&language=${dbLanguage}&page=${page}&include_adult=${!hideAdult}`;

        fetch(`https://api.themoviedb.org/3${url}`).then(res => res.json()).then(data => {
            const valid = (data.results || []).filter(i => i.poster_path && !i.known_for && (hideAdult ? !i.adult : true));
            setItems(prev => page === 1 ? valid : [...prev, ...valid]);
            setHasMore(data.page < data.total_pages);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [type, genre, year, page, tmdbKey, dbLanguage, hideAdult]);

    if (!genre && !year) return null;
    return (
        <div className="pt-4 pb-24 px-4 max-w-5xl mx-auto animate-in fade-in">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {items.map(item => (
                    <div key={item.id} onClick={() => openDetails(item)} className="cursor-pointer transition-transform hover:scale-105 relative rounded-md">
                        <img src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : item.Poster} className="w-full aspect-[2/3] object-cover rounded-md shadow-lg" loading="lazy" />
                        <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400" /> {item.vote_average ? item.vote_average.toFixed(1) : 'NR'}</div>
                    </div>
                ))}
            </div>
            {hasMore && <div className="mt-8 flex justify-center"><button onClick={() => setPage(p => p + 1)} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-bold">{loading ? 'Loading...' : 'Load More'}</button></div>}
        </div>
    );
};

window.UIP.SeeAllView = SeeAllView;
window.UIP.FilteredGridView = FilteredGridView;