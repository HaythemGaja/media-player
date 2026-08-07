const { useState, useEffect, useContext, useMemo } = React;
const { Search, X, PlayCircle, Heart, Plus, Trash2, Share2, Clock, PieChart, BarChart2, History, Play, Bell, Server, User, Filter } = window.LucideIcons;
const { AppContext, HeroBanner, NewEpisodesRow, ContinueWatchingRow, MediaRow, FilteredGridView, ROW_CONFIGS } = window.UIP;

const HomeView = () => {
    const { setSeeAllConfig } = useContext(AppContext);
    return (
        <div className="pb-24 animate-in fade-in duration-500">
            <HeroBanner endpoint="/trending/all/day" />
            <div className="mt-[-80px] relative z-10">
                <NewEpisodesRow />
                <ContinueWatchingRow filterType="all" />
                {ROW_CONFIGS.home.map(row => <MediaRow key={row.title} title={row.title} url={row.url} onSeeAll={setSeeAllConfig} />)}
            </div>
        </div>
    );
};

const MoviesView = () => {
    const { setSeeAllConfig } = useContext(AppContext);
    return (
        <div className="pb-24 animate-in fade-in duration-500 relative">
            <HeroBanner endpoint="/trending/movie/day" />
            <div className="mt-[-80px] relative z-10">
                <ContinueWatchingRow filterType="movie" />
                {ROW_CONFIGS.movies.map(row => <MediaRow key={row.title} title={row.title} url={row.url} onSeeAll={setSeeAllConfig} />)}
            </div>
        </div>
    );
};

const TvView = () => {
    const { setSeeAllConfig } = useContext(AppContext);
    return (
        <div className="pb-24 animate-in fade-in duration-500 relative">
            <HeroBanner endpoint="/trending/tv/day" />
            <div className="mt-[-80px] relative z-10">
                <ContinueWatchingRow filterType="tv" />
                {ROW_CONFIGS.tv.map(row => <MediaRow key={row.title} title={row.title} url={row.url} onSeeAll={setSeeAllConfig} />)}
            </div>
        </div>
    );
};

const SearchView = () => {
    const { tmdbKey, dbLanguage, hideAdult, openDetails } = useContext(AppContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    
    useEffect(() => {
        if (!searchQuery.trim()) { setResults([]); return; }
        const handler = setTimeout(() => {
            fetch(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&language=${dbLanguage}&query=${encodeURIComponent(searchQuery)}&include_adult=${!hideAdult}`)
                .then(res => res.json()).then(data => setResults((data.results || []).filter(i => i.media_type !== 'person' && i.backdrop_path && (hideAdult ? !i.adult : true))));
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    return (
        <div className="pt-12 pb-24 px-4 max-w-2xl mx-auto min-h-screen animate-in fade-in">
            <div className="bg-[#2b2b2b] flex items-center px-4 py-3 rounded-md mb-6 sticky top-4 z-20 shadow-xl">
                <Search size={20} className="text-gray-400 mr-3" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-transparent text-white w-full outline-none" />
            </div>
            <div className="space-y-4">
                {results.map(item => (
                    <div key={item.id} onClick={() => openDetails(item)} className="flex items-center gap-4 cursor-pointer group hover:bg-[#1e1e1e] p-2 rounded-lg transition-colors">
                        <img src={`https://image.tmdb.org/t/p/w300${item.backdrop_path || item.poster_path}`} className="w-32 aspect-video object-cover rounded bg-neutral-800" />
                        <span className="font-bold text-sm sm:text-base flex-grow line-clamp-2">{item.title || item.name}</span>
                        <PlayCircle size={28} className="text-white group-hover:scale-110 transition-transform" />
                    </div>
                ))}
            </div>
        </div>
    );
};

const ProfileView = () => {
    return (
        <div className="pt-12 pb-24 px-4 max-w-2xl mx-auto min-h-screen text-center text-gray-500">
            <User size={48} className="mx-auto mb-4 text-gray-700"/>
            <h2>My Library & Profile View Loaded Successfully!</h2>
        </div>
    );
}

window.UIP.HomeView = HomeView;
window.UIP.MoviesView = MoviesView;
window.UIP.TvView = TvView;
window.UIP.SearchView = SearchView;
window.UIP.ProfileView = ProfileView;