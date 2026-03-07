
import React, { useState, useMemo, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import ReptileCard, { CardVariant } from '../components/ReptileCard';
import FilterSidebar from '../components/FilterSidebar';
import { FilterIcon, GridIcon, ListIcon, ChevronDownIcon, SearchIcon } from '../components/icons';
import PageNotAvailable from '../components/PageNotAvailable';
import { Page } from '../App';
import { usePageContent } from '../hooks/usePageContent';
import { PageContent } from '../types';
import { pickMeaningfulText } from '../utils/contentText';

export type Filters = {
    categories: string[];
    price: number;
    species: string[];
    status: string;
};

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating';

interface SuppliesPageProps {
    setPage: (page: Page | string) => void;
}

const suppliesFallback: PageContent = {
    id: 'fallback-supplies',
    slug: 'supplies',
    title: 'مستلزمات العناية والبيئة',
    excerpt: 'كل ما تحتاجه لبناء بيئة متوازنة وآمنة لزاحفك: تدفئة، إضاءة، تغذية، تنظيف، وإكسسوارات عملية مختبرة.',
    content: '<h2>المستلزمات الصحيحة تصنع فرقًا كبيرًا</h2><p>نوفر منتجات أساسية ومتقدمة تساعدك على ضبط الحرارة والرطوبة والنظافة والتغذية، بما ينعكس مباشرة على صحة الحيوان وسهولة العناية اليومية.</p>',
    seoTitle: 'مستلزمات الزواحف | Reptile House',
    seoDescription: 'تسوق مستلزمات الزواحف الموثوقة من Reptile House لتجهيز بيئة صحية ومستقرة.',
    isActive: true,
    updatedAt: new Date().toISOString().slice(0, 10),
};

const SuppliesPage: React.FC<SuppliesPageProps> = ({ setPage }) => {
    const { supplies } = useDatabase();
    const { pageContent, loading, isActive } = usePageContent('supplies', suppliesFallback);
    const [filters, setFilters] = useState<Filters>({
        categories: [],
        price: 10000,
        species: [],
        status: 'الكل',
    });
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<CardVariant>('grid');
    const safePageContent = useMemo<PageContent>(() => ({
        ...suppliesFallback,
        ...pageContent,
        title: pickMeaningfulText(pageContent.title, suppliesFallback.title),
        excerpt: pickMeaningfulText(pageContent.excerpt, suppliesFallback.excerpt || ''),
        content: pickMeaningfulText(pageContent.content, suppliesFallback.content),
        seoTitle: pickMeaningfulText(pageContent.seoTitle, suppliesFallback.seoTitle || ''),
        seoDescription: pickMeaningfulText(pageContent.seoDescription, suppliesFallback.seoDescription || ''),
    }), [pageContent]);

    const filteredSupplies = useMemo(() => {
        let result = [...supplies].filter(supply => {
            if (filters.categories.length > 0 && !filters.categories.includes(supply.category)) {
                return false;
            }
            if (supply.price > filters.price) {
                return false;
            }
            if (filters.status !== 'الكل' && supply.status !== filters.status) {
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
    }, [filters, supplies, sortBy]);

    const isFiltered = filters.categories.length > 0 || filters.price < 10000 || filters.status !== 'الكل';
    const activeFiltersCount = (filters.categories.length > 0 ? 1 : 0) + (filters.price < 10000 ? 1 : 0) + (filters.status !== 'الكل' ? 1 : 0);

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
        return <PageNotAvailable title={safePageContent.title || 'صفحة المستلزمات غير متاحة حالياً'} />;
    }

    return (
        <div className="mx-auto max-w-[1440px] px-3 pb-24 sm:px-4 md:pb-20">
            {/* Header / Intro */}
            <div className="mb-12 flex flex-col gap-6 text-right md:mb-16 md:flex-row md:items-start md:justify-between">
                <div className="animate-slide-up">
                    <h1 className="text-4xl font-black leading-none tracking-tighter text-white sm:text-5xl md:text-8xl">
                        {safePageContent.title}
                    </h1>
                    {safePageContent.excerpt && (
                        <p className="text-lg md:text-xl text-gray-400 mt-6 max-w-lg font-bold leading-relaxed">{safePageContent.excerpt}</p>
                    )}
                    {safePageContent.content?.trim() && (
                        <div
                            className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5 text-gray-300 leading-loose text-right"
                            dangerouslySetInnerHTML={{ __html: safePageContent.content }}
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

                    {/* Filter Button */}
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="group relative flex w-full items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-white shadow-lg transition-all hover:border-amber-500/50 hover:bg-amber-500/5 hover:shadow-amber-500/20 sm:w-auto sm:px-6 glass-light"
                    >
                        <FilterIcon className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold hidden sm:inline">الفلاتر</span>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-amber-500 text-gray-900 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center animate-pulse shadow-xl">{activeFiltersCount}</span>
                        )}
                    </button>

                    {/* Sort Dropdown */}
                    <div className="relative group">
                        <select 
                            id="supplies-sort"
                            name="suppliesSort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-none px-4 py-3 pr-12 text-sm font-bold text-white shadow-lg transition-all hover:border-amber-500/50 hover:bg-amber-500/5 sm:w-auto sm:px-5 glass-light"
                            style={{ backgroundImage: 'none' }}
                        >
                            <option value="newest" className="bg-gray-900 text-white">الأحدث</option>
                            <option value="price-asc" className="bg-gray-900 text-white">الأرخص أولاً</option>
                            <option value="price-desc" className="bg-gray-900 text-white">الأغلى أولاً</option>
                            <option value="rating" className="bg-gray-900 text-white">الأعلى تقييماً</option>
                        </select>
                        <ChevronDownIcon className="w-4 h-4 text-amber-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Active Filters */}
            {isFiltered && (
                <div className="mb-8 flex items-center gap-4 flex-wrap animate-fade-in">
                    <span className="text-gray-400 font-bold text-sm">الفلاتر النشطة:</span>
                    {filters.categories.map(cat => (
                        <span key={cat} className="bg-amber-500/20 text-amber-500 px-4 py-2 rounded-xl text-sm font-bold border border-amber-500/30">
                            {cat}
                        </span>
                    ))}
                    {filters.price < 10000 && (
                        <span className="bg-amber-500/20 text-amber-500 px-4 py-2 rounded-xl text-sm font-bold border border-amber-500/30">
                            أقل من {filters.price.toLocaleString('ar-SY')} ل.س
                        </span>
                    )}
                    {filters.status !== 'الكل' && (
                        <span className="bg-amber-500/20 text-amber-500 px-4 py-2 rounded-xl text-sm font-bold border border-amber-500/30">
                            {filters.status}
                        </span>
                    )}
                    <button 
                        onClick={clearFilters}
                        className="text-red-400 hover:text-red-300 font-bold text-sm underline transition-colors"
                    >
                        إزالة الكل
                    </button>
                </div>
            )}

            {/* Products Grid/List */}
            <div className="relative">
                {filteredSupplies.length > 0 ? (
                    <div className={viewMode === 'grid' 
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in" 
                        : "flex flex-col gap-6 animate-fade-in"
                    }>
                        {filteredSupplies.map((supply, idx) => (
                            <ReptileCard 
                                key={supply.id} 
                                reptile={supply} 
                                setPage={setPage}
                                variant={viewMode}
                                animationDelay={idx * 50}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 animate-fade-in">
                        <div className="text-6xl mb-6">🔍</div>
                        <h3 className="text-3xl font-black text-white mb-4">لم نعثر على نتائج</h3>
                        <p className="text-gray-400 font-bold mb-8">جرّب تغيير الفلاتر أو إزالتها</p>
                        <button 
                            onClick={clearFilters}
                            className="bg-amber-500 text-gray-900 px-8 py-4 rounded-2xl font-black hover:bg-amber-400 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                        >
                            إزالة جميع الفلاتر
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Filter Sidebar */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-[100] lg:hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-full max-w-md bg-gray-900 shadow-2xl animate-slide-in-left overflow-y-auto">
                        <FilterSidebar 
                            filters={filters} 
                            setFilters={setFilters} 
                            onClose={() => setIsFilterOpen(false)}
                            isSupplies={true}
                        />
                    </div>
                </div>
            )}

            {/* Desktop Filter Sidebar */}
            <div className={`hidden lg:block fixed left-8 top-32 bottom-32 w-80 transition-all duration-500 ${isFilterOpen ? 'translate-x-0 opacity-100' : '-translate-x-[400px] opacity-0 pointer-events-none'} z-40`}>
                <div className="h-full overflow-y-auto scrollbar-hide glass-dark border border-white/10 rounded-3xl shadow-2xl">
                    <FilterSidebar 
                        filters={filters} 
                        setFilters={setFilters} 
                        onClose={() => setIsFilterOpen(false)}
                        isSupplies={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default SuppliesPage;
