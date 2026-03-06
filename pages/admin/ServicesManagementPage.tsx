import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../../services/api';
import { ServiceItem } from '../../types';
import { EditIcon, TrashIcon, PlusIcon, SearchIcon, ChevronUpIcon, ChevronDownIcon } from '../../components/icons';
import TabsSystem, { TabItem } from '../../components/TabSystem';
import ConfirmationModal from '../../components/ConfirmationModal';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';
import { IMAGE_FILE_ACCEPT, mediaService } from '../../services/media';

const ICON_OPTIONS = [
  { emoji: 'ðŸ ', label: 'Ø§Ù„Ø³ÙƒÙ†' },
  { emoji: 'ðŸ”¥', label: 'Ø§Ù„ØªØ¯ÙØ¦Ø©' },
  { emoji: 'ðŸŒ¡ï¸', label: 'Ø§Ù„ØªØ­ÙƒÙ… Ø¨Ø§Ù„Ø­Ø±Ø§Ø±Ø©' },
  { emoji: 'ðŸ’¡', label: 'Ø§Ù„Ø¥Ø¶Ø§Ø¡Ø©' },
  { emoji: 'ðŸ–', label: 'Ø§Ù„Ø·Ø¹Ø§Ù…' },
  { emoji: 'ðŸ¦Ž', label: 'Ø§Ù„Ø²ÙˆØ§Ø­Ù' },
  { emoji: 'âš•ï¸', label: 'Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„ØµØ­ÙŠØ©' },
  { emoji: 'ðŸ“¦', label: 'Ø§Ù„ØªÙˆØµÙŠÙ„' },
  { emoji: 'ðŸŽ“', label: 'Ø§Ù„ØªØ¯Ø±ÙŠØ¨' },
  { emoji: 'ðŸ“ž', label: 'Ø§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø§Øª' },
  { emoji: 'ðŸ› ï¸', label: 'Ø§Ù„ØµÙŠØ§Ù†Ø©' },
  { emoji: 'ðŸ“Š', label: 'Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±' }
];

export default function ServicesManagementPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
      setServices([]);
    }
  };

  // Statistics
  const stats = useMemo(() => ({
    total: services.length,
    published: services.filter(s => s.isPublished).length,
    draft: services.filter(s => !s.isPublished).length,
    paid: services.filter(s => s.price && s.price > 0).length
  }), [services]);

  // Tabs
  const tabs: TabItem[] = [
    { id: 'all', label: 'Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø®Ø¯Ù…Ø§Øª', icon: 'ðŸ“‹', badge: stats.total },
    { id: 'published', label: 'Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø©', icon: 'âœ…', badge: stats.published },
    { id: 'draft', label: 'Ø§Ù„Ù…Ø³ÙˆØ¯Ø§Øª', icon: 'ðŸ“', badge: stats.draft }
  ];

  // Filtered services
  const filteredServices = useMemo(() => {
    let list = services;

    if (activeTab === 'published') list = list.filter(s => s.isPublished);
    if (activeTab === 'draft') list = list.filter(s => !s.isPublished);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [services, activeTab, searchQuery]);

  // Modal handlers
  const handleOpenModal = (service?: ServiceItem) => {
    if (service) {
      setEditingService(service);
    } else {
      setEditingService({
        id: '',
        title: '',
        description: '',
        imageUrl: '',
        icon: 'ðŸ¦Ž',
        price: undefined,
        sortOrder: services.length + 1,
        isPublished: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    if (isImageUploading) {
      alert('انتظر حتى يكتمل رفع الصورة أولاً');
      return;
    }

    if (!editingService.title.trim() || !editingService.imageUrl) {
      alert('ÙŠØ±Ø¬Ù‰ Ù…Ù„Ø¡ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© (Ø§Ù„Ø¹Ù†ÙˆØ§Ù† ÙˆØ§Ù„ØµÙˆØ±Ø©)');
      return;
    }

    try {
      if (editingService.id && services.find(s => s.id === editingService.id)) {
        await api.updateService(editingService.id, editingService);
      } else {
        await api.createService(editingService);
      }
      await loadServices();
      setIsModalOpen(false);
      setEditingService(null);
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­ÙØ¸ Ø§Ù„Ø®Ø¯Ù…Ø©');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id) return;

    try {
      await api.deleteService(confirmDelete.id);
      await loadServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
      alert('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­Ø°Ù Ø§Ù„Ø®Ø¯Ù…Ø©');
    }

    setConfirmDelete({ isOpen: false, id: null });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      mediaService.validateImageFile(file);
      setIsImageUploading(true);
      const imageUrl = await mediaService.uploadProjectImage(file, 'services');
      setEditingService(prev => prev ? { ...prev, imageUrl } : null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'تعذر رفع صورة الخدمة');
    } finally {
      setIsImageUploading(false);
      e.target.value = '';
    }
  };

  const handleTogglePublish = async (service: ServiceItem) => {
    try {
      await api.updateService(service.id, { isPublished: !service.isPublished });
      await loadServices();
    } catch (error) {
      console.error('Failed to toggle publish:', error);
    }
  };

  const handleMoveUp = async (service: ServiceItem, index: number) => {
    if (index === 0) return;
    const items = [...filteredServices];
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    items.forEach((item, idx) => item.sortOrder = idx + 1);
    try {
      await api.reorderServices(items.map(item => ({ id: item.id, sortOrder: item.sortOrder })));
      await loadServices();
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  const handleMoveDown = async (service: ServiceItem, index: number) => {
    if (index === filteredServices.length - 1) return;
    const items = [...filteredServices];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    items.forEach((item, idx) => item.sortOrder = idx + 1);
    try {
      await api.reorderServices(items.map(item => ({ id: item.id, sortOrder: item.sortOrder })));
      await loadServices();
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  return (
    <div className="min-h-screen pb-32 px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-5xl font-black">Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø®Ø¯Ù…Ø§Øª</h1>
          <p className="text-gray-400 mt-3 text-lg">Ø¥Ø¯Ø§Ø±Ø© ÙˆØªÙ†Ø¸ÙŠÙ… Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ù‚Ø¯Ù…Ø© Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡</p>
        </div>
        <HelpButton onClick={() => setIsHelpOpen(true)} />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
          <p className="text-gray-400 text-sm font-bold mb-1">Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø®Ø¯Ù…Ø§Øª</p>
          <p className="text-3xl font-black text-amber-400">{stats.total}</p>
        </div>
        <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
          <p className="text-gray-400 text-sm font-bold mb-1">Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø©</p>
          <p className="text-3xl font-black text-green-400">{stats.published}</p>
        </div>
        <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
          <p className="text-gray-400 text-sm font-bold mb-1">Ø§Ù„Ù…Ø³ÙˆØ¯Ø§Øª</p>
          <p className="text-3xl font-black text-gray-400">{stats.draft}</p>
        </div>
        <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
          <p className="text-gray-400 text-sm font-bold mb-1">Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ø¯ÙÙˆØ¹Ø©</p>
          <p className="text-3xl font-black text-blue-400">{stats.paid}</p>
        </div>
      </div>

      {/* Tabs */}
      <TabsSystem tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 mb-8 mt-8">
        <div className="relative flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder="Ø§Ø¨Ø­Ø« Ø¹Ù† Ø®Ø¯Ù…Ø©..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-3.5 px-6 ps-14 text-white"
          />
          <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-3 px-8 py-3.5 bg-amber-500 text-gray-900 font-black rounded-2xl hover:bg-amber-400 transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Ø¥Ø¶Ø§ÙØ© Ø®Ø¯Ù…Ø© Ø¬Ø¯ÙŠØ¯Ø©
        </button>
      </div>

      {/* Services Table */}
      <div className="glass-medium rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right">
            <thead>
              <tr className="border-b border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest bg-black/20">
                <th className="p-6">Ø§Ù„Ø®Ø¯Ù…Ø©</th>
                <th className="p-6 text-center">Ø§Ù„Ø£ÙŠÙ‚ÙˆÙ†Ø©</th>
                <th className="p-6 text-center">Ø§Ù„Ø³Ø¹Ø±</th>
                <th className="p-6 text-center">Ø§Ù„ØªØ±ØªÙŠØ¨</th>
                <th className="p-6 text-center">Ø§Ù„Ø­Ø§Ù„Ø©</th>
                <th className="p-6 text-left">Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredServices.map((service, index) => (
                <tr key={service.id} className="hover:bg-white/5 transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-5">
                      <img
                        src={service.imageUrl || '/placeholder.svg'}
                        alt={service.title}
                        className="w-16 h-16 rounded-2xl border border-white/10 object-cover"
                      />
                      <div>
                        <p className="font-black text-lg group-hover:text-amber-400 transition-colors">
                          {service.title}
                        </p>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-1">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="text-3xl">{service.icon || 'ðŸ“‹'}</span>
                  </td>
                  <td className="p-6 text-center">
                    {service.price ? (
                      <span className="text-amber-400 font-black">{service.price} Ù„.Ø³</span>
                    ) : (
                      <span className="text-gray-500">Ù…Ø¬Ø§Ù†Ø§Ù‹</span>
                    )}
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleMoveUp(service, index)}
                        disabled={index === 0}
                        className="p-2 bg-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg disabled:opacity-30 transition-all"
                      >
                        <ChevronUpIcon className="w-4 h-4" />
                      </button>
                      <span className="text-gray-400 font-bold">{service.sortOrder}</span>
                      <button
                        onClick={() => handleMoveDown(service, index)}
                        disabled={index === filteredServices.length - 1}
                        className="p-2 bg-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg disabled:opacity-30 transition-all"
                      >
                        <ChevronDownIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <button
                      onClick={() => handleTogglePublish(service)}
                      className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                        service.isPublished
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}
                    >
                      {service.isPublished ? 'âœ“ Ù…Ù†Ø´ÙˆØ±' : 'âœ— Ù…Ø³ÙˆØ¯Ø©'}
                    </button>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-start gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(service)}
                        className="p-3 bg-white/5 text-gray-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-3 bg-red-500/5 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Modal */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-default"
            onClick={() => setIsModalOpen(false)}
          />
          <form
            onSubmit={handleSave}
            className="relative w-full max-w-4xl glass-dark border border-white/10 rounded-[3rem] p-8 md:p-14 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-4xl font-black mb-10">
              {editingService.id ? 'ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø®Ø¯Ù…Ø©' : 'Ø¥Ø¶Ø§ÙØ© Ø®Ø¯Ù…Ø© Ø¬Ø¯ÙŠØ¯Ø©'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-right">
              {/* Image Column */}
              <div className="md:col-span-1 space-y-6">
                <label className="text-xs font-black text-amber-500 uppercase mb-2 block">Ø§Ù„ØµÙˆØ±Ø© *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative aspect-square rounded-[2.5rem] border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center cursor-pointer hover:border-amber-500/30 transition-all overflow-hidden"
                >
                  {editingService.imageUrl ? (
                    <img src={editingService.imageUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <PlusIcon className="w-12 h-12 text-gray-600" />
                  )}
                  {isImageUploading ? (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-sm font-black text-amber-400">
                      جاري رفع الصورة...
                    </div>
                  ) : null}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={IMAGE_FILE_ACCEPT}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Form Fields */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="text-xs font-black text-amber-500 uppercase mb-2 block">Ø§Ù„Ø¹Ù†ÙˆØ§Ù† *</label>
                  <input
                    required
                    value={editingService.title}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-black text-amber-500 uppercase mb-2 block">Ø§Ù„ÙˆØµÙ</label>
                  <textarea
                    rows={4}
                    value={editingService.description}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-amber-500 uppercase mb-2 block">Ø§Ù„Ø£ÙŠÙ‚ÙˆÙ†Ø©</label>
                  <div className="grid grid-cols-6 gap-2">
                    {ICON_OPTIONS.map(option => (
                      <button
                        key={option.emoji}
                        type="button"
                        onClick={() => setEditingService({ ...editingService, icon: option.emoji })}
                        className={`p-3 rounded-xl border transition-all ${
                          editingService.icon === option.emoji
                            ? 'bg-amber-500/20 border-amber-500'
                            : 'bg-white/5 border-white/10 hover:border-amber-500/50'
                        }`}
                        title={option.label}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-amber-500 uppercase mb-2 block">Ø§Ù„Ø³Ø¹Ø± (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingService.price || ''}
                    onChange={(e) => setEditingService({ ...editingService, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-amber-500 uppercase mb-2 block">ØªØ±ØªÙŠØ¨ Ø§Ù„Ø¹Ø±Ø¶</label>
                  <input
                    type="number"
                    min="1"
                    value={editingService.sortOrder}
                    onChange={(e) => setEditingService({ ...editingService, sortOrder: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer mt-8">
                    <input
                      type="checkbox"
                      checked={editingService.isPublished}
                      onChange={(e) => setEditingService({ ...editingService, isPublished: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-white font-bold">Ù†Ø´Ø± Ø§Ù„Ø®Ø¯Ù…Ø© Ù…Ø¨Ø§Ø´Ø±Ø©</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-6 mt-12">
              <button
                type="submit"
                disabled={isImageUploading}
                className="flex-1 bg-amber-500 text-gray-900 font-black py-5 rounded-[1.5rem] hover:bg-amber-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Ø­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-10 bg-white/5 text-gray-400 font-black py-5 rounded-[1.5rem] hover:bg-white/10 transition-all"
              >
                Ø¥Ù„ØºØ§Ø¡
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDelete.isOpen}
        title="ØªØ£ÙƒÙŠØ¯ Ø­Ø°Ù Ø§Ù„Ø®Ø¯Ù…Ø©"
        message="Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø±ØºØ¨ØªÙƒ ÙÙŠ Ø­Ø°Ù Ù‡Ø°Ù‡ Ø§Ù„Ø®Ø¯Ù…Ø© Ù†Ù‡Ø§Ø¦ÙŠØ§Ù‹ØŸ"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
        type="danger"
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={helpContent.services?.title || 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø®Ø¯Ù…Ø§Øª'}
        sections={helpContent.services?.sections || []}
      />
    </div>
  );
}


