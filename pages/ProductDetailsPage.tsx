import React, { useEffect, useState } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { StarIcon, HeartIconOutline, HeartIconSolid, ChevronRightIcon, ShoppingCartIcon, PhoneIcon } from '../components/icons';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../hooks/useAuth';
import { useRecentViews } from '../hooks/useRecentViews';
import { Page } from '../App';
import { Reptile } from '../types';
import TabsSystem, { TabItem } from '../components/TabSystem';
import ReptileCard from '../components/ReptileCard';

interface ProductDetailsPageProps {
    productId: number;
    setPage: (page: Page | string) => void;
}

const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({ productId, setPage }) => {
    const { products } = useDatabase();
    const reptile = products.find(r => r.id === productId);
    const { addToCart } = useCart();
    const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const { user } = useAuth();
    const { recentProducts, addView } = useRecentViews();
    const [activeTab, setActiveTab] = useState('details');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const ratingValue = Number(reptile?.rating ?? 0);

    // Helper function to get status badge colors
    const getStatusColor = (status: Reptile['status']) => {
        switch (status) {
            case 'متوفر': return 'bg-green-500 text-white';
            case 'قيد الحجز': return 'bg-amber-500 text-gray-900';
            case 'غير متوفر': return 'bg-red-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    useEffect(() => {
        if (reptile) {
            document.title = `${reptile.name} - Reptile House`;
            addView(reptile.id);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [reptile, productId]);

    if (!reptile) {
        return (
            <div className="text-center py-32 glass-medium rounded-3xl animate-fade-in">
                <h1 className="text-4xl font-black mb-4">عذراً، هذا الزاحف غير موجود</h1>
                <p className="text-gray-400 mb-8">ربما تم بيعه أو نقله إلى صفحة أخرى.</p>
                <button onClick={() => setPage('showcase')} className="bg-amber-500 text-gray-900 font-black px-10 py-4 rounded-2xl shadow-xl">العودة للمعرض</button>
            </div>
        );
    }

    const isWishlisted = wishlist.includes(reptile.id);

    // Mock additional images (in real app, these would come from reptile.images array)
    const galleryImages = [
        reptile.imageUrl,
        reptile.imageUrl, // Replace with actual additional images
        reptile.imageUrl,
    ];

    const similarProducts = products
        .filter(p => p.id !== reptile.id && p.category === reptile.category)
        .slice(0, 4);

    const productTabs: TabItem[] = [
        { id: 'details', label: 'التفاصيل', icon: '📋' },
        { id: 'specs', label: 'المواصفات', icon: '📊' },
        { id: 'care', label: 'دليل الرعاية', icon: '💚' },
        { id: 'reviews', label: 'التقييمات', icon: '⭐', badge: reptile.reviews?.length || 0 }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'specs':
                return (
                    <div className="glass-medium p-8 md:p-12 rounded-[2.5rem] border border-white/10 animate-fade-in shadow-2xl">
                        <h3 className="text-2xl font-black mb-8 border-b border-white/10 pb-4 text-right flex items-center gap-3">
                            <span className="w-2 h-8 bg-amber-500 rounded-full"></span>
                            جدول المواصفات الفنية
                        </h3>
                        {reptile.specifications && reptile.specifications.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {reptile.specifications.map((spec, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <span className="text-amber-400 font-black text-sm">{spec.label}</span>
                                        <span className="text-gray-200 font-bold">{spec.value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 opacity-30">
                                <p className="text-xl font-bold">لا توجد مواصفات فنية مسجلة لهذا المنتج حالياً.</p>
                            </div>
                        )}
                    </div>
                );
            case 'care':
                return (
                    <div className="glass-medium p-8 md:p-12 rounded-[2.5rem] border border-white/10 animate-fade-in shadow-2xl space-y-10 text-right">
                        <div className="flex items-start gap-6 flex-row-reverse">
                            <div className="bg-amber-500/20 p-5 rounded-[2rem] text-amber-400 text-4xl shadow-xl">💡</div>
                            <div className="flex-1">
                                <h4 className="text-amber-400 font-black mb-4 text-2xl tracking-tighter">بيئة المعيشة والإضاءة</h4>
                                <div className="text-gray-300 leading-loose text-lg space-y-4">
                                    {reptile.careInstructions ? (
                                        <p>{reptile.careInstructions}</p>
                                    ) : (
                                        <p>هذا النوع يتطلب بيئة خاصة تحاكي موطنه الأصلي. يرجى التأكد من توفير إضاءة UVB فعالة ومصدر حرارة (Basking Spot) بدرجة حرارة مناسبة، بالإضافة إلى مخابئ آمنة. فريقنا في دمشق جاهز لتزويدك بكافة المستلزمات اللازمة.</p>
                                    )}
                                    <p className="font-bold border-r-4 border-amber-500 pr-4 mt-8 py-2 bg-white/5 rounded-l-xl">
                                        نصيحة الخبير: "دقة درجات الحرارة هي المفتاح لصحة الجهاز الهضمي والنمو السليم لزواحفكم."
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h5 className="text-amber-400 font-black mb-4 text-lg">درجات الحرارة</h5>
                                <div className="space-y-3 text-gray-300">
                                    <div className="flex justify-between">
                                        <span>النقاط الساخنة (Basking)</span>
                                        <span className="font-bold">32-38°C</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>المناطق الباردة</span>
                                        <span className="font-bold">24-28°C</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>ليلًا</span>
                                        <span className="font-bold">20-24°C</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h5 className="text-amber-400 font-black mb-4 text-lg">الرطوبة والإضاءة</h5>
                                <div className="space-y-3 text-gray-300">
                                    <div className="flex justify-between">
                                        <span>الرطوبة النسبية</span>
                                        <span className="font-bold">40-60%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>إضاءة UVB</span>
                                        <span className="font-bold">10-12 ساعة</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>إضاءة نهارية</span>
                                        <span className="font-bold">12-14 ساعة</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h5 className="text-amber-400 font-black mb-4 text-lg">النظام الغذائي</h5>
                                <div className="space-y-3 text-gray-300">
                                    <div className="flex justify-between">
                                        <span>النوع</span>
                                        <span className="font-bold">عاشب / آكل حشرات</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>التغذية</span>
                                        <span className="font-bold">يوميًا</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>المكملات</span>
                                        <span className="font-bold">كالسيوم أسبوعيًا</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h5 className="text-amber-400 font-black mb-4 text-lg">الحجم المطلوب</h5>
                                <div className="space-y-3 text-gray-300">
                                    <div className="flex justify-between">
                                        <span>الطول</span>
                                        <span className="font-bold">120x60x60 سم</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>المادة</span>
                                        <span className="font-bold">زجاج أو PVC</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>التهوية</span>
                                        <span className="font-bold">جيدة</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'reviews':
                return (
                    <div className="space-y-6 animate-fade-in text-right">
                        {reptile.reviews && reptile.reviews.length > 0 ? reptile.reviews.map((review, i) => (
                            <div key={i} className="glass-medium p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group hover:border-amber-500/30 transition-all shadow-xl">
                                <div className="flex justify-between items-center mb-6 flex-row-reverse">
                                    <div className="flex items-center gap-4 flex-row-reverse">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-white shadow-2xl text-xl">
                                            {review.user.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-black block text-lg">{review.user}</span>
                                            <div className="flex gap-1 mt-1">
                                                {[...Array(5)].map((_, star) => (
                                                    <StarIcon key={star} className={`w-4 h-4 ${star < review.rating ? 'text-amber-400' : 'text-gray-700'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 font-poppins font-bold bg-white/5 px-4 py-1.5 rounded-full">{review.date}</span>
                                </div>
                                <p className="text-gray-300 leading-relaxed text-lg italic pr-4 border-r-2 border-white/10">"{review.comment}"</p>
                            </div>
                        )) : (
                            <div className="text-center py-24 glass-medium rounded-[2.5rem] border border-dashed border-white/10">
                                <StarIcon className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                <p className="text-gray-500 font-black">لا توجد تقييمات لهذا المنتج بعد.</p>
                                <button className="mt-4 text-amber-500 font-black hover:underline">كن أول من يشارك تجربته</button>
                            </div>
                        )}
                    </div>
                );
            case 'details':
            default:
                return (
                    <div className="glass-medium p-10 md:p-14 rounded-[3rem] border border-white/10 animate-fade-in shadow-2xl text-right relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
                        <h3 className="text-3xl font-black text-white mb-8 tracking-tighter flex items-center gap-3">
                            <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
                            وصف المنتج والقصة
                        </h3>
                        <div className="text-gray-200 text-xl leading-loose space-y-6">
                            {reptile.description ? (
                                <p className="font-bold">{reptile.description}</p>
                            ) : (
                                <p>هذا المخلوق الرائع تم اختياره بعناية فائقة من قبل خبيرنا سيمون. يتميز بصحة ممتازة، ونمط لوني فريد يجعله قطعة فنية حية في أي مكان يوضع فيه. لقد تم تعويده على التغذية المنتظمة وفحصه طبياً لضمان خلوه من الطفيليات والمشاكل الصحية الشائعة.</p>
                            )}
                            <p className="text-gray-400">
                                عند شرائك لـ **{reptile.name}**، ستحصل على استشارة مجانية حول تجهيز الحوض المناسب وجدول التغذية المثالي لضمان نموه بشكل صحي وسليم.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    const otherRecent = recentProducts.filter(r => r.id !== reptile.id);

    return (
        <div className="mx-auto max-w-[1280px] animate-fade-in px-3 pb-20 sm:px-4 md:pb-0">
            <nav className="mb-8 flex flex-wrap items-center space-x-2 space-x-reverse text-sm font-black text-gray-500 sm:mb-12">
                <button onClick={() => setPage('home')} className="hover:text-amber-500 transition-colors uppercase">الرئيسية</button>
                <ChevronRightIcon className="w-4 h-4 rotate-180" />
                <button onClick={() => setPage('showcase')} className="hover:text-amber-500 transition-colors uppercase">المعرض</button>
                <ChevronRightIcon className="w-4 h-4 rotate-180" />
                <span className="text-amber-500 uppercase tracking-widest">{reptile.name}</span>
            </nav>

            <div className="mb-16 grid items-center gap-8 lg:mb-24 lg:grid-cols-2 lg:gap-16">
                {/* Image Gallery Section */}
                <div className="relative group animate-scale-in">
                    <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] glass-dark sm:rounded-[3rem] lg:rounded-[4rem]">
                        <img
                            src={galleryImages[selectedImageIndex]}
                            alt={`${reptile.name} - Image ${selectedImageIndex + 1}`}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div className="absolute left-4 top-4 sm:left-8 sm:top-8 lg:left-10 lg:top-10">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!user) { alert('يرجى تسجيل الدخول أولاً'); return; }
                                    isWishlisted ? removeFromWishlist(reptile.id) : addToWishlist(reptile.id);
                                }}
                                className="bg-black/40 backdrop-blur-2xl p-6 rounded-[2rem] text-white hover:text-amber-500 transition-all border border-white/10 shadow-2xl active:scale-90"
                                title={isWishlisted ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                            >
                                {isWishlisted ? <HeartIconSolid className="w-8 h-8 text-amber-400" /> : <HeartIconOutline className="w-8 h-8" />}
                            </button>
                        </div>
                        <div className="absolute bottom-10 right-10 flex gap-2">
                            <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl ${getStatusColor(reptile.status)}`}>
                                {reptile.status}
                            </span>
                        </div>
                    </div>
                    {/* Thumbnail Gallery */}
                    <div className="flex gap-3 mt-6 justify-center">
                        {galleryImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedImageIndex(idx)}
                                className={`h-16 w-16 overflow-hidden rounded-2xl border-2 transition-all sm:h-20 sm:w-20 ${selectedImageIndex === idx ? 'scale-110 border-amber-500' : 'border-white/20 opacity-60 hover:opacity-100'}`}
                            >
                                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                    {/* Floating decorative elements */}
                    <div className="absolute -z-10 -bottom-10 -right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute -z-10 -top-10 -left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
                </div>

                {/* Info Section */}
                <div className="flex flex-col text-right animate-slide-up">
                    <div className="flex items-center justify-end gap-4 mb-8">
                        <span className="bg-white/5 border border-white/10 text-gray-400 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg">
                            معتمد من Reptile House
                        </span>
                        <div className="flex items-center gap-1.5 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
                            <StarIcon className="w-4 h-4 text-amber-500" />
                            <span className="font-black font-poppins text-xs text-amber-500">{ratingValue.toFixed(1)}</span>
                        </div>
                    </div>
                    <h1 className="mb-4 text-4xl font-black leading-none tracking-tighter text-white drop-shadow-2xl sm:mb-6 sm:text-5xl md:text-7xl lg:text-8xl">
                        {reptile.name}
                    </h1>
                    <p className="mb-8 text-2xl font-black uppercase tracking-wide text-gray-500 font-poppins sm:mb-12 sm:text-3xl">{reptile.species}</p>

                    <div className="flex items-center justify-end gap-10 mb-16">
                        <div className="text-right">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">السعر الحالي</p>
                            <span className="font-poppins text-4xl font-black text-amber-500 drop-shadow-lg sm:text-6xl">${reptile.price}</span>
                        </div>
                    </div>

                    {/* Availability Table */}
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
                        <h5 className="text-amber-400 font-black mb-4 text-lg">جدول التوافر</h5>
                        <div className="space-y-3 text-gray-300">
                            <div className="flex justify-between">
                                <span>متوفر الآن</span>
                                <span className={`font-bold ${reptile.status === 'متوفر' ? 'text-green-400' : 'text-red-400'}`}>
                                    {reptile.status === 'متوفر' ? 'نعم' : 'لا'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>متوفر للحجز</span>
                                <span className="font-bold text-amber-400">نعم</span>
                            </div>
                            <div className="flex justify-between">
                                <span>وقت التجهيز</span>
                                <span className="font-bold">24-48 ساعة</span>
                            </div>
                            <div className="flex justify-between">
                                <span>التوصيل</span>
                                <span className="font-bold">دمشق + المحافظات</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">الكمية</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 bg-white/10 rounded-xl text-white font-black hover:bg-white/20 transition-colors"
                                >
                                    -
                                </button>
                                <span className="text-2xl font-black text-white w-12 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 bg-white/10 rounded-xl text-white font-black hover:bg-white/20 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">الإجمالي</label>
                            <div className="text-2xl font-black text-amber-500">${(reptile.price * quantity).toFixed(2)}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <button
                            onClick={() => addToCart({ ...reptile, quantity })}
                            disabled={reptile.status === 'غير متوفر'}
                            className={`flex-1 bg-amber-500 text-gray-900 font-black py-4 px-6 sm:py-6 sm:px-10 rounded-2xl sm:rounded-[2.5rem] hover:bg-amber-400 transition-all shadow-[0_20px_50px_-10px_rgba(245,158,11,0.5)] flex items-center justify-center gap-3 sm:gap-4 text-base sm:text-2xl active:scale-95 disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed`}
                        >
                            <ShoppingCartIcon className="w-8 h-8" />
                            <span>{reptile.status === 'غير متوفر' ? 'نفذت الكمية' : 'أضف للسلة'}</span>
                        </button>

                        <button
                            onClick={() => setPage('contact')}
                            className="hidden flex-1 items-center justify-center gap-3 rounded-[2.5rem] border border-white/10 py-6 px-10 text-lg font-black text-white transition-all hover:bg-white/10 sm:flex glass-light"
                        >
                            استشارة المربي
                        </button>
                    </div>

                    {/* Book Consultation Button */}
                    <button
                        onClick={() => setPage('contact')}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-base font-black text-white shadow-xl transition-all hover:from-indigo-600 hover:to-purple-700 active:scale-95 sm:px-8 sm:text-lg"
                    >
                        <PhoneIcon className="w-5 h-5" />
                        احجز استشارة متخصصة
                    </button>

                    <p className="mt-8 text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">توصيل آمن لجميع المحافظات خلال 48 ساعة</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto mb-32">
                <TabsSystem tabs={productTabs} activeTabId={activeTab} onChange={setActiveTab} />
                <div className="mt-12">{renderTabContent()}</div>
            </div>

            {similarProducts.length > 0 && (
                <section className="mt-20 border-t border-white/5 pt-12 sm:mt-40 sm:pt-20">
                    <div className="mb-10 flex flex-col-reverse gap-4 text-right sm:mb-16 sm:flex-row-reverse sm:items-end sm:justify-between">
                        <h2 className="text-4xl font-black tracking-tighter text-white">منتجات مشابهة</h2>
                        <button onClick={() => setPage('showcase')} className="text-amber-500 font-black text-xs uppercase tracking-widest hover:underline">مشاهدة الكل</button>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
                        {similarProducts.map((product, idx) => (
                            <div key={product.id} className="scale-95 opacity-80 hover:scale-100 hover:opacity-100 transition-all duration-500">
                                <ReptileCard reptile={product} setPage={setPage} index={idx} />
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ProductDetailsPage;
