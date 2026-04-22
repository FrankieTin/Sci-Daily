import React from 'react';
import { useAppContext } from '../store';
import { ALL_TABS_CONFIG } from './Sidebar';
import { CheckSquare, Square, ArrowUp, ArrowDown } from 'lucide-react';
import { DEFAULT_TAB_ORDER } from '../store';

export default function SettingsPanel() {
  const { state, updateVisibleTabs } = useAppContext();
  const visibleTabs = state.visibleTabs || DEFAULT_TAB_ORDER;

  // Render tabs in the order of ALL_TABS_CONFIG but placed according to visibleTabs
  const orderedVisible = visibleTabs.map(id => ALL_TABS_CONFIG.find(t => t.id === id)).filter(Boolean) as typeof ALL_TABS_CONFIG;
  const hiddenTabs = ALL_TABS_CONFIG.filter(t => !visibleTabs.includes(t.id));

  const allOrderedTabs = [...orderedVisible, ...hiddenTabs];

  const handleToggle = (tabId: string) => {
    if (visibleTabs.includes(tabId)) {
      updateVisibleTabs(visibleTabs.filter(id => id !== tabId));
    } else {
      updateVisibleTabs([...visibleTabs, tabId]);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newTabs = [...visibleTabs];
    const temp = newTabs[index - 1];
    newTabs[index - 1] = newTabs[index];
    newTabs[index] = temp;
    updateVisibleTabs(newTabs);
  };

  const moveDown = (index: number) => {
    if (index === visibleTabs.length - 1) return;
    const newTabs = [...visibleTabs];
    const temp = newTabs[index + 1];
    newTabs[index + 1] = newTabs[index];
    newTabs[index] = temp;
    updateVisibleTabs(newTabs);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      <div className="border-b border-line pb-6">
        <h2 className="text-[24px] md:text-[32px] font-bold font-serif text-text-main">组件显示控制与设置</h2>
        <p className="text-[12px] md:text-[14px] text-text-muted mt-2 tracking-wide text-left">自定义首页功能模块的可见状态及显示顺序。</p>
      </div>

      <div className="bg-card p-6 md:p-8 rounded-card shadow-theme border border-line">
        <h3 className="text-[18px] font-bold font-serif text-text-main mb-6">模块管理</h3>
        
        <div className="space-y-4">
          {allOrderedTabs.map(tab => {
            const isVisible = visibleTabs.includes(tab.id);
            const visibleIndex = visibleTabs.indexOf(tab.id);
            const Icon = tab.icon;
            
            return (
              <div 
                key={tab.id} 
                className={`flex items-center justify-between p-4 rounded-[16px] border transition-all ${isVisible ? 'border-sage bg-sage/5' : 'border-line bg-[#FAF8F6] opacity-70 hover:opacity-100'}`}
              >
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => handleToggle(tab.id)}>
                  <div className={`p-2 rounded-[12px] ${isVisible ? 'bg-white shadow-sm' : 'bg-transparent text-text-muted'}`}>
                    <Icon size={20} className={isVisible ? 'text-sage' : ''} />
                  </div>
                  <span className={`text-[16px] font-medium ${isVisible ? 'text-text-main' : 'text-text-muted'}`}>
                    {tab.label}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {isVisible && (
                    <div className="flex items-center gap-1 mr-4 border-r border-line pr-4">
                      <button 
                        onClick={() => moveUp(visibleIndex)} 
                        disabled={visibleIndex === 0}
                        className="p-1 text-text-muted hover:text-sage disabled:opacity-30 transition-colors"
                      >
                         <ArrowUp size={18} />
                      </button>
                      <button 
                        onClick={() => moveDown(visibleIndex)} 
                        disabled={visibleIndex === visibleTabs.length - 1}
                        className="p-1 text-text-muted hover:text-sage disabled:opacity-30 transition-colors"
                      >
                         <ArrowDown size={18} />
                      </button>
                    </div>
                  )}

                  <div className="text-sage cursor-pointer" onClick={() => handleToggle(tab.id)}>
                    {isVisible ? <CheckSquare size={24} /> : <Square size={24} className="text-text-muted" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[13px] text-text-muted mt-8 italic border-t border-line border-dashed pt-6 text-center">
          这些设置会自动保存在您的本地浏览器缓存中。
        </p>
      </div>
    </div>
  );
}
