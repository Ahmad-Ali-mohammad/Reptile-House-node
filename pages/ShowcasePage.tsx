
import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import ReptileCard, { CardVariant } from '../components/ReptileCard';
import FilterSidebar from '../components/FilterSidebar';
import { FilterIcon, GridIcon, ListIcon, ChevronDownIcon, SearchIcon } from '../components/icons';
import PageNotAvailable from '../components/PageNotAvailable';
import { Page } from '../App';
import { usePageContent } from '../hooks/usePageContent';
import { PageContent } from '../types';

export type Filters = {
    categories: string[];
    price: number;
    species: string[];
    status: string;
};

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating';

interface ShowcasePageProps {
    setPage: (page: Page | string) => void;
}

const showcaseFallback: PageContent = {
    id: 'fallback-showcase',
    slug: 'showcase',
    title: 'المعرض',
    excerpt: '',
    content: '',
    seoTitle: 'المعرض - بيت الزواحف',
    seoDescription: '',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
};

const ShowcasePage: React.FC<ShowcasePageProps> = ({ setPage }) => {
    const { products } = useDatabase();
    const { pageContent, loading, isActive } = usePageContent('showcase', showcaseFallback);
    const [filters, setFilters] = useState<Filters>({
        categories: [],
        price: 10000,
        species: [],
        status: 'الكل',
    });
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<CardVariant>('grid');

    const filteredReptiles = useMemo(() => {
        let result = [...products].filter(reptile => {
            if (filters.categories.length > 0 && !filters.categories.includes(reptile.category)) {
                return false;
            }
            if (reptile.price > filters.price) {
                return false;
            }
            if (filters.species.length > 0 && !filters.species.includes(reptile.species)) {
                return false;
            }
            if (filters.status !== 'الكل' && reptile.status !== filters.status) {
                return false;
            }
            return true;
        });

        // Sorting
        switch (sortBy) {
            case 'price-asc': result.sort((a, b) => a.price - b.price); break;
            case 'price-desc': result.sort((a, b) => b.price - a.price); break;
            case 'rating': result.sort((a, b) => b.rating - a.rating); break;
            default: result.sort((a, b) => b.id - a.id); break;
        }

        return result;
    }, [filters, products, sortBy]);

    const isFiltered = filters.categories.length > 0 || filters.price < 10000 || filters.species.length > 0 || filters.status !== 'الكل';
    const activeFiltersCount = (filters.categories.length > 0 ? 1 : 0) + (filters.species.length > 0 ? 1 : 0) + (filters.price < 10000 ? 1 : 0) + (filters.status !== 'الكل' ? 1 : 0);

    const clearFilters = () => setFilters({ categories: [], price: 10000, species: [], status: 'الكل' });

    // Handle body scroll lock when mobile filter is open
    useEffect(() => {
        if (isFilterOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isFilterOpen]);

    if (loading) {
        return <div className="animate-fade-in text-center py-20">جاري التحميل...</div>;
    }

    if (!isActive) {
        return <PageNotAvailable title={pageContent.title || 'صفحة المعرض غير متاحة حالياً'} />;
    }

    return (
        <div className="mx-auto max-w-[1440px] px-3 pb-24 sm:px-4 md:pb-20">
            {/* Header / Intro */}
            <div className="mb-12 flex flex-col gap-6 text-right md:mb-16 md:flex-row md:items-start md:justify-between">
                <div className="animate-slide-up">
                    <h1 className="text-4xl font-black leading-none tracking-tighter text-white sm:text-5xl md:text-8xl">
                        {pageContent.title || 'المعرض'}
                    </h1>
                    {pageContent.excerpt && (
                        <p className="text-lg md:text-xl text-gray-400 mt-6 max-w-lg font-bold leading-relaxed">{pageContent.excerpt}</p>
                    )}
                    {pageContent.content?.trim() && (
                        <div
                            className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 text-gray-300 leading-loose text-right"
                            dangerouslySetInnerHTML={{ __html: pageContent.content }}
                        />
                    )}
                </div>
                
                <div className="animate-fade-in delay-200 flex w-full flex-wrap items-center gap-3 sm:gap-4 md:w-auto md:justify-end">
                    {/* View Switcher */}
                    <div className="flex items-center gap-2 glass-light p-1.5 rounded-2xl border border-white/10 hidden sm:flex">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-amber-500 text-gray-900 shadow-xl scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            title="عرض الشبكة"
                        >
                            <GridIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-amber-500 text-gray-900 shadow-xl scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            title="عرض القائمة"
                        >
                            <ListIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                         <div className="glass-light flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-white/10 px-4 py-3.5 shadow-lg transition-all hover:border-amber-500/50 sm:min-w-[200px] sm:px-6">
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">ترتيب حسب:</span>
                            <select 
                                id="showcase-sort"
                                name="showcaseSort"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="bg-transparent border-none outline-none font-black text-sm text-white appearance-none cursor-pointer flex-1"
                            >
                                <option value="newest">الأحدث وصولاً</option>
                                <option value="price-asc">السعر (من الأقل)</option>
                                <option value="price-desc">السعر (من الأعلى)</option>
                                <option value="rating">الأعلى تقييماً</option>
                            </select>
                            <ChevronDownIcon className="w-4 h-4 text-amber-500" />
                         </div>
                    </div>

                    {/* Mobile Filter Toggle */}
                    <button 
                        onClick={() => setIsFilterOpen(true)}
                        className="lg:hidden flex items-center gap-3 bg-amber-500 text-gray-900 border border-amber-600/20 rounded-2xl py-3.5 px-8 font-black text-sm hover:bg-amber-400 transition-all shadow-xl active:scale-95 relative"
                    >
                        <FilterIcon className="w-5 h-5" />
                        <span>تصفية</span>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-gray-900">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
                {/* Desktop Filter Sidebar / Mobile Bottom Sheet */}
                <aside className={`fixed inset-0 z-[100] lg:relative lg:z-0 lg:block lg:w-80 transition-all duration-500 ${isFilterOpen ? 'visible opacity-100' : 'invisible opacity-0 lg:visible lg:opacity-100'}`}>
                    {/* Backdrop for Mobile */}
                    <div 
                        className={`absolute inset-0 bg-black/90 backdrop-blur-md lg:hidden transition-opacity duration-500 ${isFilterOpen ? 'opacity-100' : 'opacity-0'}`} 
                        onClick={() => setIsFilterOpen(false)}
                    ></div>
                    
                    {/* Filter Container (Bottom Sheet on Mobile) */}
                    <div className={`absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#0f1117] rounded-t-[3.5rem] p-8 lg:p-0 lg:relative lg:bg-transparent lg:rounded-none lg:max-h-none transform transition-all duration-500 ease-out overflow-y-auto custom-scrollbar shadow-[0_-20px_50px_rgba(0,0,0,0.5)] lg:shadow-none ${isFilterOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}`}>
                        {/* Drag Handle for Mobile */}
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="w-16 h-1.5 bg-white/10 rounded-full"></div>
                        </div>

                        <div className="lg:hidden flex justify-between items-center mb-10 border-b border-white/5 pb-8">
                            <div>
                                <h2 className="text-3xl font-black tracking-tighter text-white">خيارات التصفية</h2>
                                <p className="text-xs text-gray-500 font-bold mt-1">خصص بحثك للعثور على زاحفك المثالي</p>
                            </div>
                            <button onClick={() => setIsFilterOpen(false)} className="p-4 bg-white/5 rounded-2xl font-black text-amber-500 hover:bg-white/10 transition-all">تم</button>
                        </div>
                        
                        <FilterSidebar filters={filters} setFilters={setFilters} />
                        
                        {isFiltered && (
                             <button 
                                onClick={clearFilters}
                                className="w-full mt-10 flex items-center justify-center gap-3 text-red-400 font-black text-xs hover:text-red-300 transition-colors bg-red-500/5 py-4 rounded-2xl border border-red-500/10"
                            >
                                <TrashIcon className="w-4 h-4" />
                                <span>مسح كافة التفضيلات</span>
                            </button>
                        )}
                        
                        <div className="lg:hidden mt-8">
                             <button 
                                onClick={() => setIsFilterOpen(false)}
                                className="w-full bg-amber-500 text-gray-900 font-black py-5 rounded-2xl shadow-xl shadow-amber-500/20"
                            >
                                إظهار النتائج ({filteredReptiles.length})
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Products Main Grid */}
                <main className="flex-1 min-h-[600px]">
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-right sm:mb-10">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                <span className="text-xs font-black text-green-400 uppercase tracking-widest">
                                    تم العثور على <span className="text-white font-poppins">{filteredReptiles.length}</span> مخلوق
                                </span>
                            </div>
                        </div>
                    </div>

                    {filteredReptiles.length > 0 ? (
                        <div className={viewMode === 'grid' 
                            ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10" 
                            : "space-y-8"
                        }>
                            {filteredReptiles.map((reptile, idx) => (
                                <div key={reptile.id} className="animate-scale-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <ReptileCard reptile={reptile} index={idx} variant={viewMode} setPage={setPage} />
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-40 glass-medium border-2 border-dashed border-white/5 rounded-[4rem] h-full flex flex-col justify-center items-center space-y-8 animate-fade-in">
                            <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10 mb-4 shadow-inner">
                                <SearchIcon className="w-14 h-14 text-gray-700" />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-4xl font-black text-white tracking-tighter">لا توجد نتائج مطابقة</h2>
                                <p className="text-gray-400 max-w-sm mx-auto font-bold leading-relaxed px-6">جرب تغيير معايير البحث أو تصفير الفلاتر لاستكشاف المزيد من الزواحف المتاحة حالياً.</p>
                            </div>
                            <button 
                                onClick={clearFilters}
                                className="bg-amber-500 text-gray-900 font-black px-12 py-5 rounded-[2rem] hover:bg-amber-400 transition-all active:scale-95 shadow-2xl shadow-amber-500/20 text-lg"
                            >
                                عرض كافة الزواحف
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// Internal icons helper for Trash
const TrashIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export default ShowcasePage;
