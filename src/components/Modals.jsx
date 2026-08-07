const { useState, useEffect, useContext, useRef, useMemo } = React;
const { X, ArrowLeft, ExternalLink, Play, Film, Clock, User, Plus, Check, ListPlus, CheckCircle2, Circle, PlayCircle, ChevronDown, Settings, Cast, Globe, CheckCheck, Copy, Star } = window.LucideIcons;
const { AppContext, LoadingSpinner } = window.UIP;

const DetailsModal = ({ media, onClose }) => {
    const { tmdbKey, dbLanguage, watchedEpisodes, markEpisodeWatched, favorites, toggleFavorite, customLists, toggleItemInList, launchPlayer, isRTL } = useContext(AppContext);
    const [details, setDetails] = useState(null);
    const [episodes, setEpisodes] = useState([]);
    const [season, setSeason] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showTrailer, setShowTrailer] = useState(false); 

    const type = media.media_type || media.Type || (media.name ? 'tv' : 'movie');

    useEffect(() => {
        setLoading(true);
        fetch(`https://api.themoviedb.org/3/${type}/${media.id}?api_key=${tmdbKey}&language=${dbLanguage}&append_to_response=external_ids,credits,videos`)
            .then(res => res.json()).then(data => {
                setDetails(data);
                if (type === 'tv' && data.seasons?.length > 0) {
                    setSeason(media.season ? parseInt(media.season) : (data.seasons.find(s => s.season_number > 0)?.season_number || 1));
                } else setLoading(false);
            });
    }, [media.id, type]);

    useEffect(() => {
        if (type === 'tv' && details) {
            setLoading(true);
            fetch(`https://api.themoviedb.org/3/tv/${media.id}/season/${season}?api_key=${tmdbKey}&language=${dbLanguage}`).then(res => res.json()).then(data => { setEpisodes(data.episodes || []); setLoading(false); });
        }
    }, [season, details]);

    if (!details) return <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"><LoadingSpinner/></div>;
    const isFav = favorites.some(f => f.id === details.id);

    return (
        <div className="fixed inset-0 z-[60] bg-[#0f0f0f] overflow-y-auto hide-scrollbar animate-in slide-in-from-bottom-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <button onClick={onClose} className={`fixed top-4 ${isRTL ? 'left-4' : 'right-4'} z-[70] bg-black/60 p-3 rounded-full text-white hover:bg-black/80 backdrop-blur-md transition-all shadow-xl`}><X size={24} /></button>
            <div className="w-full max-w-6xl mx-auto bg-[#131313] min-h-screen shadow-2xl relative pb-20 border-x border-neutral-900">
                <div className="relative w-full aspect-video md:h-[500px] bg-black overflow-hidden">
                    <img src={`https://image.tmdb.org/t/p/w1280${details.backdrop_path || details.poster_path}`} className="w-full h-full object-cover object-center" />
                    <div className="absolute inset-0 modal-gradient flex items-end p-6 md:p-10 pointer-events-none"><h2 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-xl">{details.title || details.name}</h2></div>
                </div>

                <div className="p-4 sm:p-8 md:p-10 space-y-6">
                    <div className="flex gap-3 md:gap-4 max-w-xl">
                        <button onClick={() => launchPlayer(details, type === 'tv' ? season : null, type === 'tv' ? (episodes[0]?.episode_number || 1) : null, null, details)} className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 md:py-4 rounded-xl font-bold md:text-lg hover:bg-gray-200 transition-colors shadow-lg"><Play size={22} className="fill-black" /> {type === 'movie' ? 'Play Movie' : 'Start Watching'}</button>
                    </div>
                    <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-4xl">{details.overview || 'No overview available.'}</p>

                    {type === 'tv' && (
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-xl text-white">Episodes</h3>
                                <select value={season} onChange={(e) => setSeason(e.target.value)} className="bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none">
                                    {(details.seasons || []).filter(s => s.season_number > 0).map(s => <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>)}
                                </select>
                            </div>
                            {loading ? <LoadingSpinner/> : (
                                <div className="space-y-4">
                                    {episodes.map(ep => (
                                        <div key={ep.id} onClick={() => launchPlayer(details, season, ep.episode_number, ep.name, details)} className="flex gap-4 p-3 rounded-xl group hover:bg-neutral-800/80 cursor-pointer transition-colors relative">
                                            <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-neutral-900 shadow-md">
                                                {ep.still_path && <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />}
                                                <div className="absolute inset-0 flex items-center justify-center"><PlayCircle size={32} className="text-white opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100" /></div>
                                            </div>
                                            <div className="flex flex-col justify-center flex-grow min-w-0">
                                                <span className="text-sm md:text-base font-bold line-clamp-1 text-white">{ep.episode_number}. {ep.name}</span>
                                                <p className="text-xs md:text-sm line-clamp-2 text-gray-400 mt-1">{ep.overview}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PlayerOverlay = () => {
    const { selectedServerId, servers, activePlayerMedia, setActivePlayerMedia } = useContext(AppContext);
    
    if (!activePlayerMedia) return null;
    const activeUrl = useMemo(() => {
        const server = servers.find(s => s.id === selectedServerId) || servers[0];
        let formatted = server.urlTemplate.replace(/\{type\}/g, activePlayerMedia.type).replace(/\{tmdb\}/g, activePlayerMedia.tmdbId).replace(/\{imdb\}/g, activePlayerMedia.imdbId || activePlayerMedia.tmdbId);
        if (activePlayerMedia.type === 'tv' || activePlayerMedia.type === 'series') return formatted.replace(/\{s\}/g, activePlayerMedia.season || '').replace(/\{e\}/g, activePlayerMedia.episode || '');
        return formatted.replace(/\/\{s\}\/\{e\}/g, '').replace(/[?&](s|season)=\{s\}&(e|episode)=\{e\}/g, '').replace(/-\{s\}-\{e\}/g, '').replace(/\{s\}/g, '').replace(/\{e\}/g, '').replace(/[?&]$/, '');
    }, [activePlayerMedia, selectedServerId, servers]);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in">
            <div className="flex items-center p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-30">
                <button onClick={() => setActivePlayerMedia(null)} className="text-white hover:text-gray-300 p-1 mr-4"><ChevronDown size={28} className="rotate-90"/></button>
                <span className="font-bold text-white text-sm sm:text-base line-clamp-1">{activePlayerMedia.title}</span>
            </div>
            <div className="flex-grow flex flex-col items-center justify-center bg-black pt-14 pb-4 px-0 sm:px-4">
                <div className="w-full aspect-video max-h-[75vh] max-w-6xl mx-auto rounded-lg overflow-hidden shadow-2xl relative bg-neutral-950">
                    <iframe src={activeUrl} className="absolute inset-0 w-full h-full border-0" allowFullScreen></iframe>
                </div>
            </div>
        </div>
    );
};

window.UIP.DetailsModal = DetailsModal;
window.UIP.PlayerOverlay = PlayerOverlay;