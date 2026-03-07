
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { PlusIcon } from './icons';
import { IMAGE_FILE_ACCEPT, mediaService } from '../services/media';

interface ProfileInfoProps {
    user: User;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ user }) => {
    const { updateProfile } = useAuth();
    const [profilePic, setProfilePic] = useState<string | null>(user.avatarUrl || null);
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            mediaService.validateImageFile(file);
            setIsUploadingAvatar(true);
            const avatarUrl = await mediaService.uploadProjectImage(file, 'avatars');
            setProfilePic(avatarUrl);
        } catch (error) {
            alert(error instanceof Error ? error.message : 'تعذر رفع الصورة الشخصية');
        } finally {
            setIsUploadingAvatar(false);
            e.target.value = '';
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (isUploadingAvatar) {
            alert('انتظر حتى يكتمل رفع الصورة الشخصية أولاً');
            return;
        }
        setIsSaving(true);
        setTimeout(() => {
            updateProfile({
                name,
                email,
                avatarUrl: profilePic || undefined
            });
            setIsSaving(false);
            alert('تم حفظ التغييرات بنجاح!');
        }, 800);
    };

    return (
        <div className="text-right">
            <h2 className="text-3xl font-bold mb-10">مرحباً، {user.name}!</h2>
            
            <div className="flex flex-col md:flex-row-reverse gap-10 items-start">
                {/* Avatar Upload Section */}
                <div className="relative group mx-auto md:mx-0">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 rounded-[2rem] bg-amber-500/10 border-2 border-dashed border-amber-500/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-amber-500 transition-all shadow-xl shadow-amber-500/5"
                    >
                        {profilePic ? (
                            <img src={profilePic} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                            <div className="text-center">
                                <PlusIcon className="w-6 h-6 mx-auto text-amber-500 mb-1" />
                                <span className="text-[10px] text-amber-500 font-black uppercase">Upload</span>
                            </div>
                        )}
                        {isUploadingAvatar ? (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] text-white font-black uppercase">
                                Uploading
                            </div>
                        ) : null}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <span className="text-[10px] text-white font-black uppercase">تغيير</span>
                        </div>
                    </div>
                    <input id="profile-avatar-upload" name="profileAvatarUpload" type="file" ref={fileInputRef} className="hidden" accept={IMAGE_FILE_ACCEPT} onChange={handleFileChange} />
                </div>

                {/* Form Fields */}
                <form className="flex-1 w-full space-y-6" onSubmit={handleSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-amber-500 uppercase tracking-widest mb-2">الاسم الكامل</label>
                            <input 
                                id="profile-name"
                                name="profileName"
                                required
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none text-right" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-amber-500 uppercase tracking-widest mb-2">البريد الإلكتروني</label>
                            <input 
                                id="profile-email"
                                name="profileEmail"
                                required
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none text-right" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-amber-500 uppercase tracking-widest mb-2">كلمة المرور الحالية</label>
                        <input 
                            id="profile-current-password"
                            name="profileCurrentPassword"
                            type="password" 
                            placeholder="********" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none text-right" 
                        />
                    </div>
                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={isSaving || isUploadingAvatar}
                            className={`bg-amber-500 text-gray-900 font-black py-4 px-10 rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 ${isSaving ? 'opacity-50 cursor-wait' : 'hover:bg-amber-400'}`}
                        >
                            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ProfileInfo;
