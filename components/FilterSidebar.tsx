import React, { useState, useEffect } from 'react';
import { Filters } from '../pages/ShowcasePage';
import { hierarchicalSpecies } from '../constants';
import { api } from '../services/api';

interface FilterSidebarProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, setFilters }) => {
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['snake', 'lizard']);
    const [customSpecies, setCustomSpecies] = useState<string[]>([]);
    const [dynamicFilterGroups, setDynamicFilterGroups] = useState<any[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    useEffect(() => {
        Promise.all([api.getCustomSpecies(), api.getFilterGroups()])
            .then(([species, groups]) => {
                const activeGroups = groups.filter(g => g.isActive);
                setCustomSpecies(species);
                setDynamicFilterGroups(activeGroups);
                setExpandedGroups(activeGroups.map(g => g.id));
            })
            .catch(() => {
                setCustomSpecies([]);
                setDynamicFilterGroups([]);
                setExpandedGroups([]);
            });
    }, []);

    const toggleCategoryExpansion = (cat: string) => {
        setExpandedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const isAllSubspeciesSelected = (subspecies: string[]) => {
        return subspecies.every(sp => filters.species.includes(sp));
    };

    const toggleMainCategory = (categoryValue: string, subspecies: string[]) => {
        const allSelected = isAllSubspeciesSelected(subspecies);

        setFilters(prev => {
            let newSpecies: string[];
            let newCategories: string[];

            if (allSelected) {
                // Deselect all subspecies
                newSpecies = prev.species.filter(s => !subspecies.includes(s));
                newCategories = prev.categories.filter(c => c !== categoryValue);
            } else {
                // Select all subspecies
                newSpecies = [...new Set([...prev.species, ...subspecies])];
                newCategories = [...new Set([...prev.categories, categoryValue])];
            }

            return {
                ...prev,
                species: newSpecies,
                categories: newCategories
            };
        });
    };

    const toggleSpecies = (sp: string) => {
        setFilters(prev => ({
            ...prev,
            species: prev.species.includes(sp)
                ? prev.species.filter(s => s !== sp)
                : [...prev.species, sp]
        }));
    };

    const getCheckboxClasses = (allSelected: boolean, someSelected: boolean): string => {
        if (allSelected) return 'bg-amber-500 border-amber-500';
        if (someSelected) return 'bg-amber-500/50 border-amber-500';
        return 'border-white/20';
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, price: Number(e.target.value) }));
    };

    const handleStatusChange = (status: string) => {
        setFilters(prev => ({ ...prev, status }));
    };

    const toggleGroupExpansion = (groupId: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
        );
    };

    const statuses = ['الكل', 'متوفر', 'قيد الحجز', 'غير متوفر'];

    return (
        <div className="glass-medium rounded-[2rem] p-8 space-y-10 sticky top-28 shadow-2xl border border-white/10">
            {/* Hierarchical Category/Species Section */}
            <div>
                <h4 className="font-black text-amber-400 mb-6 text-lg">الفئة والفصيلة</h4>
                <div className="space-y-4">
                    {hierarchicalSpecies.map(hierarchy => {
                        const allSelected = isAllSubspeciesSelected(hierarchy.subspecies);
                        const someSelected = hierarchy.subspecies.some(sp => filters.species.includes(sp));
                        const isExpanded = expandedCategories.includes(hierarchy.categoryValue);

                        return (
                            <div key={hierarchy.categoryValue} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                                {/* Main Category Header */}
                                <div className="flex items-center justify-between p-4">
                                    <div
                                        className="flex items-center gap-3 cursor-pointer flex-1"
                                        onClick={() => toggleMainCategory(hierarchy.categoryValue, hierarchy.subspecies)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMainCategory(hierarchy.categoryValue, hierarchy.subspecies); }}}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`تحديد جميع ${hierarchy.mainCategoryArabic}`}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${getCheckboxClasses(allSelected, someSelected)}`}
                                        >
                                            {allSelected && (
                                                <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {someSelected && !allSelected && (
                                                <div className="w-3 h-0.5 bg-gray-900"></div>
                                            )}
                                        </div>
                                        <span className="font-bold text-white text-lg">{hierarchy.mainCategoryArabic}</span>
                                    </div>

                                    {/* Expand/Collapse Button */}
                                    <button
                                        onClick={() => toggleCategoryExpansion(hierarchy.categoryValue)}
                                        aria-label={`${isExpanded ? 'طي' : 'توسيع'} ${hierarchy.mainCategoryArabic}`}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                                    >
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Subspecies List */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 bg-black/20 border-t border-white/10 pt-3">
                                        {hierarchy.subspecies.map(subspecies => (
                                            <label key={subspecies} className="flex items-center gap-3 cursor-pointer group pr-6">
                                                <input
                                                    id={`species-${subspecies.replace(/\s+/g, '-').toLowerCase()}`}
                                                    name={`species-${subspecies.replace(/\s+/g, '-').toLowerCase()}`}
                                                    type="checkbox"
                                                    checked={filters.species.includes(subspecies)}
                                                    onChange={() => toggleSpecies(subspecies)}
                                                    className="w-4 h-4 rounded border-white/20 bg-transparent text-amber-500 focus:ring-amber-500"
                                                />
                                                <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                                                    {subspecies}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Custom Species Section */}
                    {customSpecies.length > 0 && (
                        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                            <div className="p-4 bg-purple-500/10">
                                <span className="font-bold text-purple-400 text-lg">⭐ أنواع مخصصة</span>
                            </div>
                            <div className="px-4 pb-4 pt-3 space-y-3 bg-black/20">
                                {customSpecies.map(subspecies => (
                                    <label key={subspecies} className="flex items-center gap-3 cursor-pointer group pr-6">
                                        <input
                                            id={`custom-species-${subspecies.replace(/\s+/g, '-').toLowerCase()}`}
                                            name={`customSpecies-${subspecies.replace(/\s+/g, '-').toLowerCase()}`}
                                            type="checkbox"
                                            checked={filters.species.includes(subspecies)}
                                            onChange={() => toggleSpecies(subspecies)}
                                            className="w-4 h-4 rounded border-white/20 bg-transparent text-purple-500 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                                            {subspecies}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dynamic Filter Groups */}
            {dynamicFilterGroups.length > 0 && (
                <>
                    <div className="border-t border-white/10"></div>
                    <div>
                        <h4 className="font-black text-amber-400 mb-6 text-lg">فلاتر إضافية</h4>
                        <div className="space-y-4">
                            {dynamicFilterGroups.map(group => {
                                const isExpanded = expandedGroups.includes(group.id);
                                const activeOptions = group.options.filter((opt: any) => opt.isActive);

                                return (
                                    <div key={group.id} className="border border-cyan-500/20 rounded-xl overflow-hidden bg-cyan-500/5">
                                        <div className="flex items-center justify-between p-4">
                                            <span className="font-bold text-cyan-400 text-base">{group.name}</span>
                                            <button
                                                onClick={() => toggleGroupExpansion(group.id)}
                                                aria-label={`${isExpanded ? 'طي' : 'توسيع'} ${group.name}`}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-all"
                                            >
                                                <svg
                                                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 space-y-2 bg-black/20 border-t border-cyan-500/20 pt-3">
                                                {activeOptions.map((option: any) => (
                                                    <label key={option.id} className="flex items-center gap-3 cursor-pointer group pr-2">
                                                        <input
                                                            id={`dynamic-filter-${group.id}-${option.id}`}
                                                            name={`dynamicFilter-${group.id}-${option.id}`}
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-cyan-500"
                                                        />
                                                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                                                            {option.name}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            <div className="border-t border-white/10"></div>

            {/* Price Range Slider */}
            <div>
                <label htmlFor="price-range-slider" className="font-black text-amber-400 mb-6 text-lg block">السعر الأقصى</label>
                <div className="space-y-5">
                    <input
                        id="price-range-slider"
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={filters.price}
                        onChange={handlePriceChange}
                        aria-label="تحديد السعر الأقصى"
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between items-center bg-black/30 p-4 rounded-2xl border border-white/10">
                        <span className="text-gray-400 text-sm font-bold">الميزانية:</span>
                        <span className="font-black font-poppins text-xl text-amber-300">
                            ${filters.price.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>


            <div className="border-t border-white/10"></div>

            {/* Availability Radio Group */}
            <div>
                <h4 className="font-black text-amber-400 mb-6 text-lg">حالة التوفر</h4>
                <div className="grid grid-cols-2 gap-3">
                    {statuses.map(status => (
                        <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${filters.status === status ? 'bg-amber-500 border-amber-500 text-gray-900 shadow-lg' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>
            
            <button 
                onClick={() => setFilters({ categories: [], price: 10000, species: [], status: 'الكل' })}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3 rounded-2xl transition-all border border-white/10"
            >
                تصفير الفلاتر
            </button>
        </div>
    );
};

export default FilterSidebar;
