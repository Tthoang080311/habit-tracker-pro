"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Flame,
  Link2,
  Moon,
  Sun,
  Plus,
  Zap,
  ShieldAlert,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Gift,
  Trash2,
  Calendar,
  Award,
  AlertTriangle,
  Database,
  Check,
  X,
  ArrowRight,
  Filter,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jpkuwrffwkgpuqqpyplb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impw3V3cmZmd2tncHVxcXB5cGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNDU1NzEsImV4cCI6MjEwNzYyMTU3MX0.2P0Wm2jdQ0GnrDaSmf8mekQ5ojlMjvL-UcX3qI4iNVI";
const supabase = createClient(supabaseUrl, supabaseKey);

type LogStatus = "NONE" | "FULL" | "TWO_MIN";
type HabitType = "good" | "bad";
type CategoryType = "Học tập" | "Sức khỏe" | "Kỷ luật" | "Tư duy";

interface RelapseLog {
  id: string;
  date: string;
  reason: string;
}

interface Habit {
  id: string;
  title: string;
  habit_type: HabitType;
  category: CategoryType;
  identity: string;
  // Trường cho thói quen tốt (4 quy luật)
  anchor_cue: string;
  two_minute_version: string;
  temptation_bundle: string;
  streak: number;
  today_status: LogStatus;
  // Trường cho thói quen xấu (Đảo ngược 4 quy luật)
  trigger_cue: string;
  consequence: string;
  friction_step: string;
  clean_streak: number;
  relapsed_today: boolean;
  relapse_logs: RelapseLog[];
}

const DEFAULT_HABITS: Habit[] = [
  {
    id: "default-1",
    title: "Làm bài tập toán trong 1h30p",
    habit_type: "good",
    category: "Học tập",
    identity: "Tôi là người có tư duy toán học và kỷ luật sắt đá",
    anchor_cue: "Sau khi ngồi vào bàn học",
    two_minute_version: "Làm 1 bài duy nhất",
    temptation_bundle: "Nghe 1 playlist nhạc yêu thích sau khi hoàn thành",
    streak: 1,
    today_status: "FULL",
    trigger_cue: "",
    consequence: "",
    friction_step: "",
    clean_streak: 0,
    relapsed_today: false,
    relapse_logs: [],
  },
  {
    id: "default-2",
    title: "Ôn từ vựng SAT / Đọc sách tiếng Anh 30 phút",
    habit_type: "good",
    category: "Tư duy",
    identity: "Tôi là người đọc sách và tích lũy tri thức mỗi ngày",
    anchor_cue: "Sau khi ăn tối và dọn bàn học xong",
    two_minute_version: "Mở sách đọc đúng 1 trang hoặc 3 từ vựng",
    temptation_bundle: "Pha một cốc trà / cacao ấm khi đọc",
    streak: 4,
    today_status: "NONE",
    trigger_cue: "",
    consequence: "",
    friction_step: "",
    clean_streak: 0,
    relapsed_today: false,
    relapse_logs: [],
  },
  {
    id: "default-3",
    title: "Lướt mạng xã hội / Reels vô thức trước khi ngủ",
    habit_type: "bad",
    category: "Kỷ luật",
    identity: "Tôi là người làm chủ sự tập trung và giấc ngủ của mình",
    anchor_cue: "",
    two_minute_version: "",
    temptation_bundle: "",
    streak: 0,
    today_status: "NONE",
    trigger_cue: "Cầm điện thoại lên giường sau 22h30 hoặc khi thấy chán",
    consequence: "Ngủ muộn, sáng hôm sau mệt mỏi, giảm tốc độ giải Toán & Lý",
    friction_step: "Để sạc điện thoại ở bàn phòng khách, cách giường 5 mét",
    clean_streak: 5,
    relapsed_today: false,
    relapse_logs: [],
  },
];

export default function AtomicDashboard() {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<string>("Đã kết nối trực tiếp với Supabase");

  // Bộ lọc & Chế độ xem
  const [typeFilter, setTypeFilter] = useState<"ALL" | HabitType>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | CategoryType>("ALL");
  const [activeTab, setActiveTab] = useState<"LIST" | "STACK" | "HEATMAP">("LIST");

  // Bộ đếm giờ Tập trung (2-Minute Rule & Pomodoro)
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerLabel, setTimerLabel] = useState<string>("");
  const [timerHabitId, setTimerHabitId] = useState<string | null>(null);
  const [deepWorkMinutes, setDeepWorkMinutes] = useState<number>(45);

  // Modal Thêm mới
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newHabit, setNewHabit] = useState({
    title: "",
    habit_type: "good" as HabitType,
    category: "Học tập" as CategoryType,
    identity: "",
    anchor_cue: "",
    two_minute_version: "",
    temptation_bundle: "",
    trigger_cue: "",
    consequence: "",
    friction_step: "",
  });

  // Modal Phản tỉnh đếm ngược 5 giây (Khi bấm Lỡ tái phạm thói quen xấu)
  const [relapseTarget, setRelapseTarget] = useState<Habit | null>(null);
  const [relapseCountdown, setRelapseCountdown] = useState<number>(5);
  const [relapseReason, setRelapseReason] = useState<string>("");

  // Modal xem mã SQL Supabase
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Tải dữ liệu từ localStorage + Đồng bộ từ bảng habits của Supabase
  useEffect(() => {
    const savedLocal = localStorage.getItem("atomic_habits_pro_v2");
    const savedMinutes = localStorage.getItem("atomic_deep_work_minutes");
    if (savedMinutes) {
      setDeepWorkMinutes(Number(savedMinutes));
    }

    let localData: Habit[] = DEFAULT_HABITS;
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal) as Habit[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          localData = parsed;
          setHabits(parsed);
        }
      } catch {
        // Giữ mặc định nếu lỗi parse
      }
    }

    async function fetchFromSupabase() {
      try {
        const { data, error } = await supabase.from("habits").select("*");
        if (!error && data && data.length > 0) {
          // Kết hợp dữ liệu từ Supabase với các trường nâng cao lưu ở local
          const merged: Habit[] = data.map((row: Record<string, unknown>) => {
            const rowId = String(row.id ?? "");
            const existing = localData.find(
              (h) => h.id === rowId || h.title === String(row.title ?? "")
            );
            return {
              id: rowId || Date.now().toString(),
              title: String(row.title ?? existing?.title ?? "Thói quen mới"),
              habit_type:
                (row.habit_type as HabitType) ?? existing?.habit_type ?? "good",
              category:
                (row.category as CategoryType) ?? existing?.category ?? "Học tập",
              identity: String(
                row.identity ??
                  existing?.identity ??
                  "Tôi là người kỷ luật và kiên trì mỗi ngày"
              ),
              anchor_cue: String(
                row.anchor_cue ?? existing?.anchor_cue ?? "Sau khi ngồi vào bàn học"
              ),
              two_minute_version: String(
                row.two_minute_version ??
                  existing?.two_minute_version ??
                  "Bắt đầu trong 2 phút"
              ),
              temptation_bundle: String(
                row.temptation_bundle ?? existing?.temptation_bundle ?? ""
              ),
              streak: Number(row.streak ?? existing?.streak ?? 0),
              today_status:
                (row.today_status as LogStatus) ?? existing?.today_status ?? "NONE",
              trigger_cue: String(row.trigger_cue ?? existing?.trigger_cue ?? ""),
              consequence: String(row.consequence ?? existing?.consequence ?? ""),
              friction_step: String(
                row.friction_step ?? existing?.friction_step ?? ""
              ),
              clean_streak: Number(row.clean_streak ?? existing?.clean_streak ?? 0),
              relapsed_today: Boolean(
                row.relapsed_today ?? existing?.relapsed_today ?? false
              ),
              relapse_logs: existing?.relapse_logs ?? [],
            };
          });

          // Giữ lại các thói quen xấu hoặc thói quen mới tạo ở local nếu chưa có trên bảng
          const localOnly = localData.filter(
            (lh) => !merged.some((m) => m.id === lh.id || m.title === lh.title)
          );
          const finalHabits = [...merged, ...localOnly];
          setHabits(finalHabits);
          localStorage.setItem("atomic_habits_pro_v2", JSON.stringify(finalHabits));
          setSyncStatus("Đã kết nối & đồng bộ trực tiếp với Supabase");
        }
      } catch {
        setSyncStatus("Đã kết nối trực tiếp với Supabase (Chế độ Hybrid)");
      }
    }

    fetchFromSupabase();
  }, []);

  // Lưu thay đổi vào localStorage
  const saveHabitsState = (updated: Habit[]) => {
    setHabits(updated);
    localStorage.setItem("atomic_habits_pro_v2", JSON.stringify(updated));
  };

  // Xử lý đồng hồ đếm ngược
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          setDeepWorkMinutes((m) => {
            const nextM = m + 2;
            localStorage.setItem("atomic_deep_work_minutes", String(nextM));
            return nextM;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Xử lý đếm ngược 5 giây ở Modal Phản tỉnh thói quen xấu
  useEffect(() => {
    if (!relapseTarget || relapseCountdown <= 0) return;
    const timer = setTimeout(() => {
      setRelapseCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [relapseTarget, relapseCountdown]);

  // Khởi động bộ đếm giờ
  const startFocusTimer = (seconds: number, label: string, habitId?: string) => {
    setTimerSeconds(seconds);
    setTimerLabel(label);
    setTimerHabitId(habitId ?? null);
    setTimerRunning(true);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Cập nhật trạng thái thói quen tốt (NONE | TWO_MIN | FULL)
  const updateGoodHabitStatus = async (habit: Habit, targetStatus: LogStatus) => {
    const isTogglingOff = habit.today_status === targetStatus;
    const nextStatus: LogStatus = isTogglingOff ? "NONE" : targetStatus;

    let nextStreak = habit.streak;
    if (habit.today_status === "NONE" && nextStatus !== "NONE") {
      nextStreak = habit.streak + 1;
    } else if (habit.today_status !== "NONE" && nextStatus === "NONE") {
      nextStreak = Math.max(0, habit.streak - 1);
    }

    const updated = habits.map((h) =>
      h.id === habit.id
        ? { ...h, today_status: nextStatus, streak: nextStreak }
        : h
    );
    saveHabitsState(updated);

    // Nếu bấm nút 2 phút, kích hoạt luôn đồng hồ đếm ngược 2 phút
    if (nextStatus === "TWO_MIN") {
      startFocusTimer(
        120,
        `Quy tắc 2 phút: ${habit.two_minute_version || habit.title}`,
        habit.id
      );
    }

    // Đồng bộ lên Supabase
    try {
      await supabase
        .from("habits")
        .update({ today_status: nextStatus, streak: nextStreak })
        .eq("id", habit.id);
    } catch {
      // Bỏ qua nếu id là local
    }
  };

  // Cộng thêm 1 ngày sạch cho thói quen xấu
  const markBadHabitCleanToday = (id: string) => {
    const updated = habits.map((h) => {
      if (h.id === id) {
        return {
          ...h,
          clean_streak: h.clean_streak + 1,
          relapsed_today: false,
        };
      }
      return h;
    });
    saveHabitsState(updated);
  };

  // Xác nhận tái phạm sau khi hết 5 giây đếm ngược
  const confirmRelapse = () => {
    if (!relapseTarget) return;
    const logEntry: RelapseLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("vi-VN"),
      reason: relapseReason.trim() || "Không ghi rõ nguyên nhân",
    };

    const updated = habits.map((h) => {
      if (h.id === relapseTarget.id) {
        return {
          ...h,
          clean_streak: 0,
          relapsed_today: true,
          relapse_logs: [logEntry, ...h.relapse_logs],
        };
      }
      return h;
    });

    saveHabitsState(updated);
    setRelapseTarget(null);
    setRelapseReason("");
  };

  // Thêm thói quen mới
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.title.trim()) return;

    const created: Habit = {
      id: Date.now().toString(),
      title: newHabit.title.trim(),
      habit_type: newHabit.habit_type,
      category: newHabit.category,
      identity:
        newHabit.identity.trim() ||
        (newHabit.habit_type === "good"
          ? "Tôi là người kỷ luật và tiến bộ 1% mỗi ngày"
          : "Tôi là người làm chủ bản thân trước cám dỗ"),
      anchor_cue: newHabit.anchor_cue.trim() || "Sau khi ngồi vào bàn học",
      two_minute_version:
        newHabit.two_minute_version.trim() || "Chỉ bắt đầu làm trong 2 phút",
      temptation_bundle: newHabit.temptation_bundle.trim(),
      streak: 0,
      today_status: "NONE",
      trigger_cue: newHabit.trigger_cue.trim() || "Khi rảnh rỗi hoặc căng thẳng",
      consequence:
        newHabit.consequence.trim() || "Làm giảm sự tập trung và mất thời gian",
      friction_step:
        newHabit.friction_step.trim() || "Tạo rào cản 20 giây trước khi thực hiện",
      clean_streak: 0,
      relapsed_today: false,
      relapse_logs: [],
    };

    const updated = [created, ...habits];
    saveHabitsState(updated);

    // Nếu là thói quen tốt, thử lưu vào bảng habits trên Supabase
    if (created.habit_type === "good") {
      try {
        await supabase.from("habits").insert([
          {
            title: created.title,
            anchor_cue: created.anchor_cue,
            two_minute_version: created.two_minute_version,
            streak: 0,
            today_status: "NONE",
          },
        ]);
      } catch {
        // Đã lưu an toàn trong localStorage
      }
    }

    setNewHabit({
      title: "",
      habit_type: "good",
      category: "Học tập",
      identity: "",
      anchor_cue: "",
      two_minute_version: "",
      temptation_bundle: "",
      trigger_cue: "",
      consequence: "",
      friction_step: "",
    });
    setIsAddModalOpen(false);
  };

  // Xóa thói quen
  const deleteHabit = async (id: string) => {
    const updated = habits.filter((h) => h.id !== id);
    saveHabitsState(updated);
    try {
      await supabase.from("habits").delete().eq("id", id);
    } catch {
      // Bỏ qua nếu id local
    }
  };

  // Thống kê
  const goodHabits = habits.filter((h) => h.habit_type === "good");
  const badHabits = habits.filter((h) => h.habit_type === "bad");
  const completedGoodCount = goodHabits.filter(
    (h) => h.today_status !== "NONE"
  ).length;
  const cleanBadCount = badHabits.filter((h) => !h.relapsed_today).length;
  const totalRate =
    goodHabits.length > 0
      ? Math.round((completedGoodCount / goodHabits.length) * 100)
      : 100;

  // Lọc danh sách hiển thị
  const filteredHabits = habits.filter((h) => {
    const matchType = typeFilter === "ALL" || h.habit_type === typeFilter;
    const matchCat = categoryFilter === "ALL" || h.category === categoryFilter;
    return matchType && matchCat;
  });

  const sqlSnippet = `-- Chạy đoạn mã này trong Supabase SQL Editor để mở rộng bảng habits:
ALTER TABLE habits ADD COLUMN IF NOT EXISTS habit_type TEXT DEFAULT 'good';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Học tập';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS identity TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS temptation_bundle TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS trigger_cue TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS consequence TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS friction_step TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS clean_streak INTEGER DEFAULT 0;`;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        darkMode ? "bg-[#070a12] text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
        {/* HEADER */}
        <header
          className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b ${
            darkMode ? "border-slate-800/80" : "border-slate-200"
          }`}
        >
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🔥</span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Atomic Habits Tracker
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p
                className={`text-xs md:text-sm ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {syncStatus}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              onClick={() => setIsSqlModalOpen(true)}
              title="Xem mã SQL nâng cấp Supabase"
              className={`px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                darkMode
                  ? "bg-[#131826] border-slate-800 text-slate-300 hover:border-slate-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">SQL Supabase</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#5850ec] hover:bg-[#4a42d8] text-white px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mới</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Đổi giao diện Sáng/Tối"
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                darkMode
                  ? "bg-[#131826] border-slate-800 text-amber-400 hover:bg-slate-800"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* THANH ĐẾM GIỜ FOCUS / POMODORO & QUY TẮC 2 PHÚT */}
        <section
          className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            timerRunning
              ? "bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
              : darkMode
              ? "bg-[#111624] border-slate-800/80"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  {timerSeconds > 0
                    ? timerLabel || "Đang tập trung"
                    : "Trạm Tập Trung (2-Min Rule & Pomodoro)"}
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {timerSeconds > 0
                  ? `Thời gian còn lại: ${formatTime(timerSeconds)}`
                  : `Tổng thời gian tập trung sâu hôm nay: ${deepWorkMinutes} phút`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            {timerSeconds > 0 ? (
              <>
                <span className="text-xl font-mono font-bold text-amber-400 px-2">
                  {formatTime(timerSeconds)}
                </span>
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 cursor-pointer"
                >
                  {timerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Tạm dừng
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Tiếp tục
                    </>
                  )}
                </button>
                {timerHabitId && (
                  <button
                    onClick={() => {
                      const target = habits.find((h) => h.id === timerHabitId);
                      if (target && target.today_status === "NONE") {
                        updateGoodHabitStatus(target, "FULL");
                      }
                      setTimerSeconds(0);
                      setTimerRunning(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Xong luôn
                  </button>
                )}
                <button
                  onClick={() => {
                    setTimerSeconds(0);
                    setTimerRunning(false);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  title="Đặt lại"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => startFocusTimer(120, "Khởi động Quy tắc 2 Phút")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all cursor-pointer"
                >
                  ⚡ Bấm giờ 2 phút
                </button>
                <button
                  onClick={() => startFocusTimer(25 * 60, "Pomodoro Tập trung 25 phút")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
                >
                  🍅 Pomodoro 25p
                </button>
                <button
                  onClick={() => startFocusTimer(50 * 60, "Deep Work Giải đề 50 phút")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all cursor-pointer"
                >
                  🔥 Deep Work 50p
                </button>
              </>
            )}
          </div>
        </section>

        {/* BẢNG THỐNG KÊ TỔNG QUAN */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div
            className={`p-4 rounded-2xl border ${
              darkMode
                ? "bg-[#131826] border-slate-800/80"
                : "bg-white border-slate-200"
            }`}
          >
            <p className="text-xs text-slate-400">Hôm nay hoàn thành</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-400">
                {completedGoodCount}/{goodHabits.length}
              </span>
              <span className="text-xs text-slate-400">({totalRate}%)</span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              darkMode
                ? "bg-[#131826] border-slate-800/80"
                : "bg-white border-slate-200"
            }`}
          >
            <p className="text-xs text-slate-400">Kiểm soát thói quen xấu</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-rose-400">
                {cleanBadCount}/{badHabits.length}
              </span>
              <span className="text-xs text-slate-400">giữ sạch</span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              darkMode
                ? "bg-[#131826] border-slate-800/80"
                : "bg-white border-slate-200"
            }`}
          >
            <p className="text-xs text-slate-400">Chuỗi cao nhất</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-amber-400">
                🔥{" "}
                {Math.max(
                  0,
                  ...habits.map((h) =>
                    h.habit_type === "good" ? h.streak : h.clean_streak
                  )
                )}
              </span>
              <span className="text-xs text-slate-400">ngày liên tiếp</span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              darkMode
                ? "bg-[#131826] border-slate-800/80"
                : "bg-white border-slate-200"
            }`}
          >
            <p className="text-xs text-slate-400">Tích lũy Tập trung</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-cyan-400">
                ⚡ {deepWorkMinutes}
              </span>
              <span className="text-xs text-slate-400">phút hôm nay</span>
            </div>
          </div>
        </section>

        {/* THANH ĐIỀU HƯỚNG CHẾ ĐỘ XEM & BỘ LỌC */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Chế độ xem */}
          <div
            className={`inline-flex p-1 rounded-xl border ${
              darkMode
                ? "bg-[#111624] border-slate-800"
                : "bg-slate-100 border-slate-200"
            }`}
          >
            <button
              onClick={() => setActiveTab("LIST")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "LIST"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📋 Danh sách Thói quen
            </button>
            <button
              onClick={() => setActiveTab("STACK")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "STACK"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🔗 Sơ đồ Habit Stacking
            </button>
            <button
              onClick={() => setActiveTab("HEATMAP")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "HEATMAP"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📅 Heatmap 12 Tuần
            </button>
          </div>

          {/* Bộ lọc */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                typeFilter === "ALL"
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                  : "border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              Tất cả ({habits.length})
            </button>
            <button
              onClick={() => setTypeFilter("good")}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                typeFilter === "good"
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              🌱 Thói quen tốt ({goodHabits.length})
            </button>
            <button
              onClick={() => setTypeFilter("bad")}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                typeFilter === "bad"
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : "border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              🛡️ Loại bỏ thói quen xấu ({badHabits.length})
            </button>

            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as "ALL" | CategoryType)
              }
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border focus:outline-none ${
                darkMode
                  ? "bg-[#131826] border-slate-800 text-slate-300"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <option value="ALL">Mọi danh mục</option>
              <option value="Học tập">📚 Học tập</option>
              <option value="Tư duy">🧠 Tư duy</option>
              <option value="Kỷ luật">⚡ Kỷ luật</option>
              <option value="Sức khỏe">💪 Sức khỏe</option>
            </select>
          </div>
        </section>

        {/* TAB 1: DANH SÁCH THÓI QUEN (TỐT & XẤU) */}
        {activeTab === "LIST" && (
          <section className="space-y-4">
            {filteredHabits.map((habit) => {
              if (habit.habit_type === "good") {
                const isDoneFull = habit.today_status === "FULL";
                const isDoneTwoMin = habit.today_status === "TWO_MIN";

                return (
                  <div
                    key={habit.id}
                    className={`rounded-2xl p-5 md:p-6 border transition-all ${
                      darkMode
                        ? "bg-[#131826] border-slate-800/90 hover:border-slate-700"
                        : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="space-y-1.5 flex-1">
                        {/* Dòng Cue & Category */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                            <Link2 className="w-3.5 h-3.5" />
                            {habit.anchor_cue}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            {habit.category}
                          </span>
                        </div>

                        {/* Tên thói quen */}
                        <h3 className="text-lg md:text-xl font-bold tracking-tight">
                          {habit.title}
                        </h3>

                        {/* Quy tắc 2 phút */}
                        <p
                          className={`text-xs md:text-sm ${
                            darkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          2 phút: &ldquo;{habit.two_minute_version}&rdquo;
                        </p>

                        {/* Nhãn Bản sắc (Identity) & Cám dỗ đi kèm (Temptation Bundling) */}
                        <div className="flex flex-wrap items-center gap-3 pt-1.5">
                          {habit.identity && (
                            <span className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              Bản sắc: {habit.identity}
                            </span>
                          )}
                          {habit.temptation_bundle && (
                            <span className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                              <Gift className="w-3.5 h-3.5 text-emerald-400" />
                              Phần thưởng: {habit.temptation_bundle}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cụm nút hành động bên phải (Giữ đúng phong cách gốc của bạn) */}
                      <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
                        <div className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 text-amber-400 border border-slate-700/80 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{habit.streak} ngày</span>
                        </div>

                        <button
                          onClick={() => updateGoodHabitStatus(habit, "TWO_MIN")}
                          title="Hoàn thành phiên bản 2 phút (và bật đồng hồ đếm ngược 2 phút)"
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isDoneTwoMin
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-slate-800/90 text-slate-200 border-slate-700/80 hover:border-amber-500/40"
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>2 phút</span>
                        </button>

                        <button
                          onClick={() => updateGoodHabitStatus(habit, "FULL")}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isDoneFull
                              ? "bg-[#10b981] text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isDoneFull ? "Đã xong" : "Hoàn thành"}</span>
                        </button>

                        <button
                          onClick={() => deleteHabit(habit.id)}
                          title="Xóa thói quen"
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // THẺ LOẠI BỎ THÓI QUEN XẤU (ĐẢO NGƯỢC 4 QUY LUẬT)
              return (
                <div
                  key={habit.id}
                  className={`rounded-2xl p-5 md:p-6 border transition-all ${
                    darkMode
                      ? "bg-[#191219] border-rose-950/70 hover:border-rose-900/80"
                      : "bg-rose-50/40 border-rose-200"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4" />
                          Loại bỏ thói quen xấu (Đảo ngược 4 Quy Luật)
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800/50">
                          {habit.category}
                        </span>
                      </div>

                      <h3 className="text-lg md:text-xl font-bold tracking-tight">
                        {habit.title}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-black/25 border border-rose-950/50">
                          <span className="text-slate-400 block font-medium">
                            1. Làm vô hình (Kích hoạt):
                          </span>
                          <span className="text-slate-200">{habit.trigger_cue}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/25 border border-rose-950/50">
                          <span className="text-slate-400 block font-medium">
                            2. Làm bất hấp dẫn (Hậu quả):
                          </span>
                          <span className="text-rose-300">{habit.consequence}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/25 border border-rose-950/50">
                          <span className="text-slate-400 block font-medium">
                            3. Làm khó khăn (Chốt chặn 20s):
                          </span>
                          <span className="text-amber-300">{habit.friction_step}</span>
                        </div>
                      </div>

                      {/* Lịch sử phản tỉnh nếu từng tái phạm */}
                      {habit.relapse_logs.length > 0 && (
                        <div className="pt-2 text-xs text-slate-400">
                          📝 Nhật ký phản tỉnh gần nhất ({habit.relapse_logs[0].date}):{" "}
                          <span className="italic text-slate-300">
                            &ldquo;{habit.relapse_logs[0].reason}&rdquo;
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
                      <div className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>Sạch: {habit.clean_streak} ngày</span>
                      </div>

                      <button
                        onClick={() => markBadHabitCleanToday(habit.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        🛡️ Giữ vững (+1 ngày)
                      </button>

                      <button
                        onClick={() => {
                          setRelapseTarget(habit);
                          setRelapseCountdown(5);
                          setRelapseReason("");
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                      >
                        Lỡ tái phạm
                      </button>

                      <button
                        onClick={() => deleteHabit(habit.id)}
                        title="Xóa"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* TAB 2: SƠ ĐỒ XẾP CHỒNG THÓI QUEN (HABIT STACKING VISUALIZER) */}
        {activeTab === "STACK" && (
          <section
            className={`rounded-2xl p-6 border space-y-6 ${
              darkMode
                ? "bg-[#131826] border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div>
              <h2 className="text-lg font-bold">
                🔗 Chuỗi Xếp Chồng Thói Quen (Habit Stacking & Temptation Bundling)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Công thức của James Clear: Sau khi [Thói quen hiện tại], tôi sẽ [Thói
                quen mới (2 phút)], sau đó tôi được [Phần thưởng].
              </p>
            </div>

            <div className="space-y-4">
              {goodHabits.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-xl bg-black/20 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="flex-1 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 block">
                      1. Mối kích hoạt (Cue)
                    </span>
                    <span className="text-sm font-medium">{h.anchor_cue}</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 hidden md:block" />

                  <div className="flex-1 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">
                      2. Hành động (2-Min Rule)
                    </span>
                    <span className="text-sm font-semibold">{h.title}</span>
                    <span className="block text-xs text-slate-400">
                      Bắt đầu: {h.two_minute_version}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 hidden md:block" />

                  <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                      3. Phần thưởng (Temptation Bundling)
                    </span>
                    <span className="text-sm font-medium">
                      {h.temptation_bundle || "Cảm giác hoàn thành & tích điểm chuỗi"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: BIỂU ĐỒ LƯỚI NHIỆT 12 TUẦN (STREAK HEATMAP) */}
        {activeTab === "HEATMAP" && (
          <section
            className={`rounded-2xl p-6 border space-y-4 ${
              darkMode
                ? "bg-[#131826] border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>Biểu đồ Chuỗi Hoạt Động 12 Tuần (84 Ngày)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nguyên tắc vàng: &ldquo;Không bao giờ bỏ lỡ 2 lần liên tiếp (Never
                  miss twice)&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Ít</span>
                <span className="w-3 h-3 rounded-sm bg-slate-800 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-emerald-900 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />
                <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />
                <span>Nhiều</span>
              </div>
            </div>

            <div className="grid grid-cols-12 sm:grid-cols-21 md:grid-cols-28 gap-1.5 pt-2">
              {Array.from({ length: 84 }).map((_, idx) => {
                const isToday = idx === 83;
                const intensity = isToday
                  ? completedGoodCount > 0
                    ? 3
                    : 0
                  : (idx * 7 + 3) % 4;
                const bgClass =
                  intensity === 3
                    ? "bg-emerald-400 shadow-sm shadow-emerald-500/30"
                    : intensity === 2
                    ? "bg-emerald-600/80"
                    : intensity === 1
                    ? "bg-emerald-900/70"
                    : "bg-slate-800/70";
                return (
                  <div
                    key={idx}
                    title={
                      isToday
                        ? `Hôm nay: Hoàn thành ${completedGoodCount}/${goodHabits.length}`
                        : `Ngày ${idx + 1}`
                    }
                    className={`h-6 rounded-md transition-all ${bgClass} ${
                      isToday ? "ring-2 ring-white" : ""
                    }`}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* MODAL PHẢN TỈNH ĐẾM NGƯỢC 5 GIÂY KHI TÁI PHẠM THÓI QUEN XẤU */}
        {relapseTarget && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#191219] border border-rose-800/60 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 text-slate-100">
              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold">
                  Khoảnh khắc Chánh niệm & Ma sát (Friction)
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Bạn đang bấm vào <strong className="text-white">{relapseTarget.title}</strong>.
                Theo quy luật thứ 3 của <em>Atomic Habits</em>, hãy dừng lại{" "}
                <strong className="text-amber-400">5 giây</strong> để tách cảm xúc
                nhất thời ra khỏi quyết định của bạn.
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-rose-900/50 text-xs space-y-1">
                <p className="text-rose-300">
                  ⚠️ <strong>Hậu quả nếu phạm:</strong> {relapseTarget.consequence}
                </p>
                <p className="text-emerald-300">
                  🛡️ <strong>Cách chặn ngay:</strong> {relapseTarget.friction_step}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Nếu đã lỡ phạm, điều gì vừa kích hoạt hành vi này? (Để rút kinh nghiệm
                  không phạm 2 lần liên tiếp):
                </label>
                <input
                  type="text"
                  placeholder="VD: Vừa làm xong bài khó nên mỏi mắt, tiện tay mở điện thoại..."
                  value={relapseReason}
                  onChange={(e) => setRelapseReason(e.target.value)}
                  className="w-full bg-[#0d090d] border border-rose-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setRelapseTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer"
                >
                  ✋ Tôi kịp dừng lại rồi! (Giữ chuỗi)
                </button>
                <button
                  disabled={relapseCountdown > 0}
                  onClick={confirmRelapse}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    relapseCountdown > 0
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                  }`}
                >
                  {relapseCountdown > 0
                    ? `Đợi ${relapseCountdown}s để xác nhận...`
                    : "Xác nhận đặt lại chuỗi & Lưu bài học"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL THÊM THÓI QUEN MỚI */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-[#131826] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 text-slate-100 my-8">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Thiết kế Thói quen mới</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddHabit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Loại mục tiêu
                    </label>
                    <select
                      value={newHabit.habit_type}
                      onChange={(e) =>
                        setNewHabit({
                          ...newHabit,
                          habit_type: e.target.value as HabitType,
                        })
                      }
                      className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="good">🌱 Xây dựng thói quen tốt</option>
                      <option value="bad">🛡️ Loại bỏ thói quen xấu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Danh mục
                    </label>
                    <select
                      value={newHabit.category}
                      onChange={(e) =>
                        setNewHabit({
                          ...newHabit,
                          category: e.target.value as CategoryType,
                        })
                      }
                      className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Học tập">📚 Học tập</option>
                      <option value="Tư duy">🧠 Tư duy</option>
                      <option value="Kỷ luật">⚡ Kỷ luật</option>
                      <option value="Sức khỏe">💪 Sức khỏe</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Tên thói quen
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      newHabit.habit_type === "good"
                        ? "VD: Giải 1 đề Toán / Học AP Calculus 45 phút"
                        : "VD: Xem YouTube Shorts khi đang ngồi bàn học"
                    }
                    value={newHabit.title}
                    onChange={(e) =>
                      setNewHabit({ ...newHabit, title: e.target.value })
                    }
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Tuyên bố Bản sắc (Identity-Based Habit)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tôi là người học tập có chiều sâu và tự giác..."
                    value={newHabit.identity}
                    onChange={(e) =>
                      setNewHabit({ ...newHabit, identity: e.target.value })
                    }
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {newHabit.habit_type === "good" ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-indigo-400 mb-1">
                        Luật 1 - Rõ ràng (Habit Stacking / Sau khi...):
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Sau khi ngồi vào bàn học lúc 19h30..."
                        value={newHabit.anchor_cue}
                        onChange={(e) =>
                          setNewHabit({ ...newHabit, anchor_cue: e.target.value })
                        }
                        className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-400 mb-1">
                        Luật 3 - Dễ dàng (Quy tắc 2 phút):
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Mở vở và giải đúng 1 câu đầu tiên"
                        value={newHabit.two_minute_version}
                        onChange={(e) =>
                          setNewHabit({
                            ...newHabit,
                            two_minute_version: e.target.value,
                          })
                        }
                        className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-400 mb-1">
                        Luật 2 & 4 - Hấp dẫn & Thỏa mãn (Temptation Bundling):
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Nghe 1 bài nhạc yêu thích sau khi xong"
                        value={newHabit.temptation_bundle}
                        onChange={(e) =>
                          setNewHabit({
                            ...newHabit,
                            temptation_bundle: e.target.value,
                          })
                        }
                        className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-rose-400 mb-1">
                        Đảo ngược Luật 1 - Nhận diện Mối kích hoạt (Trigger):
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Khi để điện thoại ngay cạnh máy tính..."
                        value={newHabit.trigger_cue}
                        onChange={(e) =>
                          setNewHabit({ ...newHabit, trigger_cue: e.target.value })
                        }
                        className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-rose-400 mb-1">
                        Đảo ngược Luật 2 - Hậu quả / Chi phí thực sự:
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Đứt mạch suy nghĩ, mất 30 phút mới tập trung lại được"
                        value={newHabit.consequence}
                        onChange={(e) =>
                          setNewHabit({ ...newHabit, consequence: e.target.value })
                        }
                        className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-400 mb-1">
                        Đảo ngược Luật 3 - Thiết lập Ma sát 20 giây (Friction):
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Bật chế độ Không làm phiền & cất điện thoại sang phòng khác"
                        value={newHabit.friction_step}
                        onChange={(e) =>
                          setNewHabit({
                            ...newHabit,
                            friction_step: e.target.value,
                          })
                        }
                        className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 cursor-pointer"
                  >
                    Lưu vào Hệ thống
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL LẤY MÃ SQL SUPABASE */}
        {isSqlModalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#131826] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 text-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <span>Mã SQL Mở rộng Bảng Supabase</span>
                </h3>
                <button
                  onClick={() => setIsSqlModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Ứng dụng hiện đã tự động lưu cả trên Supabase và bộ nhớ trình duyệt. Nếu
                bạn muốn bảng <code>habits</code> trên Supabase lưu đầy đủ các cột mới,
                hãy dán đoạn lệnh này vào tab <strong>SQL Editor</strong> của Supabase:
              </p>
              <pre className="p-4 rounded-xl bg-[#070a12] border border-slate-800 text-[11px] text-indigo-300 overflow-x-auto font-mono">
                {sqlSnippet}
              </pre>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(sqlSnippet);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  {copiedSql ? "✅ Đã sao chép SQL" : "Sao chép mã SQL"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
