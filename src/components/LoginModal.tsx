import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { X, Mail, Phone, Lock, ChevronRight } from 'lucide-react';

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(emailOrPhone, password);
      } else {
        await login(emailOrPhone, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || '发生错误');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-muted hover:bg-black/5 rounded-full z-10 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-sage/10 text-sage rounded-[20px] flex items-center justify-center mx-auto mb-4 border border-sage/20">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
             </div>
             <h2 className="text-[24px] font-serif font-bold text-text-main">
               {isRegister ? '加入科研Daily' : '登录记录家'}
             </h2>
             <p className="text-[14px] text-text-muted mt-2">
               离线本地数据引擎保障您的隐私<br/>即刻开启或继续您的学术足迹
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-[12px] text-[13px] text-center border border-red-100">
                  {error}
                </div>
             )}
            
             <div className="relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                 <Mail size={18} />
               </div>
               <input 
                 type="text" 
                 required
                 value={emailOrPhone}
                 onChange={(e) => setEmailOrPhone(e.target.value)}
                 placeholder="邮箱 或 手机号" 
                 className="w-full bg-[#FAF8F6] border border-line pl-11 pr-4 py-3.5 rounded-[16px] text-[15px] outline-none focus:ring-1 focus:ring-sage focus:border-sage transition-all"
               />
             </div>
             
             <div className="relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                 <Lock size={18} />
               </div>
               <input 
                 type="password" 
                 required
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="密码" 
                 className="w-full bg-[#FAF8F6] border border-line pl-11 pr-4 py-3.5 rounded-[16px] text-[15px] outline-none focus:ring-1 focus:ring-sage focus:border-sage transition-all"
               />
             </div>

             <button type="submit" className="w-full bg-sage text-white font-bold py-3.5 rounded-[16px] text-[15px] hover:bg-sage-dark transition-colors shadow-sm flex justify-center items-center gap-2 group mt-2">
               {isRegister ? '立即注册' : '点击登录'}
               <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </form>

          <div className="mt-6 text-center">
             <button 
               onClick={() => { setIsRegister(!isRegister); setError(''); }}
               className="text-[14px] text-sage hover:underline font-bold"
             >
               {isRegister ? '已有账号？直接登录' : '没有账号？创建全新本地分身'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
