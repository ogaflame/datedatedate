import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Pill,
  Timer,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ja } from 'date-fns/locale';

type DosageTiming = '朝' | '昼' | '夕' | '寝る前';
type Theme = 'clear' | 'clinical' | 'playful';

interface UsagePattern {
  id: string;
  label: string;
  timings: DosageTiming[];
}

const USAGE_PATTERNS: UsagePattern[] = [
  { id: '3x-mld', label: '1日3回（朝・昼・夕）', timings: ['朝', '昼', '夕'] },
  { id: '2x-me', label: '1日2回（朝・夕）', timings: ['朝', '夕'] },
  { id: '1x-m', label: '1日1回（朝）', timings: ['朝'] },
  { id: '1x-l', label: '1日1回（昼）', timings: ['昼'] },
  { id: '1x-e', label: '1日1回（夕）', timings: ['夕'] },
  { id: '1x-b', label: '1日1回（寝る前）', timings: ['寝る前'] },
];

const THEME_OPTIONS: Array<{ id: Theme; label: string; description: string }> = [
  { id: 'clear', label: 'CLEAR', description: '文字が見やすい' },
  { id: 'clinical', label: 'CLINICAL', description: '精密・端正' },
  { id: 'playful', label: 'PLAYFUL', description: '軽やか・楽しい' },
];

function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function MedicationCalculator() {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTiming, setStartTiming] = useState<DosageTiming>('朝');
  const [days, setDays] = useState(3);
  const [patternId, setPatternId] = useState('3x-mld');

  const pattern = useMemo(
    () => USAGE_PATTERNS.find((item) => item.id === patternId) ?? USAGE_PATTERNS[0],
    [patternId],
  );

  useEffect(() => {
    if (!pattern.timings.includes(startTiming)) {
      setStartTiming(pattern.timings[0]);
    }
  }, [pattern, startTiming]);

  const result = useMemo(() => {
    const start = parseDateInput(startDate);
    const startIndex = pattern.timings.indexOf(startTiming);

    if (startIndex < 0) {
      return null;
    }

    const totalDoses = pattern.timings.length * days;
    const finalDoseIndex = startIndex + totalDoses - 1;
    const dateOffset = Math.floor(finalDoseIndex / pattern.timings.length);
    const finalTiming = pattern.timings[finalDoseIndex % pattern.timings.length];

    return {
      date: addDays(start, dateOffset),
      timing: finalTiming,
      totalDoses,
    };
  }, [days, pattern, startDate, startTiming]);

  return (
    <section className="calculator-grid" aria-label="服用期間計算">
      <div className="card settings-card">
        <div className="section-heading">
          <span className="section-icon" aria-hidden="true"><Pill size={18} /></span>
          <div>
            <p className="eyebrow">Prescription setup</p>
            <h2>服用設定</h2>
          </div>
        </div>

        <div className="field-stack">
          <label className="field-label" htmlFor="usage-pattern">用法パターン</label>
          <select
            id="usage-pattern"
            className="field-control"
            value={patternId}
            onChange={(event) => setPatternId(event.target.value)}
          >
            {USAGE_PATTERNS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </div>

        <div className="field-stack">
          <label className="field-label" htmlFor="start-date">開始日</label>
          <input
            id="start-date"
            className="field-control date-control"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="field-stack">
          <span className="field-label">開始タイミング</span>
          <div className="timing-options" role="group" aria-label="開始タイミング">
            {pattern.timings.map((timing) => (
              <button
                key={timing}
                type="button"
                className={`timing-button ${startTiming === timing ? 'is-selected' : ''}`}
                aria-pressed={startTiming === timing}
                onClick={() => setStartTiming(timing)}
              >
                {timing}から
              </button>
            ))}
          </div>
        </div>

        <div className="field-stack days-stack">
          <div className="days-label-row">
            <span className="field-label">処方日数</span>
            <output className="days-output" aria-live="polite">
              {days}<span>日間</span>
            </output>
          </div>
          <input
            className="days-slider"
            type="range"
            min="1"
            max="60"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            aria-label="処方日数"
          />
          <div className="range-scale" aria-hidden="true">
            <span>1日</span><span>15日</span><span>30日</span><span>45日</span><span>60日</span>
          </div>
        </div>
      </div>

      <div className="result-column">
        <motion.section
          key={result ? `${result.date.toISOString()}-${result.timing}` : 'empty'}
          className="card result-card"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.22 }}
          aria-live="polite"
        >
          <div className="result-icon" aria-hidden="true"><Timer size={32} /></div>
          <p className="eyebrow">Medication end</p>
          <h2 className="result-heading">服用終了予定</h2>

          {result ? (
            <>
              <div className="result-date">
                <time dateTime={format(result.date, 'yyyy-MM-dd')}>{format(result.date, 'M月d日')}</time>
                <span>{result.timing}</span>
              </div>
              <div className="result-weekday">
                {format(result.date, 'EEEE', { locale: ja })}
              </div>
              <p className="result-meta">{format(result.date, 'yyyy年')}まで ・ 合計 {result.totalDoses} 回の服用</p>
            </>
          ) : (
            <p className="result-meta">設定を入力してください。</p>
          )}
        </motion.section>

        <aside className="summary-card" aria-label="計算結果の要約">
          <div className="summary-topline"><Clock3 size={16} /> 計算結果</div>
          {result && (
            <p>
              <strong>{format(parseDateInput(startDate), 'M月d日')} {startTiming}</strong> から開始すると、
              <strong>{format(result.date, 'M月d日（EEEE）', { locale: ja })} {result.timing}</strong> で終了します。
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function MiniCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <section className="calendar-card card" aria-label="月間カレンダー">
      <div className="calendar-toolbar">
        <div>
          <p className="eyebrow">Calendar preview</p>
          <h2>{format(currentMonth, 'yyyy年 M月')}</h2>
        </div>
        <div className="calendar-actions">
          <button type="button" className="icon-button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} aria-label="前月">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className="today-button" onClick={() => setCurrentMonth(new Date())}>今日</button>
          <button type="button" className="icon-button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label="翌月">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="calendar-grid" role="grid" aria-label={format(currentMonth, 'yyyy年M月')}>
        {weekdays.map((day) => <div className="weekday" role="columnheader" key={day}>{day}</div>)}
        {days.map((day) => {
          const isToday = isSameDay(day, new Date());
          const otherMonth = !isSameMonth(day, monthStart);
          return (
            <div
              className={`calendar-day ${isToday ? 'is-today' : ''} ${otherMonth ? 'is-other-month' : ''}`}
              role="gridcell"
              aria-current={isToday ? 'date' : undefined}
              key={day.toISOString()}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HeroSidebar() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const era = now.getFullYear() >= 2019
    ? `令和 ${now.getFullYear() - 2018}年`
    : `平成 ${now.getFullYear() - 1988}年`;

  return (
    <aside className="sidebar">
      <div>
        <div className="era-badge">{era}</div>
        <p className="sidebar-month">{format(now, 'yyyy年 M月')}</p>
        <p className="sidebar-day">{format(now, 'dd')}</p>
        <p className="sidebar-weekday">{format(now, 'EEEE', { locale: ja })}</p>

        <div className="sidebar-info">
          <div className="info-card">
            <span>STATUS</span>
            <strong><i className="status-dot" />システム同期完了</strong>
          </div>
          <div className="info-card">
            <span>LOCATION</span>
            <strong>東京 ・ JST（UTC{format(now, 'O')}）</strong>
          </div>
        </div>
      </div>

      <p className="sidebar-footer">LAST SYNC&nbsp;&nbsp;{format(now, 'HH:mm:ss')}<br />CHRONOS MEDICATION UTILITY</p>
    </aside>
  );
}

export default function App() {
  const [theme, setTheme] = useState<Theme>('clear');

  return (
    <div className="app-shell" data-theme={theme}>
      <HeroSidebar />

      <div className="main-panel">
        <header className="app-header">
          <div>
            <p className="eyebrow">Chronos medication utility</p>
            <h1><CalendarDays size={29} aria-hidden="true" />いつ飲み始めるといつまでになるか知りたい</h1>
            <p className="header-description">往診時によく困る、臨時処方をいつまでつなげばいいのかを確認できます。</p>
          </div>

          <div className="theme-switch" role="group" aria-label="デザインテーマ">
            {THEME_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.id}
                className={`theme-choice ${theme === option.id ? 'is-active' : ''}`}
                onClick={() => setTheme(option.id)}
                aria-pressed={theme === option.id}
              >
                <span>{option.label}</span>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
        </header>

        <main className="content">
          <MedicationCalculator />

          <section className="calendar-section">
            <div className="calendar-section-heading">
              <div>
                <p className="eyebrow">Monthly overview</p>
                <h2>カレンダープレビュー</h2>
              </div>
              <p>今日の日付を強調表示しています</p>
            </div>
            <MiniCalendar />
          </section>
        </main>

        <footer className="app-footer">
          <span>© 2026 ・ CHRONOS MEDICATION UTILITY</span>
          <span>服用内容は、必ず医師・薬剤師からの指示を優先してください。</span>
        </footer>
      </div>
    </div>
  );
}
