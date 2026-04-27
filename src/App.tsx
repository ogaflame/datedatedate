import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Clock as ClockIcon, 
  ChevronLeft,
  ChevronRight,
  Pill,
  Calendar as CalendarIcon,
  Timer
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays,
} from 'date-fns';
import { ja } from 'date-fns/locale';

// --- Types ---

type DosageTiming = '朝' | '昼' | '夕' | '寝る前';
type Theme = 'professional' | 'clinical' | 'wellness';

interface UsagePattern {
  id: string;
  label: string;
  timings: DosageTiming[];
}

const USAGE_PATTERNS: UsagePattern[] = [
  { id: '3x-mld', label: '1日3回 (朝・昼・夕)', timings: ['朝', '昼', '夕'] },
  { id: '2x-me', label: '1日2回 (朝・夕)', timings: ['朝', '夕'] },
  { id: '1x-m', label: '1日1回 (朝)', timings: ['朝'] },
  { id: '1x-l', label: '1日1回 (昼)', timings: ['昼'] },
  { id: '1x-e', label: '1日1回 (夕)', timings: ['夕'] },
  { id: '1x-b', label: '1日1回 (寝る前)', timings: ['寝る前'] },
];

// --- Components ---

function MedicationCalculator({ theme }: { theme: Theme }) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTiming, setStartTiming] = useState<DosageTiming>('朝');
  const [days, setDays] = useState(3);
  const [patternId, setPatternId] = useState('3x-mld');

  const pattern = useMemo(() => 
    USAGE_PATTERNS.find(p => p.id === patternId) || USAGE_PATTERNS[0], 
  [patternId]);

  // If the current startTiming is not in the new pattern, reset it to the first available timing in that pattern
  useEffect(() => {
    if (!pattern.timings.includes(startTiming)) {
      setStartTiming(pattern.timings[0]);
    }
  }, [pattern, startTiming]);

  const result = useMemo(() => {
    const sDate = new Date(startDate);
    const timings = pattern.timings;
    const startIndex = timings.indexOf(startTiming);
    
    if (startIndex === -1) return null;

    const totalDoses = timings.length * days;
    const totalIndex = startIndex + totalDoses - 1;
    
    // Calculate how many full days have passed
    const extraDays = Math.floor(totalIndex / timings.length);
    // Which timing in that final day
    const finalTimingIndex = totalIndex % timings.length;

    const endDate = addDays(sDate, extraDays);
    const endTiming = timings[finalTimingIndex];

    return {
      date: endDate,
      timing: endTiming,
      totalDoses
    };
  }, [startDate, startTiming, days, pattern]);

  const accentColor = theme === 'clinical' ? 'text-[#141414]' : theme === 'wellness' ? 'text-[#5A5A40]' : 'text-indigo-600';
  const buttonActive = theme === 'clinical' ? 'bg-[#141414] text-white shadow-none' : theme === 'wellness' ? 'bg-[#5A5A40] text-white shadow-sm' : 'bg-indigo-600 text-white shadow-md';
  const inputClass = theme === 'clinical' ? 'border-[#141414] rounded-none bg-transparent' : theme === 'wellness' ? 'border-[#DCDCC6] rounded-2xl bg-white focus:ring-[#5A5A40]' : 'border-gray-200 rounded-lg focus:ring-indigo-500';
  const cardClass = theme === 'clinical' 
    ? 'bg-transparent border border-[#141414] rounded-none' 
    : theme === 'wellness' 
      ? 'bg-[#FFFFFF] border border-[#DCDCC6] rounded-[32px] shadow-sm' 
      : 'stat-card';

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className={cardClass}>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 ${accentColor}`}>
              <Pill size={14} /> 服用設定
            </h3>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold opacity-40">用法パターン</label>
                <select 
                  value={patternId}
                  onChange={(e) => setPatternId(e.target.value)}
                  className={`w-full p-3 border outline-none transition-all text-sm font-medium ${inputClass}`}
                >
                  {USAGE_PATTERNS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold opacity-40">開始日</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full p-3 border outline-none transition-all text-sm font-mono ${inputClass}`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold opacity-40">開始タイミング</label>
                <div className="flex flex-wrap gap-2">
                  {pattern.timings.map(t => (
                    <button
                      key={t}
                      onClick={() => setStartTiming(t)}
                      className={`px-4 py-2 text-sm font-medium transition-all ${theme === 'wellness' ? 'rounded-2xl' : 'rounded-lg'} ${
                        startTiming === t 
                          ? buttonActive 
                          : 'bg-gray-100/50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {t}から
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] uppercase font-bold opacity-40">処方日数</label>
                  <div className={`text-6xl font-display font-black leading-none ${accentColor} ${theme === "clinical" ? "font-mono" : ""}`}>
                    {days}<span className="text-sm ml-1 opacity-60 font-sans">日間</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className={`w-full h-2 rounded-lg cursor-pointer appearance-none ${theme === 'clinical' ? 'accent-[#141414] bg-gray-300' : theme === 'wellness' ? 'accent-[#5A5A40] bg-[#DCDCC6]' : 'accent-indigo-600 bg-gray-200'}`}
                />
                <div className="flex justify-between text-[10px] opacity-40 font-mono">
                  <span>1D</span>
                  <span>15D</span>
                  <span>30D</span>
                  <span>45D</span>
                  <span>60D</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="flex flex-col gap-6">
          <motion.div 
            key={result ? result.date.toString() + result.timing : 'empty'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${cardClass} flex-grow flex flex-col justify-center items-center text-center p-12 ${theme === 'clinical' ? 'border-dashed' : theme === 'wellness' ? '' : 'bg-indigo-50/30 border-dashed border-indigo-200'}`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-sm border ${theme === 'clinical' ? 'border-[#141414] bg-transparent' : theme === 'wellness' ? 'bg-[#5A5A40] text-white' : 'bg-white border-indigo-100'}`}>
              <Timer className={theme === 'wellness' ? 'text-white' : accentColor} size={32} />
            </div>
            {result ? (
              <>
                <span className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${accentColor} opacity-70`}>服用終了予定</span>
                <div className={`text-5xl font-display font-black mb-1 ${theme === "clinical" ? "font-mono" : ""}`}>
                  {format(result.date, "MM/dd")}
                  <span className={`text-2xl ml-3 ${accentColor}`}>{result.timing}</span>
                </div>
                
                <div className="flex items-center justify-center gap-3 mt-4 mb-2">
                  <div className={`px-5 py-2 rounded-xl text-xl font-black shadow-lg ${theme === "clinical" ? "bg-[#141414] text-white rounded-none" : theme === "wellness" ? "bg-[#5A5A40] text-white rounded-[16px]" : "bg-indigo-600 text-white"}`}>
                    {format(result.date, "EEEE", { locale: ja })}
                  </div>
                  <div className="text-xs opacity-50 text-left font-bold uppercase tracking-widest">
                    {format(result.date, "yyyy年")} <br/> まで
                  </div>
                </div>
                <div className={`mt-8 px-6 py-2 text-xs font-bold rounded-full uppercase tracking-widest ${theme === 'clinical' ? 'border border-[#141414] text-[#141414]' : theme === 'wellness' ? 'bg-[#5A5A40] text-white' : 'bg-indigo-600 text-white'}`}>
                  合計 {result.totalDoses} 回の服用
                </div>
              </>
            ) : (
              <p className="opacity-40 italic">設定を入力してください</p>
            )}
          </motion.div>

          <div className={`p-8 border-none ${theme === 'clinical' ? 'bg-transparent border border-[#141414] rounded-none' : theme === 'wellness' ? 'bg-[#5A5A40] text-white rounded-[32px]' : 'stat-card bg-[#111827] text-white p-8'}`}>
            <h4 className={`text-[10px] uppercase tracking-widest mb-2 ${theme === 'clinical' ? 'text-[#141414]' : 'text-gray-400'}`}>Calculator Summary</h4>
            <div className={`text-sm leading-relaxed ${theme === 'clinical' ? 'text-[#141414]' : 'text-gray-300'}`}>
              {format(new Date(startDate), 'M/d')} <span className="font-bold">{startTiming}</span> から開始し、
              {days}日分の薬を服用すると、
              <span className={`font-bold inline-flex items-center gap-1 ${theme === 'wellness' ? 'text-white' : 'text-white bg-indigo-600 px-2 rounded-sm'}`}>
                {result && format(result.date, "M/d")} ({result && format(result.date, "EEEE", { locale: ja })}) {result?.timing}
              </span> で終了します。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCalendar({ theme }: { theme: Theme }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const containerClass = theme === 'clinical' 
    ? 'bg-transparent border border-[#141414] rounded-none p-12' 
    : theme === 'wellness' 
      ? 'bg-[#FFFFFF] border border-[#DCDCC6] rounded-[32px] p-12 shadow-sm' 
      : 'bg-white rounded-2xl border border-gray-200 p-8 shadow-sm';

  const accentBg = theme === 'clinical' ? 'bg-[#141414]' : theme === 'wellness' ? 'bg-[#5A5A40]' : 'bg-indigo-600';

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center mb-8">
        <h2 className={`text-xl font-bold ${theme === 'clinical' ? 'font-mono' : ''}`}>{format(currentMonth, 'yyyy年 MM月')}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className={`p-2 transition-colors ${theme === 'clinical' ? 'hover:bg-black hover:text-white border border-[#141414]' : 'hover:bg-gray-100 rounded-lg'}`}><ChevronLeft size={18} /></button>
          <button onClick={() => setCurrentMonth(new Date())} className={`px-3 py-1 text-white text-[10px] font-bold rounded-md uppercase ${accentBg}`}>Today</button>
          <button onClick={nextMonth} className={`p-2 transition-colors ${theme === 'clinical' ? 'hover:bg-black hover:text-white border border-[#141414]' : 'hover:bg-gray-100 rounded-lg'}`}><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className={`calendar-day header ${theme === 'clinical' ? 'text-[#141414] opacity-40 font-mono' : ''}`}>
            {day}
          </div>
        ))}
        {calendarDays.map(day => (
          <div 
            key={day.toString()} 
            className={`calendar-day ${!isSameMonth(day, monthStart) ? 'text-gray-200 opacity-30' : ''} ${isSameDay(day, new Date()) ? 'active' : ''} ${theme === 'clinical' ? 'rounded-none' : ''} ${theme === 'wellness' ? 'rounded-full' : ''}`}
            style={isSameDay(day, new Date()) ? { backgroundColor: theme === 'clinical' ? '#141414' : theme === 'wellness' ? '#5A5A40' : undefined } : {}}
          >
            {format(day, 'd')}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Sidebar Content ---

function HeroSidebar({ theme }: { theme: Theme }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cardClass = theme === 'clinical' 
    ? 'bg-transparent border border-[#141414] rounded-none' 
    : theme === 'wellness' 
      ? 'bg-[#FFFFFF] border border-[#DCDCC6] rounded-[32px] shadow-sm' 
      : 'stat-card';

  const bigDateClass = theme === 'clinical'
    ? 'text-[120px] font-mono leading-none tracking-tighter text-[#141414]'
    : theme === 'wellness'
      ? 'text-[120px] font-serif italic leading-none tracking-tighter text-[#5A5A40]'
      : 'big-date';

  return (
    <aside className={`sidebar transition-colors duration-500 ${theme === 'clinical' ? 'bg-[#E4E3E0] border-r border-[#141414]' : theme === 'wellness' ? 'bg-[#f5f5f0] border-r border-[#DCDCC6]' : 'bg-white'}`}>
      <div>
        <div className={theme === 'wellness' ? 'inline-block px-3 py-1 bg-[#5A5A40] text-white rounded-full font-semibold text-sm mb-4' : 'era-badge'}>
          {now.getFullYear() >= 2019 ? `令和 ${now.getFullYear() - 2018}年` : `平成 ${now.getFullYear() - 1988}年`}
        </div>
        <div className="text-sm opacity-40 font-medium mb-1">
          {format(now, 'yyyy年 MM月')}
        </div>
        <div className={bigDateClass}>{format(now, 'dd')}</div>
        <div className="text-2xl font-bold mt-2 opacity-90">
          {format(now, 'EEEE', { locale: ja })}
        </div>
        <div className="mt-8 space-y-4">
          <div className={cardClass}>
            <div className="text-xs opacity-40 uppercase font-bold tracking-wider mb-1">Status</div>
            <div className="text-sm font-medium opacity-80 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${theme === 'clinical' ? 'bg-[#141414]' : 'bg-green-500'}`} />
              システム同期完了
            </div>
          </div>
          <div className={cardClass}>
            <div className="text-xs opacity-40 uppercase font-bold tracking-wider mb-1">Location</div>
            <div className="text-sm font-medium opacity-80">
              UTC {format(now, 'O')} 東京, 日本
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-xs opacity-30 leading-relaxed font-mono">
        Last sync: {format(now, 'HH:mm:ss')} JST<br />
        Chronos Management Utility
      </div>
    </aside>
  );
}

// --- Application Root ---

/**
 * Main application component that orchestrates the medication calculation logic,
 * theme management, and layout structure.
 */
export default function App() {
  const [theme, setTheme] = useState<Theme>('professional');

  const themeClasses = {
    professional: 'bg-[#F3F4F6] text-[#111827]',
    clinical: 'bg-[#E4E3E0] text-[#141414] font-mono',
    wellness: 'bg-[#f5f5f0] text-[#5A5A40] font-serif',
  };

  return (
    <div className={`app-container transition-colors duration-500 ${themeClasses[theme]}`}>
      <HeroSidebar theme={theme} />

      <div className="flex flex-col flex-grow overflow-y-auto">
        {/* Main Content Header */}
        <header className={`p-6 md:p-10 pb-4 sticky top-0 z-50 transition-colors duration-500 ${theme === 'clinical' ? 'bg-[#E4E3E0] border-b border-[#141414]' : theme === 'wellness' ? 'bg-[#f5f5f0] border-b border-[#DCDCC6]' : 'bg-white border-b border-gray-100'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                <CalendarIcon className={theme === 'clinical' ? 'text-[#141414]' : theme === 'wellness' ? 'text-[#5A5A40]' : 'text-indigo-600'} size={28} />
                服用期間・日付確認
              </h1>
              <p className="opacity-60 mt-1 text-sm md:text-base">用法に基づいた正確な服用終了タイミングを確認します</p>
            </div>
            
            <div className="flex gap-2 p-1 bg-gray-200/50 rounded-lg w-full md:w-auto overflow-x-auto">
              {(['professional', 'clinical', 'wellness'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 md:flex-none px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all whitespace-nowrap ${
                    theme === t 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-10 space-y-12">
          {/* Calculator Section */}
          <MedicationCalculator theme={theme} />

          {/* Calendar Section */}
          <div className={`pt-8 border-t ${theme === 'clinical' ? 'border-[#141414]' : theme === 'wellness' ? 'border-[#DCDCC6]' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">カレンダープレビュー</h2>
              <div className="flex gap-4 text-xs font-bold opacity-40 uppercase tracking-widest">
                <span className={theme === 'wellness' ? 'text-[#5A5A40] border-b-2 border-[#5A5A40]' : 'text-indigo-600 border-b-2 border-indigo-600'}>月表示</span>
                <span>週表示</span>
                <span>祝日一覧</span>
              </div>
            </div>
            <MiniCalendar theme={theme} />
          </div>
        </main>

        <footer className={`mt-auto p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'clinical' ? 'bg-[#E4E3E0] text-[#141414] border-t border-[#141414]' : theme === 'wellness' ? 'bg-[#f5f5f0] text-[#5A5A40] border-t border-[#DCDCC6]' : 'bg-white border-t border-gray-100 text-gray-400'}`}>
          <span className="text-center md:text-left">&copy; 2026 ・ Chronos Medication Utility</span>
          <div className="flex gap-6 justify-center">
            <a href="#" className={`transition-colors ${theme === 'wellness' ? 'hover:text-[#5A5A40]' : 'hover:text-indigo-600'}`}>利用規約</a>
            <a href="#" className={`transition-colors ${theme === 'wellness' ? 'hover:text-[#5A5A40]' : 'hover:text-indigo-600'}`}>プライバシー</a>
            <a href="#" className={`transition-colors ${theme === 'wellness' ? 'hover:text-[#5A5A40]' : 'hover:text-indigo-600'}`}>お問い合わせ</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
