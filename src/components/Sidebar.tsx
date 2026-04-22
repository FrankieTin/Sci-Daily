import React from 'react';
import { 
  Home, Clock, Folder, BookOpen, 
  Quote, Dumbbell, ClipboardList, Trophy, Settings 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAppContext } from '../store';
import { DEFAULT_TAB_ORDER } from '../store';

export type Tab = 'time' | 'plan' | 'fitness' | 'papers' | 'journal' | 'achievements' | 'settings';

export const ALL_TABS_CONFIG = [
  { id: 'plan', label: '科研计划', icon: ClipboardList },
  { id: 'time', label: '时光足迹', icon: Clock },
  { id: 'fitness', label: '运动记录', icon: Dumbbell },
  { id: 'papers', label: '论文进度', icon: Folder },
  { id: 'journal', label: '日常随想', icon: BookOpen },
  { id: 'achievements', label: '小小成就', icon: Trophy },
];

interface SidebarProps {
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
  inMobile?: boolean;
}

export default function Sidebar({ currentTab, setCurrentTab, inMobile }: SidebarProps) {
  const { state } = useAppContext();
  const visibleTabs = state.visibleTabs || DEFAULT_TAB_ORDER;

  const isTimeVisible = visibleTabs.includes('time');
  const otherVisibleTabs = visibleTabs.filter(id => id !== 'time');

  // Render 'time' first if it exists, then exactly in the order specified by visibleTabs
  const rawOrderedIDs = isTimeVisible ? ['time', ...otherVisibleTabs] : otherVisibleTabs;

  const orderedTabs = rawOrderedIDs
    .map(id => ALL_TABS_CONFIG.find(t => t.id === id))
    .filter(Boolean) as typeof ALL_TABS_CONFIG;

  return (
    <div className={cn(
      "bg-card h-screen flex flex-col shadow-2xl md:shadow-none overflow-y-auto w-[280px] md:w-72 md:bg-base md:border-r border-line transition-all duration-300 md:pt-10", 
      inMobile ? "border-r border-card" : ""
    )} style={{flexShrink: 0}}>
      
      {/* Mobile Top Header for Sidebar - Fixing "Missing Chunk" */}
      <div className="md:hidden flex flex-col items-center justify-center pt-14 pb-10 bg-sage border-b border-white/10 mb-6 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
        <h1 className="text-[26px] font-bold font-serif text-white m-0 z-10 drop-shadow-sm">科研Daily</h1>
        <div className="w-10 h-1 bg-white/40 rounded-full mt-3 z-10" />
        <p className="text-[10px] text-white/70 mt-3 font-bold tracking-[0.3em] z-10 leading-none">RESEARCH & LIFE LOG</p>
      </div>

      <div className={cn("hidden md:flex flex-col items-start gap-1 mb-10 px-8 md:px-10 font-serif")}>
        <h1 className="text-[22px] md:text-[32px] font-bold font-serif italic text-sage whitespace-nowrap tracking-wide flex items-center gap-2">
          科研Daily
        </h1>
        <p className="text-[11px] md:text-[13px] text-text-muted/70 tracking-[1px] uppercase font-bold">研究与生活记录</p>
      </div>

      <nav className="w-full px-5 md:px-8 flex flex-col gap-2">
        {orderedTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          const isTimeTab = tab.id === 'time';

          if (isTimeTab) {
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as Tab)}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 md:px-6 md:py-5 rounded-[16px] md:rounded-[20px] transition-all duration-300 border-[2px] text-[15px] md:text-[16px] font-bold mb-4 relative overflow-hidden group shadow-sm md:shadow-none",
                  isActive 
                    ? "bg-sage border-sage text-white shadow-md shadow-sage/30" 
                    : "bg-gradient-to-br from-[#FAF8F6] to-[#F0EBE1] border-sage/30 text-sage hover:border-sage hover:shadow-md"
                )}
              >
                <Icon size={24} className={isActive ? "text-white" : "text-sage group-hover:scale-110 transition-transform"} />
                <span className="relative z-10">{tab.label}</span>
                {isActive && <div className="absolute right-[-10px] top-[-10px] w-12 h-12 bg-white/20 rounded-full blur-md" />}
              </button>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as Tab)}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-4 rounded-[16px] transition-all duration-200 border text-[15px] font-medium",
                isActive 
                  ? "bg-sage text-white border-transparent shadow-theme" 
                  : "bg-card text-text-main border-line hover:border-sage/30 hover:shadow-sm"
              )}
            >
              <Icon size={20} className={isActive ? "text-white" : "text-text-muted"} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="px-5 md:px-8 mt-6">
        <button
          onClick={() => setCurrentTab('settings')}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-5 py-3 rounded-[16px] transition-all duration-200 border text-[14px] font-medium",
            currentTab === 'settings'
              ? "bg-text-main text-white border-transparent shadow-theme" 
              : "bg-transparent text-text-muted border-dashed border-line hover:bg-card hover:text-text-main"
          )}
        >
          <Settings size={18} />
          组件设置
        </button>
      </div>

      <div className="px-5 md:px-8 py-6 w-full mt-auto">
        <div className="bg-transparent border border-dashed border-line p-5 rounded-[16px]">
          <Quote size={16} className="text-text-muted mb-3" />
          <p className="text-[13px] italic text-text-muted leading-relaxed font-serif">
            “求知若渴，虚怀若谷。”<br/>(Stay hungry, stay foolish.)
          </p>
        </div>
      </div>
    </div>
  );
}
