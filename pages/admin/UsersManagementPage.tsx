
import React, { useState, useMemo } from 'react';
import { useDatabase } from '../../contexts/DatabaseContext';
import { SearchIcon, UserIcon, TrashIcon, StarIcon, CheckCircleIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import { User, UserRole } from '../../types';
import HelpButton from '../../components/HelpButton';
import HelpModal from '../../components/HelpModal';
import { helpContent } from '../../constants/helpContent';

const UsersManagementPage: React.FC = () => {
    const { users, updateUser, deleteUser } = useDatabase();
    const [searchTerm, setSearchTerm] = useState('');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const handleRoleChange = (userId: string, newRole: UserRole) => {
        const userToUpdate = users.find(u => u.id === userId);
        if (userToUpdate) {
            updateUser({ ...userToUpdate, role: newRole });
        }
    };

    const handleDeleteClick = (id: string) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const handleConfirmDelete = () => {
        if (confirmDelete.id) {
            deleteUser(confirmDelete.id);
        }
        setConfirmDelete({ isOpen: false, id: null });
    };

    const getRoleBadgeClasses = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'manager': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'editor': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-green-500/10 text-green-400 border-green-500/20';
        }
    };

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'مسؤول نظام';
            case 'manager': return 'مدير متجر';
            case 'editor': return 'محرر محتوى';
            default: return 'عميل مسجل';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-right">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black mb-2 text-white">إدارة المستخدمين</h1>
                        <p className="text-gray-500 font-bold">إدارة حسابات الموظفين والعملاء وتحديد الصلاحيات</p>
                    </div>
                    <HelpButton onClick={() => setIsHelpOpen(true)} />
                </div>
                <div className="relative w-full md:w-96">
                    <input 
                        id="users-search"
                        name="usersSearch"
                        type="text" 
                        placeholder="ابحث عن مستخدم بالاسم أو البريد..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1a1c23] border border-white/10 rounded-2xl py-4 px-6 ps-14 outline-none focus:ring-2 focus:ring-amber-500/50 text-white transition-all shadow-inner"
                    />
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                </div>

                {filteredUsers.length === 0 && (
                    <div className="flex flex-col items-center p-12 text-center lg:hidden">
                        <UserIcon className="w-16 h-16 text-gray-700 mb-4 opacity-20" />
                        <p className="text-gray-500 font-bold italic">لا يوجد مستخدمين يطابقون بحثك</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
                    <p className="text-gray-400 text-sm font-bold mb-1">إجمالي الحسابات</p>
                    <p className="text-3xl font-black font-poppins">{users.length}</p>
                </div>
                <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
                    <p className="text-gray-400 text-sm font-bold mb-1">المسؤولين والمدراء</p>
                    <p className="text-3xl font-black font-poppins text-amber-500">{users.filter(u => u.role !== 'user').length}</p>
                </div>
                <div className="glass-medium p-6 rounded-[2rem] border border-white/10">
                    <p className="text-gray-400 text-sm font-bold mb-1">العملاء النشطين</p>
                    <p className="text-3xl font-black font-poppins text-green-400">{users.filter(u => u.role === 'user').length}</p>
                </div>
            </div>

            <div className="glass-dark rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl bg-[#11141b]/60">
                {filteredUsers.length > 0 && (
                    <div className="space-y-4 p-4 lg:hidden">
                        {filteredUsers.map(user => (
                            <article key={user.id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-gray-800 shrink-0">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-amber-500 font-black text-xl">
                                                    {user.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-white truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 break-all">{user.email}</p>
                                            <p className="text-[10px] text-gray-500 font-poppins uppercase tracking-widest mt-1">UID: {user.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border shrink-0 ${getRoleBadgeClasses(user.role)}`}>
                                        {getRoleLabel(user.role)}
                                    </span>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <label htmlFor={`user-role-mobile-${user.id}`} className="block text-[11px] font-black uppercase tracking-widest text-gray-500">
                                        تعديل الصلاحية
                                    </label>
                                    <select
                                        id={`user-role-mobile-${user.id}`}
                                        name={`userRoleMobile-${user.id}`}
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer text-white appearance-none text-center"
                                    >
                                        <option value="user">عميل</option>
                                        <option value="editor">محرر</option>
                                        <option value="manager">مدير</option>
                                        <option value="admin">مسؤول</option>
                                    </select>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => handleDeleteClick(user.id)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-black text-red-300 transition-all hover:bg-red-500 hover:text-white border border-red-500/10"
                                        title="حذف الحساب"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                        <span>حذف الحساب</span>
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th className="p-6">المستخدم</th>
                                <th className="p-6">البريد الإلكتروني</th>
                                <th className="p-6 text-center">الرتبة الحالية</th>
                                <th className="p-6">تعديل الصلاحية</th>
                                <th className="p-6 text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-gray-800 shrink-0">
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-amber-500 font-black text-xl">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-white">{user.name}</p>
                                                <p className="text-[10px] text-gray-500 font-poppins uppercase tracking-widest">UID: {user.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-gray-400 font-poppins text-sm">{user.email}</td>
                                    <td className="p-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getRoleBadgeClasses(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <select 
                                            id={`user-role-${user.id}`}
                                            name={`userRole-${user.id}`}
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer text-white appearance-none text-center min-w-[140px]"
                                        >
                                            <option value="user">عميل</option>
                                            <option value="editor">محرر</option>
                                            <option value="manager">مدير</option>
                                            <option value="admin">مسؤول</option>
                                        </select>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex justify-start opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleDeleteClick(user.id)}
                                                className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/10"
                                                title="حذف الحساب"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredUsers.length === 0 && (
                        <div className="p-20 text-center flex flex-col items-center">
                            <UserIcon className="w-16 h-16 text-gray-700 mb-4 opacity-20" />
                            <p className="text-gray-500 font-bold italic">لا يوجد مستخدمين يطابقون بحثك</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                title="حذف حساب مستخدم"
                message="هل أنت متأكد من حذف هذا الحساب نهائياً؟ سيتم فقدان كافة سجلات هذا المستخدم وعناوينه وطلباته المرتبطة."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
            />

            <HelpModal
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                content={helpContent.users}
            />
        </div>
    );
};

export default UsersManagementPage;
