export type PaperStatus = '规划中' | '撰写中' | '准备投稿' | '已投出' | '审稿中' | '大修' | '小修' | '已录用' | '被拒稿';

export interface PaperSubmission {
  id: string;
  venue: string;
  submitDate: string;
  status: PaperStatus;
  note: string;
  underReviewDate?: string;
  revisionDate?: string;
}

export interface Paper {
  id: string;
  title: string;
  description: string;
  targetVenue: string; // The tentative one
  status: PaperStatus;
  progress: number;
  deadlineString: string | null;
  submissions: PaperSubmission[];
  publishDate?: string; // Final publication date
  publishStatusNote?: string; // E.g. "Early Access", "In Press"
  customFields?: Record<string, string>; // User defined additional fields
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  content: string;
  mood: '灵感涌现' | '效率很高' | '平淡' | '压力大' | '精疲力尽';
}

export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  sleepStart?: string; // HH:mm
  wakeUp?: string; // HH:mm
  napMinutes?: number;
}

export interface FocusRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  type: '学习' | '娱乐';
  minutes: number;
}

export interface StudySession {
  id: string;
  date: string;
  startTime: number;
  endTime: number;
  netStudyMinutes: number;
  category?: string;
  content: string;
}

export interface ActiveStudySession {
  startTime: number;
  status: 'study' | 'rest';
  restStartTime: number | null;
  totalRestMs: number;
}

export interface ResearchPlan {
  id: string;
  timestamp: number;
  type: 'daily' | 'phase';
  title: string;
  description: string;
  deadlineString: string;
  completed: boolean;
}

export type FitnessCategory = 'Cardio' | 'Strength';
export type CardioType = '跑步机 (跑步)' | '跑步机 (爬坡)' | '爬楼机' | '跑步' | '跳绳' | '其他';
export type StrengthBodyPart = '胸部' | '背部' | '腿部' | '肩部' | '手臂' | '核心';

export interface FitnessRecord {
  id: string;
  loggedDate: string; 
  timestamp: number;
  category: FitnessCategory;
  cardioType?: CardioType;
  strengthPart?: StrengthBodyPart;
  exerciseName?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  sets?: number;
  reps?: number;
  durationMinutes?: number;
  incline?: number;
  otherNote?: string;
}

export type AchievementCategory = '已发论文' | '落地项目' | '健身突破' | '其他';

export interface Achievement {
  id: string;
  timestamp: number;
  dateString: string;
  title: string;
  description: string;
  category: AchievementCategory;
  otherNote?: string;
  reflection?: string; // 心路历程
}

export type ThemeType = 
  | 'sage' | 'terracotta' | 'dustblue' | 'mauve' | 'warmgrey' | 'matcha' | 'mistyrose' | 'slate' | 'caramel'
  | 'pure' | 'charcoal' | 'linen' | 'nordic'
  | 'ivory' | 'ebony' | 'clay' | 'stone' | 'mousse'; // Extended Minimalist themes

export interface AppState {
  visibleTabs: string[];
  theme: ThemeType;
  papers: Paper[];
  journals: JournalEntry[];
  sleepRecords: SleepRecord[];
  focusRecords: FocusRecord[];
  studySessions: StudySession[];
  activeSession: ActiveStudySession | null;
  researchPlans: ResearchPlan[];
  fitnessRecords: FitnessRecord[];
  achievements: Achievement[];
}
