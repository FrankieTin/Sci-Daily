import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, ActiveStudySession, ThemeType, Paper, JournalEntry, SleepRecord, FocusRecord, StudySession, ResearchPlan, FitnessRecord, Achievement } from './types';
import { useAuth } from './lib/AuthContext';
import { format } from 'date-fns';

interface AppContextType {
  state: AppState;
  updateVisibleTabs: (tabs: string[]) => void;
  updateTheme: (theme: ThemeType) => void;
  setActiveSession: (session: ActiveStudySession | null) => void;
  addStudySession: (s: Omit<StudySession, 'id'>) => void;
  updateStudySession: (id: string, updates: Partial<StudySession>) => void;
  deleteStudySession: (id: string) => void;
  addPaper: (p: Omit<Paper, 'id' | 'submissions'>) => void;
  updatePaper: (id: string, updates: Partial<Paper>) => void;
  deletePaper: (id: string) => void;
  addJournal: (j: Omit<JournalEntry, 'id' | 'timestamp' | 'date'>) => void;
  updateJournal: (id: string, updates: Partial<JournalEntry>) => void;
  addSleepRecord: (s: Omit<SleepRecord, 'id' | 'timestamp'>) => void;
  updateSleepRecord: (id: string, updates: Partial<SleepRecord>) => void;
  deleteSleepRecord: (id: string) => void;
  addFocusRecord: (f: Omit<FocusRecord, 'id' | 'timestamp'>) => void;
  updateFocusRecord: (id: string, updates: Partial<FocusRecord>) => void;
  deleteFocusRecord: (id: string) => void;
  addResearchPlan: (r: Omit<ResearchPlan, 'id' | 'timestamp' | 'completed'>) => void;
  toggleResearchPlan: (id: string) => void;
  deleteResearchPlan: (id: string) => void;
  addFitnessRecord: (f: Omit<FitnessRecord, 'id' | 'timestamp'>) => void;
  deleteFitnessRecord: (id: string) => void;
  addAchievement: (a: Omit<Achievement, 'id' | 'timestamp'>) => void;
  updateAchievement: (id: string, updates: Partial<Achievement>) => void;
  deleteAchievement: (id: string) => void;
}

export const DEFAULT_TAB_ORDER = ['time', 'plan', 'paper', 'journal', 'fitness', 'achievements', 'user'];

const defaultState: AppState = {
  visibleTabs: DEFAULT_TAB_ORDER,
  theme: 'dustblue',
  papers: [],
  journals: [],
  sleepRecords: [],
  focusRecords: [],
  studySessions: [],
  activeSession: null,
  researchPlans: [],
  fitnessRecords: [],
  achievements: []
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(defaultState);

  const storageKey = user ? `app_data_${user.uid}` : 'app_data_guest';

  useEffect(() => {
    const rawData = localStorage.getItem(storageKey);
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        const merged = { ...defaultState, ...parsed };
        setState(merged);
        if (merged.theme) document.documentElement.setAttribute('data-theme', merged.theme);
      } catch(e) {
        console.error(e);
        setState(defaultState);
      }
    } else {
      document.documentElement.setAttribute('data-theme', 'dustblue');
      setState(defaultState);
    }
  }, [storageKey, user]);

  const setAndSaveState = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const updateRoot = (updates: Partial<AppState>) => setAndSaveState(p => ({ ...p, ...updates }));

  const updateVisibleTabs = (tabs: string[]) => updateRoot({ visibleTabs: tabs });
  
  const updateTheme = (theme: ThemeType) => {
    document.documentElement.setAttribute('data-theme', theme);
    updateRoot({ theme });
  };

  const setActiveSession = (session: ActiveStudySession | null) => updateRoot({ activeSession: session });

  const addDocInCol = (colName: keyof AppState, item: any) => {
    setAndSaveState(p => ({ ...p, [colName]: [item, ...(p[colName] as any[])] }));
  };
  
  const updateDocInCol = (colName: keyof AppState, id: string, updates: any) => {
    setAndSaveState(p => ({
      ...p,
      [colName]: (p[colName] as any[]).map(x => x.id === id ? { ...x, ...updates } : x)
    }));
  };
  
  const delDocInCol = (colName: keyof AppState, id: string) => {
    setAndSaveState(p => ({
      ...p,
      [colName]: (p[colName] as any[]).filter(x => x.id !== id)
    }));
  };

  return (
    <AppContext.Provider value={{
      state, updateVisibleTabs, updateTheme,
      setActiveSession,
      addStudySession: (s) => addDocInCol('studySessions', { ...s, id: uuidv4() }),
      updateStudySession: (id, updates) => updateDocInCol('studySessions', id, updates),
      deleteStudySession: (id) => delDocInCol('studySessions', id),
      addPaper: (p) => addDocInCol('papers', { ...p, id: uuidv4(), submissions: [] }),
      updatePaper: (id, updates) => updateDocInCol('papers', id, updates),
      deletePaper: (id) => delDocInCol('papers', id),
      addJournal: (j) => {
        const now = new Date();
        addDocInCol('journals', { ...j, id: uuidv4(), timestamp: now.getTime(), date: format(now, 'yyyy-MM-dd') });
      },
      updateJournal: (id, updates) => updateDocInCol('journals', id, updates),
      addSleepRecord: (s) => addDocInCol('sleepRecords', { ...s, id: uuidv4(), timestamp: Date.now() }),
      updateSleepRecord: (id, updates) => updateDocInCol('sleepRecords', id, updates),
      deleteSleepRecord: (id) => delDocInCol('sleepRecords', id),
      addFocusRecord: (f) => addDocInCol('focusRecords', { ...f, id: uuidv4(), timestamp: Date.now() }),
      updateFocusRecord: (id, updates) => updateDocInCol('focusRecords', id, updates),
      deleteFocusRecord: (id) => delDocInCol('focusRecords', id),
      addResearchPlan: (r) => addDocInCol('researchPlans', { ...r, id: uuidv4(), timestamp: Date.now(), completed: false }),
      toggleResearchPlan: (id) => {
        const p = state.researchPlans.find(x => x.id === id);
        if (p) updateDocInCol('researchPlans', id, { completed: !p.completed });
      },
      deleteResearchPlan: (id) => delDocInCol('researchPlans', id),
      addFitnessRecord: (f) => addDocInCol('fitnessRecords', { ...f, id: uuidv4(), timestamp: Date.now() }),
      deleteFitnessRecord: (id) => delDocInCol('fitnessRecords', id),
      addAchievement: (a) => addDocInCol('achievements', { ...a, id: uuidv4(), timestamp: Date.now() }),
      updateAchievement: (id, updates) => updateDocInCol('achievements', id, updates),
      deleteAchievement: (id) => delDocInCol('achievements', id)
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext error');
  return context;
}
