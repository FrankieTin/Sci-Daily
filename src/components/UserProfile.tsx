import React, { useState } from 'react';
import { User, Settings, LogOut, ChevronRight, Shield, Edit3, Palette, Camera, LogIn } from 'lucide-react';
import { useAppContext } from '../store';
import SettingsPanel from './Settings';
import { useAuth } from '../lib/AuthContext';
import LoginModal from './LoginModal';

export default function UserProfile({ startWithSettings = false, onBackToMain }: { startWithSettings?: boolean, onBackToMain?: () => void }) {
  const [showSettings, setShowSettings] = React.useState(startWithSettings);
  const [showThemes, setShowThemes] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  const [showEditName, setShowEditName] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [newName, setNewName] = useState('');
  const { user, logout, updateProfileData } = useAuth();
  const { state, updateTheme } = useAppContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpdateAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        try {
          await updateProfileData({ photoURL: dataUrl });
        } catch (err) {
          console.error(err);
          alert('头像更新失败，请重试');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const currentTheme = state.theme || 'dustblue';

  const themes = [
    // Morandi
    { id: 'sage', label: '森绿', color: '#7B8A74', bg: '#F5F2ED', cat: '莫兰迪' },
    { id: 'terracotta', label: '陶土', color: '#B97A67', bg: '#FDF4F0', cat: '莫兰迪' },
    { id: 'dustblue', label: '远黛', color: '#7E96A0', bg: '#F0F4F7', cat: '莫兰迪' },
    { id: 'mauve', label: '烟紫', color: '#9A86A4', bg: '#F5F0F5', cat: '莫兰迪' },
    { id: 'warmgrey', label: '暖灰', color: '#8C8C8C', bg: '#F2F2F2', cat: '莫兰迪' },
    { id: 'matcha', label: '抹茶', color: '#8AA382', bg: '#F3F5F0', cat: '莫兰迪' },
    { id: 'mistyrose', label: '浅粉', color: '#C9A0A0', bg: '#F9F1F1', cat: '莫兰迪' },
    { id: 'slate', label: '黛蓝', color: '#788591', bg: '#F0F2F4', cat: '莫兰迪' },
    { id: 'caramel', label: '焦糖', color: '#A68B7C', bg: '#F7F3F0', cat: '莫兰迪' },
    // Minimalist
    { id: 'pure', label: '极简白', color: '#2D2D2D', bg: '#FFFFFF', cat: '简约' },
    { id: 'charcoal', label: '炭黑', color: '#333333', bg: '#F5F5F5', cat: '简约' },
    { id: 'linen', label: '亚麻', color: '#5F5F5F', bg: '#FAF9F6', cat: '简约' },
    { id: 'nordic', label: '北欧', color: '#4A5D5E', bg: '#F0F4F2', cat: '简约' },
    { id: 'ivory', label: '象牙', color: '#4D4D4D', bg: '#FFFAF0', cat: '简约' },
    { id: 'ebony', label: '玄武', color: '#E0E0E0', bg: '#121212', cat: '简约' },
    { id: 'clay', label: '陶泥', color: '#6E5F53', bg: '#E8E4E1', cat: '简约' },
    { id: 'stone', label: '岩石', color: '#525252', bg: '#EBEBEB', cat: '简约' },
    { id: 'mousse', label: '慕意', color: '#6B4E3D', bg: '#F5EFEB', cat: '简约' },
  ];

  React.useEffect(() => {
    setShowSettings(startWithSettings);
  }, [startWithSettings]);

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;
    try {
      await updateProfileData({ displayName: newName.trim() });
      setShowEditName(false);
    } catch (e) {
      console.error(e);
      alert('更新失败，请重试');
    }
  };

  if (showSettings) {
    return (
      <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <button onClick={() => {
          if (startWithSettings && onBackToMain) {
            onBackToMain();
          } else {
            setShowSettings(false);
          }
        }} className="text-sage font-bold flex items-center mb-4 transition-transform hover:-translate-x-1">
          ← 返回{startWithSettings ? '首页' : '个人主页'}
        </button>
        <SettingsPanel />
      </div>
    );
  }

  if (showThemes) {
    return (
      <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <button onClick={() => setShowThemes(false)} className="text-sage font-bold flex items-center mb-4 transition-transform hover:-translate-x-1">
          ← 返回个人主页
        </button>
        
        <div className="bg-card p-6 md:p-8 rounded-card shadow-theme border border-line">
          <h2 className="text-[24px] md:text-[28px] font-bold font-serif text-text-main mb-2">主题色系设置</h2>
          <p className="text-[14px] text-text-muted mb-8 tracking-wide">分类选择一款最适合您当研状态的配色。</p>
          
          <div className="space-y-10">
            {['莫兰迪', '简约'].map(cat => (
              <div key={cat} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-line/50 to-transparent" />
                  <span className="text-[12px] font-bold text-text-muted tracking-[0.3em] uppercase">{cat}系列</span>
                  <div className="h-[2px] flex-1 bg-gradient-to-l from-line/50 to-transparent" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                  {themes.filter(t => t.cat === cat).map(t => (
                    <button 
                      key={t.id}
                      onClick={() => updateTheme(t.id as any)}
                      className={`flex flex-col gap-2 p-3 rounded-[16px] border transition-all duration-300 group ${currentTheme === t.id ? 'border-sage ring-2 ring-sage/10 bg-sage/5' : 'border-line hover:border-sage/40 hover:bg-[#FAF8F6]'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full border border-line/20 shadow-inner flex-shrink-0" style={{ backgroundColor: t.color }} />
                        <span className={`text-[13px] font-bold truncate ${currentTheme === t.id ? 'text-sage' : 'text-text-main'}`}>{t.label}</span>
                      </div>
                      <div className="w-full h-6 rounded-[8px] overflow-hidden flex border border-line/10">
                        <div className="w-1/2 h-full" style={{ backgroundColor: t.bg }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: t.color }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showEditProfile) {
    return (
      <div className="p-4 sm:p-6 md:p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
        <button onClick={() => setShowEditProfile(false)} className="text-sage font-bold flex items-center mb-4 transition-transform hover:-translate-x-1">
          ← 返回个人主页
        </button>

        <div className="bg-card rounded-card shadow-theme border border-line overflow-hidden p-8 flex flex-col items-center">
          <div className="relative group cursor-pointer mb-8" onClick={handleUpdateAvatarClick}>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
            <div className="w-28 h-28 rounded-full bg-sage/20 border-4 border-sage flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-sage" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
          </div>

          <div className="w-full space-y-6">
            <div className="space-y-2">
              <label className="text-[12px] text-text-muted uppercase tracking-widest font-bold">用户昵称</label>
              <div className="flex gap-3">
                <input 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)}
                  placeholder={user?.displayName || "请输入新昵称"}
                  className="flex-1 bg-base border border-line rounded-[12px] px-4 py-3 text-[14px] outline-none focus:border-sage transition-colors"
                />
                <button onClick={handleUpdateName} className="bg-sage text-white px-6 rounded-[12px] text-[14px] font-bold hover:bg-sage-dark transition-colors">
                  保存
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-line border-dashed">
              <label className="text-[12px] text-text-muted uppercase tracking-widest font-bold">登录账号</label>
              <div className="bg-base p-4 rounded-[12px] text-[14px] text-text-main border border-line border-dashed">
                {user?.email || '未绑定邮箱'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-6 bg-card p-6 rounded-card shadow-theme border border-line relative">
        <div className="w-20 h-20 rounded-full bg-sage/20 border-2 border-sage flex items-center justify-center overflow-hidden flex-shrink-0">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={36} className="text-sage" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-[22px] font-bold font-serif text-text-main">
            {user?.displayName || '访客模式'}
          </h2>
          <p className="text-[13px] md:text-[14px] text-text-muted mt-1 leading-relaxed">
            {user ? user.emailOrPhone : '未绑定账号 (仅本地存储)'}<br/>
            ID: {user ? user.uid.substring(0, 8).toUpperCase() : 'LOCAL_GUEST'}
          </p>
        </div>
        <button onClick={() => { setNewName(user?.displayName || ''); setShowEditProfile(true); }} className="absolute top-6 right-6 text-sage hover:bg-sage/10 p-2.5 rounded-full transition-colors border border-line hover:border-sage/40">
          <Edit3 size={18} />
        </button>
      </div>

      <div className="bg-card rounded-card shadow-theme border border-line overflow-hidden">
        <div className="p-4 border-b border-line bg-[#FAF8F6] text-[13px] font-bold text-text-muted uppercase tracking-widest">
          账号与个性化设置
        </div>
        <div className="flex flex-col">
          <button className="flex items-center justify-between p-5 border-b border-line hover:bg-base transition-colors group" onClick={() => setShowEditProfile(true)}>
            <div className="flex items-center gap-3 text-[16px] text-text-main font-bold">
              <div className="p-2 rounded-[10px] bg-terracotta/10 text-terracotta group-hover:scale-110 transition-transform">
                <User size={18} />
              </div>
              修改个人资料
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>

          <button className="flex items-center justify-between p-5 border-b border-line hover:bg-base transition-colors group" onClick={() => setShowThemes(true)}>
            <div className="flex items-center gap-3 text-[16px] text-text-main font-bold">
              <div className="p-2 rounded-[10px] bg-sage/10 text-sage group-hover:scale-110 transition-transform">
                <Palette size={18} />
              </div>
              主题色系设置
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>

          <button className="flex items-center justify-between p-5 border-b border-line hover:bg-base transition-colors group" onClick={() => setShowSettings(true)}>
            <div className="flex items-center gap-3 text-[16px] text-text-main font-bold">
              <div className="p-2 rounded-[10px] bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <Settings size={18} />
              </div>
              组件显示控制
            </div>
            <ChevronRight size={18} className="text-text-muted" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {!user && (
          <button onClick={() => setShowLoginModal(true)} className="w-full bg-sage border border-sage text-white font-bold text-[16px] py-4 rounded-card shadow-sm hover:bg-sage-dark transition-colors flex justify-center items-center gap-2 group">
            <LogIn size={18} className="group-hover:translate-x-1 transition-transform" /> 注册 / 登录
          </button>
        )}
        {user && (
          <button onClick={logout} className="w-full bg-white border border-line text-terracotta font-bold text-[16px] py-4 rounded-card shadow-sm hover:bg-[#FAF8F6] transition-colors flex justify-center items-center gap-2 group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> 退出登录
          </button>
        )}
      </div>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </div>
  );
}
