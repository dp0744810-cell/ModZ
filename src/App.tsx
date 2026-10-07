import React, { useState, useEffect } from 'react';
import { 
  getStoredItems, 
  saveStoredItems, 
  resetCatalogToDefaults, 
  getStoredRequests, 
  saveStoredRequests,
  getInitialTheme,
  saveTheme
} from './utils/storage';
import { CatalogItem, ModRequest } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { GameCard } from './components/GameCard';
import { CategorySection } from './components/CategorySection';
import { AppsSection } from './components/AppsSection';
import { NewsSection } from './components/NewsSection';
import { DetailView } from './components/DetailView';
import { AdminModal } from './components/AdminModal';
import { RequestModModal } from './components/RequestModModal';
import { SearchModal } from './components/SearchModal';
import { Footer } from './components/Footer';
import { 
  Sparkles, 
  Zap, 
  Gamepad2, 
  Smartphone, 
  Bookmark, 
  X, 
  ArrowRight,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const [items, setItems] = useState<CatalogItem[]>(getStoredItems);
  const [requests, setRequests] = useState<ModRequest[]>(getStoredRequests);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  
  // Navigation & filtering state
  const [currentTab, setCurrentTab] = useState<'home' | 'games' | 'apps' | 'news' | 'categories'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeAppCategory, setActiveAppCategory] = useState<string>('All');
  const [gameFilterType, setGameFilterType] = useState<'all' | 'mod-only' | 'offline-only'>('all');

  // Modals
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [requestModOpen, setRequestModOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarksDrawerOpen, setBookmarksDrawerOpen] = useState(false);

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('mrdharvex_bookmarks');
      return stored ? JSON.parse(stored) : ['into-the-dead', 'traffic-rider'];
    } catch {
      return ['into-the-dead'];
    }
  });

  // Keep HTML root class in sync with dark mode
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  // Persist items & requests
  const handleAddItem = (newItem: CatalogItem) => {
    const updated = [newItem, ...items];
    setItems(updated);
    saveStoredItems(updated);
  };

  const handleUpdateItem = (updatedItem: CatalogItem) => {
    const updated = items.map(it => it.id === updatedItem.id ? updatedItem : it);
    setItems(updated);
    saveStoredItems(updated);
    if (selectedItem && selectedItem.id === updatedItem.id) {
      setSelectedItem(updatedItem);
    }
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter(it => it.id !== id);
    setItems(updated);
    saveStoredItems(updated);
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(null);
    }
  };

  const handleResetDefaults = () => {
    const reset = resetCatalogToDefaults();
    setItems(reset);
  };

  const handleSubmitRequest = (newRequest: ModRequest) => {
    const updated = [newRequest, ...requests];
    setRequests(updated);
    saveStoredRequests(updated);
  };

  const handleUpdateRequestStatus = (id: string, status: 'pending' | 'in-progress' | 'completed') => {
    const updated = requests.map(r => r.id === id ? { ...r, status } : r);
    setRequests(updated);
    saveStoredRequests(updated);
  };

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('mrdharvex_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  // Filtered games
  const allGames = items.filter(i => i.type === 'game');
  const allApps = items.filter(i => i.type === 'app');

  const filteredGames = allGames.filter(game => {
    const matchesCategory = selectedCategory === 'All' || game.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesFilter = 
      gameFilterType === 'all' ||
      (gameFilterType === 'mod-only' && game.modInfo) ||
      (gameFilterType === 'offline-only' && game.isOffline);
    return matchesCategory && matchesFilter;
  });

  const bookmarkedItems = items.filter(it => bookmarkedIds.includes(it.id));

  // Switch tab & reset item detail if navigating
  const handleSelectTab = (tab: 'home' | 'games' | 'apps' | 'news' | 'categories') => {
    setCurrentTab(tab);
    setSelectedItem(null);
    if (tab === 'games') setSelectedCategory('All');
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setCurrentTab('games');
    setSelectedItem(null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0f172a] text-gray-100' : 'bg-[#f4f6f8] text-gray-900'
    }`}>
      
      {/* 1. Sticky Navigation Header */}
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAdmin={() => setAdminModalOpen(true)}
        onOpenRequestMod={() => setRequestModOpen(true)}
        onSelectTab={handleSelectTab}
        currentTab={currentTab}
        bookmarkCount={bookmarkedIds.length}
        onOpenBookmarks={() => setBookmarksDrawerOpen(true)}
      />

      {/* 2. Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6">
        
        {/* VIEW A: SINGLE GAME / APP DETAIL VIEW */}
        {selectedItem ? (
          <DetailView
            item={selectedItem}
            onBack={() => {
              setSelectedItem(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectRelated={(related) => {
              setSelectedItem(related);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            relatedItems={items.filter(i => i.category === selectedItem.category && i.id !== selectedItem.id)}
            isBookmarked={bookmarkedIds.includes(selectedItem.id)}
            onToggleBookmark={() => toggleBookmark(selectedItem.id)}
          />
        ) : (
          /* VIEW B: HOME & CATALOG VIEWS */
          <div>
            
            {/* HERO BANNER (Visible on Home tab) */}
            {currentTab === 'home' && (
              <HeroBanner
                onAllGamesClick={() => {
                  setCurrentTab('games');
                  setSelectedCategory('All');
                  setGameFilterType('all');
                }}
                onModGamesClick={() => {
                  setCurrentTab('games');
                  setSelectedCategory('All');
                  setGameFilterType('mod-only');
                }}
                onRequestModClick={() => setRequestModOpen(true)}
              />
            )}

            {/* SECTION 1: LATEST GAMES */}
            {(currentTab === 'home' || currentTab === 'games') && (
              <section className="my-6 sm:my-8">
                
                {/* Section Header & Subtitle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-6 rounded-full bg-[#38b000]" />
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      {currentTab === 'games' ? 'ALL ANDROID GAMES' : 'LATEST GAMES'}
                    </h2>
                    {selectedCategory !== 'All' && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        {selectedCategory}
                      </span>
                    )}
                  </div>

                  {/* Filter tabs: All, Action, Race, Simulations, Sport, Casual, Strategy */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {['All', 'Action', 'Race', 'Simulations', 'Sport', 'Casual', 'Strategy'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-[#38b000] text-white shadow-xs'
                            : 'bg-white dark:bg-[#1f2937] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-filter chips (MOD Only, Offline Only) */}
                <div className="flex items-center gap-2 mb-4 text-xs">
                  <span className="text-gray-400 font-semibold flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Filter by:
                  </span>
                  <button
                    onClick={() => setGameFilterType('all')}
                    className={`px-2.5 py-0.5 rounded-md font-semibold cursor-pointer ${
                      gameFilterType === 'all'
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    All ({allGames.length})
                  </button>
                  <button
                    onClick={() => setGameFilterType('mod-only')}
                    className={`px-2.5 py-0.5 rounded-md font-semibold cursor-pointer ${
                      gameFilterType === 'mod-only'
                        ? 'bg-[#ff6b35] text-white'
                        : 'text-gray-500 hover:text-[#ff6b35]'
                    }`}
                  >
                    ⚡ Unlimited MODs
                  </button>
                  <button
                    onClick={() => setGameFilterType('offline-only')}
                    className={`px-2.5 py-0.5 rounded-md font-semibold cursor-pointer ${
                      gameFilterType === 'offline-only'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-500 hover:text-emerald-500'
                    }`}
                  >
                    📶 Offline Games
                  </button>
                </div>

                {/* Game Cards Grid */}
                {filteredGames.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-[#1f2937] rounded-3xl border border-gray-200 dark:border-gray-800">
                    <p className="text-base font-bold text-gray-500">No games found in category "{selectedCategory}"</p>
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setGameFilterType('all');
                      }}
                      className="mt-3 px-4 py-2 rounded-xl bg-[#38b000] text-white text-xs font-bold cursor-pointer"
                    >
                      Show All Games
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {filteredGames.map((game) => (
                      <GameCard
                        key={game.id}
                        item={game}
                        onClick={() => {
                          setSelectedItem(game);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        isBookmarked={bookmarkedIds.includes(game.id)}
                        onToggleBookmark={(e) => toggleBookmark(game.id, e)}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* SECTION 2: CATEGORIES SECTION (Grid layout with 3 icons preview) */}
            {(currentTab === 'home' || currentTab === 'categories') && (
              <CategorySection
                onSelectCategory={handleCategorySelect}
                onAllGamesClick={() => {
                  setCurrentTab('games');
                  setSelectedCategory('All');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                activeCategory={selectedCategory}
              />
            )}

            {/* SECTION 3: LATEST PROGRAMS / APPS SECTION */}
            {(currentTab === 'home' || currentTab === 'apps') && (
              <AppsSection
                apps={allApps}
                onSelectApp={(app) => {
                  setSelectedItem(app);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onAllProgramsClick={() => {
                  setCurrentTab('apps');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                activeAppCategory={activeAppCategory}
                onSelectAppCategory={setActiveAppCategory}
              />
            )}

            {/* SECTION 4: LATEST NEWS / ARTICLES */}
            {(currentTab === 'home' || currentTab === 'news') && (
              <NewsSection />
            )}

          </div>
        )}

      </main>

      {/* 3. Footer Section */}
      <Footer
        onOpenAdmin={() => setAdminModalOpen(true)}
        onOpenRequestMod={() => setRequestModOpen(true)}
        onSelectTab={handleSelectTab}
      />

      {/* 4. MODALS & DRAWERS */}
      
      {/* A. ADMIN PANEL (Protected with PIN: 564789, has APK Download url option) */}
      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        items={items}
        onAddItem={handleAddItem}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onResetDefaults={handleResetDefaults}
        requests={requests}
        onUpdateRequestStatus={handleUpdateRequestStatus}
      />

      {/* B. REQUEST A GAME / MOD MODAL (Dispatches to mrtommy21456@gmail.com) */}
      <RequestModModal
        isOpen={requestModOpen}
        onClose={() => setRequestModOpen(false)}
        onSubmitRequest={handleSubmitRequest}
      />

      {/* C. SEARCH MODAL */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={items}
        onSelectItem={(item) => {
          setSelectedItem(item);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* D. BOOKMARKS / FAVORITES DRAWER */}
      {bookmarksDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            onClick={() => setBookmarksDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-md h-full bg-white dark:bg-[#111827] text-gray-900 dark:text-white shadow-2xl p-6 flex flex-col z-10 border-l border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#ff6b35]" />
                <h3 className="font-extrabold text-lg">Saved Games &amp; Apps</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#ff6b35] text-white font-bold">
                  {bookmarkedItems.length}
                </span>
              </div>
              <button 
                onClick={() => setBookmarksDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {bookmarkedItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-sm font-semibold">No saved items yet.</p>
                  <p className="text-xs mt-1">Tap the bookmark icon on any game card to save it here for fast access.</p>
                </div>
              ) : (
                bookmarkedItems.map((it) => (
                  <div
                    key={it.id}
                    onClick={() => {
                      setSelectedItem(it);
                      setBookmarksDrawerOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700/60 flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={it.iconUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate group-hover:text-[#38b000]">
                          {it.title}
                        </h4>
                        <span className="text-xs text-orange-500 font-medium truncate block">
                          {it.modInfo}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {it.size} • {it.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => toggleBookmark(it.id, e)}
                      className="p-2 text-red-500 hover:text-red-700 cursor-pointer"
                      title="Remove bookmark"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setBookmarksDrawerOpen(false)}
                className="w-full py-3 rounded-xl bg-gray-900 dark:bg-gray-800 text-white font-bold text-sm cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
