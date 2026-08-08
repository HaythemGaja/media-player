const { useState, useEffect, useContext } = React;
const { Star, PlayCircle, X, Bell, Sparkles } = window.LucideIcons;
const { AppContext } = window.UIP;

const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
);

const MediaRow = ({ title, url, items, onSeeAll }) => {
    const { tmdbKey, dbLanguage, hideAdult, openDetails } = useContext(AppContext);
    const [rowItems, setRowItems] = useState(items || []);
    const [loading, setLoading] = useState(!items);

    useEffect(() => {
        if (url && !items) {
            fetch(`https://api.themoviedb.org/3${url}${url.includes('?') ? '&' : '?'}api_key=${tmdbKey}&language=${dbLanguage}&include_adult=${!hideAdult}`)
                .then(res => res.json()).then(data => {
                    setRowItems((data.results || []).filter(i => i.poster_path && !i.known_for && (hideAdult ? !i.adult : true)));
                    setLoading(false);
                }).catch(() => setLoading(false));
        }
    }, [url, tmdbKey, dbLanguage, items, hideAdult]);

    if (!loading && rowItems.length === 0) return null;

    return (
        <div className="mb-6">
            <div className="flex justify-between items-end px-4 mb-2">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                    {title === 'Recommended for You' && <Sparkles size={16} className="text-amber-400" />}
                    {title}
                </h2>
                <span onClick={() => onSeeAll && onSeeAll({title, url: url || items})} className="text-xs text-indigo-400 font-semibold cursor-pointer hover:underline">See All</span>
            </div>
            {/* Removed snap-x for smoother free scrolling */}
            <div className="flex overflow-x-auto gap-3 px-4 pb-2 hide-scrollbar">
                {loading ? <div className="w-full flex gap-3">{[1,2,3,4,5].map(i => <div key={i} className="w-28 h-40 bg-[#1e1e1e] rounded-md flex-shrink-0 animate-pulse"></div>)}</div> : 
                    rowItems.map(item => (
                        <div key={item.id} tabIndex={0} onClick={() => openDetails(item)} onKeyDown={(e) => e.key === 'Enter' && openDetails(item)} className="w-28 flex-shrink-0 cursor-pointer transition-transform hover:scale-105 focus:scale-105 focus:ring-2 focus:ring-indigo-500 focus:z-10 outline-none relative rounded-md">
                            <img src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : item.Poster} alt={item.title || item.name} className="w-full h-40 object-cover rounded-md shadow-lg" loading="lazy" />
                            <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-md">
                                <Star size={10} className="fill-amber-400 text-amber-400" /> {item.vote_average ? item.vote_average.toFixed(1) : 'NR'}
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

const ContinueWatchingRow = ({ filterType = 'all' }) => {
    const { historyList, setHistoryList, watchedEpisodes, openDetails } = useContext(AppContext);
    if (historyList.length === 0) return null;

    const uniqueHistory = [];
    const seenIds = new Set();

    historyList.forEach(item => {
        const matchesFilter = filterType === 'all' || item.Type === filterType || (filterType === 'tv' && item.Type === 'series') || (item.source === 'iptv' && item.type === filterType);
        const uniqueKey = item.source === 'iptv' ? `iptv-${item.id}` : item.id;
        
        if (!seenIds.has(uniqueKey) && matchesFilter) { 
            seenIds.add(uniqueKey); 
            uniqueHistory.push(item); 
        } 
    });

    if (uniqueHistory.length === 0) return null;
    const headerTitle = filterType === 'live' ? 'Recent Channels' : 'Continue Watching';

    return (
        <div className="mb-6 mt-4">
            <h2 className="text-base font-bold text-white tracking-wide px-4 mb-2">{headerTitle}</h2>
            
            <div className="flex overflow-x-auto gap-3 px-4 pb-2 hide-scrollbar">
                {uniqueHistory.slice(0, 15).map(item => {
                    const watchedData = watchedEpisodes[item.id] || {};
                    let isWatched = ((item.Type === 'tv' || item.Type === 'series') && watchedData[item.season]?.includes(parseInt(item.episode)));
                    const isLive = item.source === 'iptv' && item.type === 'live';
                    const progressPercent = item.progress || 10;

                    return (
                    <div key={item.historyId} onClick={() => openDetails(item)} className={`flex-shrink-0 cursor-pointer relative group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10 rounded-md ${isLive ? 'w-32' : 'w-40'}`}>
                        <div className={`relative w-full ${isLive ? 'aspect-[4/3] bg-neutral-900 p-2' : 'aspect-video bg-neutral-800'} rounded-md overflow-hidden border border-neutral-700 flex flex-col items-center justify-center`}>
                            <img src={item.backdrop || item.Poster || item.icon} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity z-0" onError={(e) => e.target.style.display='none'} />
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/0 group-hover:bg-black/40 transition-colors">
                                <PlayCircle size={36} className="text-white shadow-xl opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all" />
                            </div>
                            {!isLive && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700 z-10">
                                    <div className="h-full bg-green-500 shadow-[0_-1px_6px_rgba(34,197,94,0.6)]" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); setHistoryList(prev => prev.filter(h => h.historyId !== item.historyId)); }} className="absolute top-2 right-2 bg-black/80 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20 shadow-lg"><X size={14} /></button>
                        </div>
                        
                        <div className="mt-1 flex justify-between items-start px-1">
                            <div className={`flex flex-col w-full ${isLive ? 'text-center' : 'text-left'}`}>
                                <span className="text-xs font-semibold text-gray-200 line-clamp-1">{item.Title}</span>
                                {!isLive && <span className="text-[10px] text-gray-400">{item.source === 'iptv' ? (item.epTitle || 'VOD') : ((item.Type === 'tv' || item.Type === 'series') ? `S${item.season}:E${item.episode}` : 'Movie')}{isWatched && ' ✓'}</span>}
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
};

const NewEpisodesRow = () => {
    const { notifications, loadingNotifications, openDetails } = useContext(AppContext);
    if (!loadingNotifications && notifications.length === 0) return null;

    return (
        <div className="mb-6 mt-4">
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2 px-4 mb-2"><Bell size={16} className="text-red-500" /> New Episodes for You</h2>
            <div className="flex overflow-x-auto gap-3 px-4 pb-2 hide-scrollbar">
                {loadingNotifications ? <div className="w-full flex gap-3">{[1,2,3].map(i => <div key={i} className="w-40 aspect-video bg-[#1e1e1e] rounded-md animate-pulse"></div>)}</div> : (
                    notifications.map(item => (
                        <div key={item.id} onClick={() => openDetails(item)} className="w-40 flex-shrink-0 cursor-pointer relative group rounded-md">
                            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-neutral-800 border border-red-500/40">
                                <img src={item.newEpInfo.still_path ? `https://image.tmdb.org/t/p/w300${item.newEpInfo.still_path}` : item.backdrop || item.Poster} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center"><PlayCircle size={36} className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" /></div>
                                <div className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1"><Sparkles size={8}/> NEW</div>
                            </div>
                            <div className="mt-1 flex flex-col">
                                <span className="text-xs font-semibold text-gray-200 line-clamp-1">{item.Title}</span>
                                <span className="text-[10px] text-red-400 font-medium">S{item.newEpInfo.season_number} E{item.newEpInfo.episode_number} &bull; {new Date(item.newEpInfo.air_date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

window.UIP.LoadingSpinner = LoadingSpinner;
window.UIP.MediaRow = MediaRow;
window.UIP.ContinueWatchingRow = ContinueWatchingRow;
window.UIP.NewEpisodesRow = NewEpisodesRow;
