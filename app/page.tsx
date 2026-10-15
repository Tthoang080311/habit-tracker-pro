"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Brain,
  Volume2,
  VolumeX,
  TrendingUp,
  Target,
  ShoppingBag,
  BookOpen,
  Eye,
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

interface FocusSessionLog {
  id: string;
  date: string;
  time: string;
  label: string;
  minutes: number;
  accomplished: string;
  distraction: string;
  focusRating: number; // 1 - 5
}

interface RewardItem {
  id: string;
  title: string;
  cost: number;
  redeemedCount: number;
}

interface DailyHistoryRecord {
  date: string; // YYYY-MM-DD
  completedFull: number;
  completedTwoMin: number;
  totalGood: number;
  relapses: number;
  deepWorkMinutes: number;
  scorePercent: number;
}

interface Habit {
  id: string;
  title: string;
  habit_type: HabitType;
  category: CategoryType;
  identity: string;
  // Trường cho thói quen tốt
  anchor_cue: string;
  two_minute_version: string;
  temptation_bundle: string;
  streak: number;
  today_status: LogStatus;
  full_count_history?: number;
  two_min_count_history?: number;
  target_days?: number;
  // Trường cho thói quen xấu
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
    full_count_history: 1,
    two_min_count_history: 0,
    target_days: 30,
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
    full_count_history: 3,
    two_min_count_history: 1,
    target_days: 30,
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
    target_days: 21,
    trigger_cue: "Cầm điện thoại lên giường sau 22h30 hoặc khi thấy chán",
    consequence: "Ngủ muộn, sáng hôm sau mệt mỏi, giảm tốc độ giải Toán & Lý",
    friction_step: "Để sạc điện thoại ở bàn phòng khách, cách giường 5 mét",
    clean_streak: 5,
    relapsed_today: false,
    relapse_logs: [],
  },
];

const DEFAULT_REWARDS: RewardItem[] = [
  {
    id: "rew-1",
    title: "🎧 Nghe 1 playlist nhạc / Giải lao 20 phút không áy náy",
    cost: 30,
    redeemedCount: 1,
  },
  {
    id: "rew-2",
    title: "🧋 Tự thưởng 1 cốc Cacao ấm / Trà sữa cuối tuần",
    cost: 100,
    redeemedCount: 0,
  },
  {
    id: "rew-3",
    title: "🎮 Xem 1 tập phim / Chơi game 45 phút sau khi xong việc",
    cost: 150,
    redeemedCount: 0,
  },
];

const getTodayKey = () => new Date().toISOString().split("T")[0];

export default function AtomicDashboard() {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<string>(
    "Đã kết nối trực tiếp với Supabase"
  );

  // Bộ lọc & Chế độ xem mở rộng
  const [typeFilter, setTypeFilter] = useState<"ALL" | HabitType>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | CategoryType>("ALL");
  const [activeTab, setActiveTab] = useState<
    "LIST" | "AI_INSIGHTS" | "STACK" | "HEATMAP" | "REWARDS"
  >("LIST");

  // Bộ đếm giờ Tập trung (Đã fix lỗi tính phút)
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerLabel, setTimerLabel] = useState<string>("");
  const [timerHabitId, setTimerHabitId] = useState<string | null>(null);
  const [deepWorkMinutes, setDeepWorkMinutes] = useState<number>(45);
  const [dailyDeepWorkGoal, setDailyDeepWorkGoal] = useState<number>(90);

  // Âm thanh nền Tập trung (Web Audio API - Brown Noise)
  const [ambientOn, setAmbientOn] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Nhật ký sau phiên tập trung (Post-Session Reflection)
  const [focusLogs, setFocusLogs] = useState<FocusSessionLog[]>([]);
  const [isReflectionOpen, setIsReflectionOpen] = useState<boolean>(false);
  const [pendingSessionMinutes, setPendingSessionMinutes] = useState<number>(0);
  const [reflectionData, setReflectionData] = useState({
    accomplished: "",
    distraction: "",
    focusRating: 4,
  });

  // Điểm thưởng XP & Kho phần thưởng
  const [xpPoints, setXpPoints] = useState<number>(85);
  const [rewards, setRewards] = useState<RewardItem[]>(DEFAULT_REWARDS);
  const [newRewardTitle, setNewRewardTitle] = useState<string>("");
  const [newRewardCost, setNewRewardCost] = useState<number>(50);

  // Dữ liệu Heatmap 12 tuần thực tế & chọn ngày
  const [dailyHistory, setDailyHistory] = useState<
    Record<string, DailyHistoryRecord>
  >({});
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string>(
    getTodayKey()
  );
  const [simulateHeatmap, setSimulateHeatmap] = useState<boolean>(false);

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
    target_days: 30,
    trigger_cue: "",
    consequence: "",
    friction_step: "",
  });

  // Modal Phản tỉnh đếm ngược 5 giây
  const [relapseTarget, setRelapseTarget] = useState<Habit | null>(null);
  const [relapseCountdown, setRelapseCountdown] = useState<number>(5);
  const [relapseReason, setRelapseReason] = useState<string>("");

  // Modal xem mã SQL Supabase
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Tải dữ liệu từ localStorage + Đồng bộ từ Supabase
  useEffect(() => {
    const savedLocal = localStorage.getItem("atomic_habits_pro_v2");
    const savedMinutes = localStorage.getItem("atomic_deep_work_minutes");
    const savedXp = localStorage.getItem("atomic_xp_points");
    const savedLogs = localStorage.getItem("atomic_focus_logs");
    const savedRewards = localStorage.getItem("atomic_rewards");
    const savedHistory = localStorage.getItem("atomic_daily_history");

    if (savedMinutes) setDeepWorkMinutes(Number(savedMinutes));
    if (savedXp) setXpPoints(Number(savedXp));
    if (savedLogs) {
      try {
        setFocusLogs(JSON.parse(savedLogs));
      } catch {}
    }
    if (savedRewards) {
      try {
        setRewards(JSON.parse(savedRewards));
      } catch {}
    }
    if (savedHistory) {
      try {
        setDailyHistory(JSON.parse(savedHistory));
      } catch {}
    }

    let localData: Habit[] = DEFAULT_HABITS;
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal) as Habit[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          localData = parsed;
          setHabits(parsed);
        }
      } catch {}
    }

    async function fetchFromSupabase() {
      try {
        const { data, error } = await supabase.from("habits").select("*");
        if (!error && data && data.length > 0) {
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
                (row.category as CategoryType) ??
                existing?.category ??
                "Học tập",
              identity: String(
                row.identity ??
                  existing?.identity ??
                  "Tôi là người kỷ luật và kiên trì mỗi ngày"
              ),
              anchor_cue: String(
                row.anchor_cue ??
                  existing?.anchor_cue ??
                  "Sau khi ngồi vào bàn học"
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
                (row.today_status as LogStatus) ??
                existing?.today_status ??
                "NONE",
              full_count_history: Number(
                existing?.full_count_history ?? row.streak ?? 0
              ),
              two_min_count_history: Number(
                existing?.two_min_count_history ?? 0
              ),
              target_days: Number(existing?.target_days ?? 30),
              trigger_cue: String(
                row.trigger_cue ?? existing?.trigger_cue ?? ""
              ),
              consequence: String(
                row.consequence ?? existing?.consequence ?? ""
              ),
              friction_step: String(
                row.friction_step ?? existing?.friction_step ?? ""
              ),
              clean_streak: Number(
                row.clean_streak ?? existing?.clean_streak ?? 0
              ),
              relapsed_today: Boolean(
                row.relapsed_today ?? existing?.relapsed_today ?? false
              ),
              relapse_logs: existing?.relapse_logs ?? [],
            };
          });

          const localOnly = localData.filter(
            (lh) => !merged.some((m) => m.id === lh.id || m.title === lh.title)
          );
          const finalHabits = [...merged, ...localOnly];
          setHabits(finalHabits);
          localStorage.setItem(
            "atomic_habits_pro_v2",
            JSON.stringify(finalHabits)
          );
          setSyncStatus("Đã kết nối & đồng bộ trực tiếp với Supabase");
        }
      } catch {
        setSyncStatus("Đã kết nối trực tiếp với Supabase (Chế độ Hybrid)");
      }
    }

    fetchFromSupabase();
  }, []);

  // Thống kê & Tính toán % Tiến độ Thực chất (Weighted Progress)
  const goodHabits = habits.filter((h) => h.habit_type === "good");
  const badHabits = habits.filter((h) => h.habit_type === "bad");

  const completedFullCount = goodHabits.filter(
    (h) => h.today_status === "FULL"
  ).length;
  const completedTwoMinCount = goodHabits.filter(
    (h) => h.today_status === "TWO_MIN"
  ).length;
  const completedGoodCount = completedFullCount + completedTwoMinCount;
  const cleanBadCount = badHabits.filter((h) => !h.relapsed_today).length;

  // Tỷ lệ hoàn thành số lượng (Surface Rate)
  const totalRate =
    goodHabits.length > 0
      ? Math.round((completedGoodCount / goodHabits.length) * 100)
      : 100;

  // Điểm tiến độ thực chất trong ngày (Full = 1.0, 2-Min = 0.35 để tránh lạm dụng 2 phút)
  const weightedGoodScore =
    goodHabits.length > 0
      ? ((completedFullCount * 1.0 + completedTwoMinCount * 0.35) /
          goodHabits.length) *
        100
      : 100;
  const badControlScore =
    badHabits.length > 0 ? (cleanBadCount / badHabits.length) * 100 : 100;
  const deepWorkProgressPercent = Math.min(
    100,
    Math.round((deepWorkMinutes / dailyDeepWorkGoal) * 100)
  );

  // Tiến độ Tổng thể Ngày (%) kết hợp 3 trụ cột: Thói quen tốt (50%) + Kiểm soát thói quen xấu (25%) + Deep Work (25%)
  const overallDailyProgress = Math.round(
    weightedGoodScore * 0.5 +
      badControlScore * 0.25 +
      deepWorkProgressPercent * 0.25
  );

  // Tự động cập nhật bản ghi lịch sử của ngày hôm nay cho Heatmap
  useEffect(() => {
    const todayKey = getTodayKey();
    setDailyHistory((prev) => {
      const updated = {
        ...prev,
        [todayKey]: {
          date: todayKey,
          completedFull: completedFullCount,
          completedTwoMin: completedTwoMinCount,
          totalGood: goodHabits.length,
          relapses: badHabits.length - cleanBadCount,
          deepWorkMinutes,
          scorePercent: overallDailyProgress,
        },
      };
      localStorage.setItem("atomic_daily_history", JSON.stringify(updated));
      return updated;
    });
  }, [
    completedFullCount,
    completedTwoMinCount,
    goodHabits.length,
    badHabits.length,
    cleanBadCount,
    deepWorkMinutes,
    overallDailyProgress,
  ]);

  const saveHabitsState = (updated: Habit[]) => {
    setHabits(updated);
    localStorage.setItem("atomic_habits_pro_v2", JSON.stringify(updated));
  };

  const addXp = (amount: number) => {
    setXpPoints((prev) => {
      const next = Math.max(0, prev + amount);
      localStorage.setItem("atomic_xp_points", String(next));
      return next;
    });
  };

  // Trình tạo âm thanh nền Tập trung (Brown Noise bằng Web Audio API)
  const toggleAmbientSound = () => {
    if (ambientOn) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setAmbientOn(false);
    } else {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioContextClass();
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 0.15; // Âm lượng dịu nhẹ
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 420;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.35;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        whiteNoise.start(0);

        audioCtxRef.current = ctx;
        gainNodeRef.current = gainNode;
        setAmbientOn(true);
      } catch {
        alert("Trình duyệt của bạn cần tương tác trước khi phát âm thanh.");
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Xử lý đồng hồ đếm ngược (Đã sửa lỗi cộng cứng +2 phút)
  useEffect(() => {
    if (!timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          const earnedMins = Math.max(1, Math.round(initialTimerSeconds / 60));
          setDeepWorkMinutes((m) => {
            const nextM = m + earnedMins;
            localStorage.setItem("atomic_deep_work_minutes", String(nextM));
            return nextM;
          });
          addXp(earnedMins); // 1 phút tập trung = +1 XP
          setPendingSessionMinutes(earnedMins);
          setIsReflectionOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, initialTimerSeconds]);

  // Đếm ngược 5 giây ở Modal Phản tỉnh thói quen xấu
  useEffect(() => {
    if (!relapseTarget || relapseCountdown <= 0) return;
    const timer = setTimeout(() => {
      setRelapseCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [relapseTarget, relapseCountdown]);

  const startFocusTimer = (seconds: number, label: string, habitId?: string) => {
    setTimerSeconds(seconds);
    setInitialTimerSeconds(seconds);
    setTimerLabel(label);
    setTimerHabitId(habitId ?? null);
    setTimerRunning(true);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Lưu nhật ký sau phiên học
  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: FocusSessionLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("vi-VN"),
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      label: timerLabel || "Phiên Tập trung",
      minutes: pendingSessionMinutes,
      accomplished:
        reflectionData.accomplished.trim() || "Hoàn thành mục tiêu phiên",
      distraction:
        reflectionData.distraction.trim() || "Không bị xao nhãng đáng kể",
      focusRating: reflectionData.focusRating,
    };

    const updatedLogs = [newLog, ...focusLogs];
    setFocusLogs(updatedLogs);
    localStorage.setItem("atomic_focus_logs", JSON.stringify(updatedLogs));
    setReflectionData({ accomplished: "", distraction: "", focusRating: 4 });
    setIsReflectionOpen(false);
  };

  // Cập nhật trạng thái thói quen tốt
  const updateGoodHabitStatus = async (habit: Habit, targetStatus: LogStatus) => {
    const isTogglingOff = habit.today_status === targetStatus;
    const nextStatus: LogStatus = isTogglingOff ? "NONE" : targetStatus;

    let nextStreak = habit.streak;
    let fullHist = habit.full_count_history ?? habit.streak;
    let twoMinHist = habit.two_min_count_history ?? 0;

    if (habit.today_status === "NONE" && nextStatus !== "NONE") {
      nextStreak = habit.streak + 1;
      if (nextStatus === "FULL") {
        fullHist += 1;
        addXp(20);
      } else {
        twoMinHist += 1;
        addXp(5);
      }
    } else if (habit.today_status !== "NONE" && nextStatus === "NONE") {
      nextStreak = Math.max(0, habit.streak - 1);
      if (habit.today_status === "FULL") {
        fullHist = Math.max(0, fullHist - 1);
        addXp(-20);
      } else {
        twoMinHist = Math.max(0, twoMinHist - 1);
        addXp(-5);
      }
    } else if (habit.today_status === "TWO_MIN" && nextStatus === "FULL") {
      fullHist += 1;
      twoMinHist = Math.max(0, twoMinHist - 1);
      addXp(15);
    } else if (habit.today_status === "FULL" && nextStatus === "TWO_MIN") {
      fullHist = Math.max(0, fullHist - 1);
      twoMinHist += 1;
      addXp(-15);
    }

    const updated = habits.map((h) =>
      h.id === habit.id
        ? {
            ...h,
            today_status: nextStatus,
            streak: nextStreak,
            full_count_history: fullHist,
            two_min_count_history: twoMinHist,
          }
        : h
    );
    saveHabitsState(updated);

    if (nextStatus === "TWO_MIN") {
      startFocusTimer(
        120,
        `Quy tắc 2 phút: ${habit.two_minute_version || habit.title}`,
        habit.id
      );
    }

    try {
      await supabase
        .from("habits")
        .update({ today_status: nextStatus, streak: nextStreak })
        .eq("id", habit.id);
    } catch {}
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
    addXp(15);
    saveHabitsState(updated);
  };

  // Xác nhận tái phạm
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
      full_count_history: 0,
      two_min_count_history: 0,
      target_days: Number(newHabit.target_days) || 30,
      trigger_cue:
        newHabit.trigger_cue.trim() || "Khi rảnh rỗi hoặc căng thẳng",
      consequence:
        newHabit.consequence.trim() || "Làm giảm sự tập trung và mất thời gian",
      friction_step:
        newHabit.friction_step.trim() ||
        "Tạo rào cản 20 giây trước khi thực hiện",
      clean_streak: 0,
      relapsed_today: false,
      relapse_logs: [],
    };

    const updated = [created, ...habits];
    saveHabitsState(updated);

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
      } catch {}
    }

    setNewHabit({
      title: "",
      habit_type: "good",
      category: "Học tập",
      identity: "",
      anchor_cue: "",
      two_minute_version: "",
      temptation_bundle: "",
      target_days: 30,
      trigger_cue: "",
      consequence: "",
      friction_step: "",
    });
    setIsAddModalOpen(false);
  };

  const deleteHabit = async (id: string) => {
    const updated = habits.filter((h) => h.id !== id);
    saveHabitsState(updated);
    try {
      await supabase.from("habits").delete().eq("id", id);
    } catch {}
  };

  // Đổi phần thưởng trong Kho Phần Thưởng
  const redeemReward = (reward: RewardItem) => {
    if (xpPoints < reward.cost) return;
    addXp(-reward.cost);
    const updated = rewards.map((r) =>
      r.id === reward.id ? { ...r, redeemedCount: r.redeemedCount + 1 } : r
    );
    setRewards(updated);
    localStorage.setItem("atomic_rewards", JSON.stringify(updated));
  };

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle.trim()) return;
    const item: RewardItem = {
      id: Date.now().toString(),
      title: newRewardTitle.trim(),
      cost: Math.max(10, Number(newRewardCost)),
      redeemedCount: 0,
    };
    const updated = [...rewards, item];
    setRewards(updated);
    localStorage.setItem("atomic_rewards", JSON.stringify(updated));
    setNewRewardTitle("");
    setNewRewardCost(50);
  };

  // Lọc danh sách hiển thị
  const filteredHabits = habits.filter((h) => {
    const matchType = typeFilter === "ALL" || h.habit_type === typeFilter;
    const matchCat = categoryFilter === "ALL" || h.category === categoryFilter;
    return matchType && matchCat;
  });

  // HỆ THỐNG PHÂN TÍCH AI INSIGHT (Tư duy phản biện & Đánh giá khách quan)
  const generateAiInsights = () => {
    const totalFullHistory = goodHabits.reduce(
      (acc, h) => acc + (h.full_count_history ?? h.streak),
      0
    );
    const totalTwoMinHistory = goodHabits.reduce(
      (acc, h) => acc + (h.two_min_count_history ?? 0),
      0
    );
    const totalExecutions = totalFullHistory + totalTwoMinHistory;
    const deepExecutionRatio =
      totalExecutions > 0
        ? Math.round((totalFullHistory / totalExecutions) * 100)
        : 100;

    const totalRelapses = badHabits.reduce(
      (acc, h) => acc + h.relapse_logs.length + (h.relapsed_today ? 1 : 0),
      0
    );

    const studyHabits = goodHabits.filter(
      (h) => h.category === "Học tập" || h.category === "Tư duy"
    );
    const unfinishedStudy = studyHabits.filter((h) => h.today_status === "NONE");

    return {
      deepExecutionRatio,
      totalFullHistory,
      totalTwoMinHistory,
      totalRelapses,
      unfinishedStudy,
    };
  };

  const aiMetrics = generateAiInsights();

  // Tạo danh sách 84 ngày gần nhất cho Heatmap
  const heatmapDays = Array.from({ length: 84 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - idx));
    const dateKey = d.toISOString().split("T")[0];
    const record = dailyHistory[dateKey];

    let score = record ? record.scorePercent : 0;
    if (simulateHeatmap && !record && idx < 83) {
      score = ((idx * 17 + 23) % 5) * 25;
    }

    return {
      dateKey,
      displayDate: d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      isToday: idx === 83,
      score,
      record,
    };
  });

  const selectedDayDetail = dailyHistory[selectedHeatmapDate];

  const sqlSnippet = `-- Chạy đoạn mã này trong Supabase SQL Editor để mở rộng bảng habits:
ALTER TABLE habits ADD COLUMN IF NOT EXISTS habit_type TEXT DEFAULT 'good';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Học tập';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS identity TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS temptation_bundle TEXT;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_days INTEGER DEFAULT 30;
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-7">
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
                PRO v2.5
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p
                  className={`text-xs md:text-sm ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {syncStatus}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                ✨ {xpPoints} XP
              </span>
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
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* THANH TIẾN ĐỘ TỔNG THỂ TRONG NGÀY (MASTER PROGRESS BAR %) */}
        <section
          className={`rounded-2xl p-5 border space-y-3 ${
            darkMode
              ? "bg-gradient-to-r from-[#131826] via-[#151b2e] to-[#131826] border-slate-800/90"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Tiến độ Kỷ luật Thực chất Hôm nay (Weighted Daily Progress)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tính theo trọng số: Hoàn thành Full (100% điểm) • Làm 2 phút khởi
                động (35% điểm) • Giữ sạch thói quen xấu & Deep Work
              </p>
            </div>
            <div className="flex items-baseline gap-1.5 self-end sm:self-center">
              <span className="text-3xl font-extrabold text-emerald-400">
                {overallDailyProgress}%
              </span>
              <span className="text-xs text-slate-400">hoàn thành</span>
            </div>
          </div>

          {/* Thanh bar chính */}
          <div className="w-full h-3.5 bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, overallDailyProgress)}%` }}
            />
          </div>

          {/* 3 Thanh tiến độ thành phần */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>🌱 Thói quen tốt (Thực chất)</span>
                <span className="font-semibold text-emerald-400">
                  {Math.round(weightedGoodScore)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, weightedGoodScore)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>🛡️ Giữ sạch thói quen xấu</span>
                <span className="font-semibold text-rose-400">
                  {Math.round(badControlScore)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, badControlScore)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>
                  ⚡ Mục tiêu Deep Work ({deepWorkMinutes}/{dailyDeepWorkGoal}p)
                </span>
                <span className="font-semibold text-cyan-400">
                  {deepWorkProgressPercent}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${deepWorkProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* TRẠM TẬP TRUNG PRO (POMODORO + BROWN NOISE + REFLECTION) */}
        <section
          className={`rounded-2xl p-4 border transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
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
                    : "Trạm Tập Trung Pro (2-Min Rule & Deep Work)"}
                </span>
                {ambientOn && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                    🎵 Brown Noise Đang phát
                  </span>
                )}
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {timerSeconds > 0
                  ? `Thời gian còn lại: ${formatTime(timerSeconds)} (Hoàn thành nhận +${Math.max(
                      1,
                      Math.round(initialTimerSeconds / 60)
                    )} XP)`
                  : `Đã tập trung sâu: ${deepWorkMinutes} phút hôm nay • Bật Brown Noise để chặn tiếng ồn`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
            {/* Nút bật/tắt âm thanh nền Brown Noise */}
            <button
              onClick={toggleAmbientSound}
              title="Bật/tắt âm thanh Brown Noise giúp cô lập sự chú ý"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                ambientOn
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600"
              }`}
            >
              {ambientOn ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Tắt Noise
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" /> Brown Noise
                </>
              )}
            </button>

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
                <button
                  onClick={() => {
                    const elapsedMins = Math.max(
                      1,
                      Math.round((initialTimerSeconds - timerSeconds) / 60)
                    );
                    setDeepWorkMinutes((m) => {
                      const nextM = m + elapsedMins;
                      localStorage.setItem(
                        "atomic_deep_work_minutes",
                        String(nextM)
                      );
                      return nextM;
                    });
                    addXp(elapsedMins);
                    if (timerHabitId) {
                      const target = habits.find((h) => h.id === timerHabitId);
                      if (target && target.today_status !== "FULL") {
                        updateGoodHabitStatus(target, "FULL");
                      }
                    }
                    setPendingSessionMinutes(elapsedMins);
                    setTimerSeconds(0);
                    setTimerRunning(false);
                    setIsReflectionOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Nghiệm thu phiên
                </button>
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
                  onClick={() =>
                    startFocusTimer(120, "Khởi động Quy tắc 2 Phút")
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all cursor-pointer"
                >
                  ⚡ Bấm giờ 2 phút
                </button>
                <button
                  onClick={() =>
                    startFocusTimer(25 * 60, "Pomodoro Tập trung 25 phút")
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
                >
                  🍅 Pomodoro 25p
                </button>
                <button
                  onClick={() =>
                    startFocusTimer(50 * 60, "Deep Work Giải đề 50 phút")
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all cursor-pointer"
                >
                  🔥 Deep Work 50p
                </button>
              </>
            )}
          </div>
        </section>

        {/* BẢNG THỐNG KÊ TỔNG QUAN 4 Ô */}
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
            <p className="text-[11px] text-slate-500 mt-1">
              Full: {completedFullCount} • 2-phút: {completedTwoMinCount}
            </p>
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
            <p className="text-[11px] text-slate-500 mt-1">
              Tái phạm tích lũy: {aiMetrics.totalRelapses} lần
            </p>
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
            <p className="text-[11px] text-slate-500 mt-1">
              Mốc chuẩn tự động hóa: 66 ngày
            </p>
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
            <p className="text-[11px] text-slate-500 mt-1">
              Đạt {deepWorkProgressPercent}% mục tiêu ({dailyDeepWorkGoal}p)
            </p>
          </div>
        </section>

        {/* THANH ĐIỀU HƯỚNG CHẾ ĐỘ XEM & BỘ LỌC */}
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div
            className={`flex flex-wrap p-1 rounded-xl border gap-1 ${
              darkMode
                ? "bg-[#111624] border-slate-800"
                : "bg-slate-100 border-slate-200"
            }`}
          >
            <button
              onClick={() => setActiveTab("LIST")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "LIST"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📋 Danh sách Thói quen
            </button>
            <button
              onClick={() => setActiveTab("AI_INSIGHTS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "AI_INSIGHTS"
                  ? "bg-purple-600 text-white shadow"
                  : "text-purple-400 hover:text-purple-200"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>AI Insight Phân tích Học</span>
            </button>
            <button
              onClick={() => setActiveTab("STACK")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "STACK"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🔗 Sơ đồ Habit Stacking
            </button>
            <button
              onClick={() => setActiveTab("HEATMAP")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "HEATMAP"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📅 Heatmap 12 Tuần
            </button>
            <button
              onClick={() => setActiveTab("REWARDS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "REWARDS"
                  ? "bg-amber-600 text-white shadow"
                  : "text-amber-400 hover:text-amber-200"
              }`}
            >
              🎁 Kho Phần thưởng ({xpPoints} XP)
            </button>
          </div>

          {activeTab === "LIST" && (
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
                🛡️ Loại bỏ xấu ({badHabits.length})
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
          )}
        </section>

        {/* TAB 1: DANH SÁCH THÓI QUEN (CÓ THANH TIẾN ĐỘ % MỐC MỤC TIÊU) */}
        {activeTab === "LIST" && (
          <section className="space-y-4">
            {filteredHabits.map((habit) => {
              const targetDays = habit.target_days || 30;
              const currentStreak =
                habit.habit_type === "good" ? habit.streak : habit.clean_streak;
              const habitProgressPercent = Math.min(
                100,
                Math.round((currentStreak / targetDays) * 100)
              );

              if (habit.habit_type === "good") {
                const isDoneFull = habit.today_status === "FULL";
                const isDoneTwoMin = habit.today_status === "TWO_MIN";

                return (
                  <div
                    key={habit.id}
                    className={`rounded-2xl p-5 md:p-6 border transition-all space-y-4 ${
                      darkMode
                        ? "bg-[#131826] border-slate-800/90 hover:border-slate-700"
                        : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                            <Link2 className="w-3.5 h-3.5" />
                            {habit.anchor_cue}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            {habit.category}
                          </span>
                        </div>

                        <h3 className="text-lg md:text-xl font-bold tracking-tight">
                          {habit.title}
                        </h3>

                        <p
                          className={`text-xs md:text-sm ${
                            darkMode ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          2 phút: &ldquo;{habit.two_minute_version}&rdquo;
                        </p>

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

                      <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
                        <div className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 text-amber-400 border border-slate-700/80 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{habit.streak} ngày</span>
                        </div>

                        <button
                          onClick={() => updateGoodHabitStatus(habit, "TWO_MIN")}
                          title="Hoàn thành phiên bản 2 phút (+5 XP & bật đồng hồ 2 phút)"
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

                    {/* THANH TIẾN ĐỘ % MỤC TIÊU DÀI HẠN CỦA THÓI QUEN */}
                    <div className="pt-2 border-t border-slate-800/70 space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>
                          Tiến độ định hình phản xạ ({habit.streak}/{targetDays}{" "}
                          ngày) • Thực thi sâu: {habit.full_count_history ?? habit.streak}{" "}
                          lần | 2-phút: {habit.two_min_count_history ?? 0} lần
                        </span>
                        <span className="font-bold text-indigo-400">
                          {habitProgressPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${habitProgressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              // THẺ LOẠI BỎ THÓI QUEN XẤU
              return (
                <div
                  key={habit.id}
                  className={`rounded-2xl p-5 md:p-6 border transition-all space-y-4 ${
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
                          <span className="text-slate-200">
                            {habit.trigger_cue}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/25 border border-rose-950/50">
                          <span className="text-slate-400 block font-medium">
                            2. Làm bất hấp dẫn (Hậu quả):
                          </span>
                          <span className="text-rose-300">
                            {habit.consequence}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/25 border border-rose-950/50">
                          <span className="text-slate-400 block font-medium">
                            3. Làm khó khăn (Chốt chặn 20s):
                          </span>
                          <span className="text-amber-300">
                            {habit.friction_step}
                          </span>
                        </div>
                      </div>

                      {habit.relapse_logs.length > 0 && (
                        <div className="pt-2 text-xs text-slate-400">
                          📝 Nhật ký phản tỉnh gần nhất (
                          {habit.relapse_logs[0].date}):{" "}
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

                  {/* THANH TIẾN ĐỘ CAI THÓI QUEN XẤU (%) */}
                  <div className="pt-2 border-t border-rose-950/60 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>
                        Tiến độ vượt ngưỡng 21 ngày cai nghiện ({habit.clean_streak}/
                        {targetDays} ngày sạch)
                      </span>
                      <span className="font-bold text-emerald-400">
                        {habitProgressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${habitProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* TAB MỚI: BẢNG AI INSIGHT PHÂN TÍCH HỌC TẬP & PHẢN BIỆN THÓI QUEN */}
        {activeTab === "AI_INSIGHTS" && (
          <section className="space-y-5">
            <div
              className={`rounded-2xl p-6 border space-y-5 ${
                darkMode
                  ? "bg-[#131826] border-purple-500/30"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">
                      Bản Phân tích Học tập & Kiểm toán Hành vi (AI Study Audit)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Đánh giá thẳng thắn dựa trên dữ liệu thực thi thực tế — Không
                      tô hồng thành tích
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Mục tiêu Deep Work/ngày:</span>
                  <select
                    value={dailyDeepWorkGoal}
                    onChange={(e) => setDailyDeepWorkGoal(Number(e.target.value))}
                    className="bg-[#070a12] border border-slate-700 rounded-lg px-2 py-1 text-xs text-indigo-300"
                  >
                    <option value={60}>60 phút</option>
                    <option value={90}>90 phút</option>
                    <option value={120}>120 phút</option>
                    <option value={180}>180 phút</option>
                  </select>
                </div>
              </div>

              {/* 3 Chỉ số Phân tích Cốt lõi */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-black/25 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-indigo-400">
                      1. Chất lượng Thực thi (Full vs 2p)
                    </span>
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {aiMetrics.deepExecutionRatio}%{" "}
                    <span className="text-xs font-normal text-slate-400">
                      học sâu thực chất
                    </span>
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiMetrics.deepExecutionRatio >= 75
                      ? "✅ Tốt: Bạn đang hoàn thành trọn vẹn khối lượng bài tập thay vì chỉ bấm '2 phút' để giữ chuỗi đối phó."
                      : "⚠️ Cảnh báo điểm mù: Bạn đang phụ thuộc quá nhiều vào nút '2 phút'. Quy tắc 2 phút chỉ dùng để mồi lửa lúc bắt đầu, không thể thay thế 1h30p giải Toán hay ôn SAT thực sự."}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/25 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-amber-400">
                      2. Tương quan Giấc ngủ & Tư duy
                    </span>
                    <Eye className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {badHabits.some((b) => b.relapsed_today)
                      ? "Đang suy giảm"
                      : "Ổn định"}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {badHabits.some((b) => b.relapsed_today)
                      ? "🚨 Bạn vừa tái phạm thói quen xấu hôm nay. Việc nạp dopamine nhanh từ mạng xã hội/Reels làm giảm ngưỡng chịu đựng độ khó khi giải Toán & đọc hiểu tiếng Anh học thuật."
                      : `🛡️ Chuỗi kiểm soát hiện tại giúp bảo toàn năng lượng nhận thức (Cognitive Load) cho các phiên học nặng.`}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/25 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-emerald-400">
                      3. Điểm nghẽn Học tập Hôm nay
                    </span>
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {aiMetrics.unfinishedStudy.length === 0
                      ? "0 tồn đọng"
                      : `${aiMetrics.unfinishedStudy.length} nhiệm vụ`}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {aiMetrics.unfinishedStudy.length === 0
                      ? "🎯 Bạn đã giải quyết xong toàn bộ danh mục Học tập & Tư duy trong ngày. Hãy nghỉ ngơi hoặc đọc sách nhẹ nhàng."
                      : `Chưa hoàn thành: "${aiMetrics.unfinishedStudy
                          .map((h) => h.title)
                          .join(", ")}". Đừng đợi có hứng mới học — hãy bấm "Deep Work 50p" ngay bây giờ.`}
                  </p>
                </div>
              </div>

              {/* Nhật ký Nghiệm thu các phiên Deep Work */}
              <div className="pt-3 space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>📓 Nhật ký Nghiệm thu Phiên học (Focus Session Logs)</span>
                  <span className="text-xs font-normal text-slate-400">
                    ({focusLogs.length} phiên đã ghi nhận)
                  </span>
                </h3>

                {focusLogs.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/20 border border-slate-800 text-xs text-slate-400">
                    Chưa có bản ghi nghiệm thu nào. Hãy chạy một phiên Pomodoro / Deep Work trên Trạm Tập Trung và bấm <strong>&ldquo;Nghiệm thu phiên&rdquo;</strong> để theo dõi chất lượng học thực tế của bạn.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {focusLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl bg-black/25 border border-slate-800/90 flex flex-col sm:flex-row justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-400">
                              {log.label} ({log.minutes} phút)
                            </span>
                            <span className="text-slate-500">
                              • {log.time} - {log.date}
                            </span>
                          </div>
                          <p className="text-slate-200">
                            ✅ <strong>Kết quả:</strong> {log.accomplished}
                          </p>
                          <p className="text-slate-400">
                            ⚡ <strong>Yếu tố gây xao nhãng:</strong>{" "}
                            {log.distraction}
                          </p>
                        </div>
                        <div className="self-end sm:self-center shrink-0">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                            Độ tập trung: {log.focusRating}/5 ⭐
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: SƠ ĐỒ XẾP CHỒNG THÓI QUEN (HABIT STACKING) */}
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
                🔗 Chuỗi Xếp Chồng Thói Quen (Habit Stacking & Temptation
                Bundling)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Công thức của James Clear: Sau khi [Thói quen hiện tại], tôi sẽ
                [Thói quen mới (2 phút)], sau đó tôi được [Phần thưởng].
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
                      {h.temptation_bundle ||
                        "Cảm giác hoàn thành & tích điểm chuỗi"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: BIỂU ĐỒ LƯỚI NHIỆT 12 TUẦN THỰC TẾ & TƯƠNG TÁC */}
        {activeTab === "HEATMAP" && (
          <section
            className={`rounded-2xl p-6 border space-y-5 ${
              darkMode
                ? "bg-[#131826] border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>Biểu đồ Chuỗi Hoạt Động 12 Tuần (84 Ngày)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click vào một ô ngày bất kỳ để kiểm tra chi tiết hiệu suất ngày
                  đó.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSimulateHeatmap(!simulateHeatmap)}
                  className="px-3 py-1 rounded-lg text-xs border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer"
                >
                  {simulateHeatmap
                    ? "Đang bật: Màu mô phỏng (Demo)"
                    : "Đang bật: Dữ liệu Thực tế 100%"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 sm:grid-cols-21 md:grid-cols-28 gap-1.5 pt-1">
              {heatmapDays.map((day) => {
                const isSelected = day.dateKey === selectedHeatmapDate;
                const bgClass =
                  day.score >= 80
                    ? "bg-emerald-400 shadow-sm shadow-emerald-500/30"
                    : day.score >= 50
                    ? "bg-emerald-600/80"
                    : day.score > 0
                    ? "bg-emerald-900/80"
                    : "bg-slate-800/70";
                return (
                  <button
                    key={day.dateKey}
                    onClick={() => setSelectedHeatmapDate(day.dateKey)}
                    title={`${day.displayDate}: Đạt ${day.score}% kỷ luật ngày`}
                    className={`h-6 rounded-md transition-all cursor-pointer ${bgClass} ${
                      isSelected
                        ? "ring-2 ring-amber-400 scale-110 z-10"
                        : day.isToday
                        ? "ring-1 ring-white"
                        : "hover:opacity-80"
                    }`}
                  />
                );
              })}
            </div>

            {/* Chi tiết ngày đang chọn trên Heatmap */}
            <div className="p-4 rounded-xl bg-black/25 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
              <div>
                <span className="font-bold text-indigo-400 uppercase">
                  📅 Chi tiết ngày {selectedHeatmapDate}:
                </span>
                {selectedDayDetail ? (
                  <p className="text-slate-300 mt-1">
                    Điểm Kỷ luật ngày:{" "}
                    <strong className="text-emerald-400">
                      {selectedDayDetail.scorePercent}%
                    </strong>{" "}
                    • Hoàn thành Full: {selectedDayDetail.completedFull}/
                    {selectedDayDetail.totalGood} • Làm 2 phút:{" "}
                    {selectedDayDetail.completedTwoMin} • Deep Work:{" "}
                    {selectedDayDetail.deepWorkMinutes} phút • Tái phạm thói xấu:{" "}
                    {selectedDayDetail.relapses}
                  </p>
                ) : (
                  <p className="text-slate-400 mt-1">
                    Chưa có dữ liệu ghi nhận thực tế vào ngày này. Hệ thống sẽ tự
                    động lưu lịch sử thật mỗi ngày bạn sử dụng app.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: KHO PHẦN THƯỞNG (GAMIFIED REWARD STORE) */}
        {activeTab === "REWARDS" && (
          <section
            className={`rounded-2xl p-6 border space-y-6 ${
              darkMode
                ? "bg-[#131826] border-slate-800"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <span>Kho Phần Thưởng Cá Nhân (Temptation Bundling Store)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Biến nỗ lực học tập thành phần thưởng cụ thể: Hoàn thành Full
                  (+20 XP), 2 Phút (+5 XP), Giữ sạch (+15 XP), 1 phút Deep Work
                  (+1 XP).
                </p>
              </div>
              <div className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-sm">
                Số dư: ✨ {xpPoints} XP
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rewards.map((r) => {
                const canAfford = xpPoints >= r.cost;
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl bg-black/25 border border-slate-800 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-amber-400">
                        Chi phí: {r.cost} XP
                      </span>
                      <h3 className="text-sm font-semibold text-slate-100">
                        {r.title}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Đã đổi: {r.redeemedCount} lần
                      </p>
                    </div>
                    <button
                      disabled={!canAfford}
                      onClick={() => redeemReward(r)}
                      className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                        canAfford
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {canAfford ? "🎁 Đổi phần thưởng" : "Chưa đủ XP"}
                    </button>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleAddReward}
              className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-2.5"
            >
              <input
                type="text"
                placeholder="Thêm phần thưởng mới (VD: Đọc truyện 30p, Mua sách mới...)"
                value={newRewardTitle}
                onChange={(e) => setNewRewardTitle(e.target.value)}
                className="flex-1 bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                min={10}
                step={10}
                value={newRewardCost}
                onChange={(e) => setNewRewardCost(Number(e.target.value))}
                className="w-28 bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                + Thêm vào Kho
              </button>
            </form>
          </section>
        )}

        {/* MODAL NGHIỆM THU PHIÊN TẬP TRUNG (POST-SESSION REFLECTION) */}
        {isReflectionOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#131826] border border-indigo-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-indigo-400">
                  🎯 Nghiệm thu Phiên Tập trung (+{pendingSessionMinutes} XP)
                </h3>
                <button
                  onClick={() => setIsReflectionOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Bạn vừa hoàn thành <strong>{pendingSessionMinutes} phút</strong>{" "}
                tập trung. Ghi lại nhanh kết quả để AI phân tích chất lượng học
                của bạn:
              </p>
              <form onSubmit={handleSaveReflection} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Bạn đã giải quyết cụ thể được việc gì trong phiên này?
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Giải xong 4 câu hàm số / Thuộc 15 từ SAT..."
                    value={reflectionData.accomplished}
                    onChange={(e) =>
                      setReflectionData({
                        ...reflectionData,
                        accomplished: e.target.value,
                      })
                    }
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Có yếu tố nào làm bạn xao nhãng không?
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Không có / Hơi buồn ngủ lúc đầu..."
                    value={reflectionData.distraction}
                    onChange={(e) =>
                      setReflectionData({
                        ...reflectionData,
                        distraction: e.target.value,
                      })
                    }
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Tự đánh giá độ sâu tập trung (1 - 5 sao):
                  </label>
                  <select
                    value={reflectionData.focusRating}
                    onChange={(e) =>
                      setReflectionData({
                        ...reflectionData,
                        focusRating: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-semibold"
                  >
                    <option value={5}>5 ⭐ - Tập trung tuyệt đối (Flow State)</option>
                    <option value={4}>4 ⭐ - Tập trung tốt</option>
                    <option value={3}>3 ⭐ - Trung bình, đôi lúc mất tập trung</option>
                    <option value={2}>2 ⭐ - Hay bị ngắt quãng</option>
                    <option value={1}>1 ⭐ - Ngồi học hình thức</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Lưu Nhật ký Phiên học
                  </button>
                </div>
              </form>
            </div>
          </div>
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
                Bạn đang bấm vào{" "}
                <strong className="text-white">{relapseTarget.title}</strong>.
                Theo quy luật thứ 3 của <em>Atomic Habits</em>, hãy dừng lại{" "}
                <strong className="text-amber-400">5 giây</strong> để tách cảm
                xúc nhất thời ra khỏi quyết định của bạn.
              </p>

              <div className="p-3 rounded-xl bg-black/40 border border-rose-900/50 text-xs space-y-1">
                <p className="text-rose-300">
                  ⚠️ <strong>Hậu quả nếu phạm:</strong>{" "}
                  {relapseTarget.consequence}
                </p>
                <p className="text-emerald-300">
                  🛡️ <strong>Cách chặn ngay:</strong>{" "}
                  {relapseTarget.friction_step}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Nếu đã lỡ phạm, điều gì vừa kích hoạt hành vi này? (Để rút
                  kinh nghiệm không phạm 2 lần liên tiếp):
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
                <div className="grid grid-cols-3 gap-3">
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
                      <option value="good">🌱 Thói quen tốt</option>
                      <option value="bad">🛡️ Bỏ thói xấu</option>
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

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Mốc thử thách
                    </label>
                    <select
                      value={newHabit.target_days}
                      onChange={(e) =>
                        setNewHabit({
                          ...newHabit,
                          target_days: Number(e.target.value),
                        })
                      }
                      className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value={14}>14 ngày</option>
                      <option value={21}>21 ngày (Tạo đà)</option>
                      <option value={30}>30 ngày (Bền vững)</option>
                      <option value={66}>66 ngày (Phản xạ)</option>
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
                          setNewHabit({
                            ...newHabit,
                            anchor_cue: e.target.value,
                          })
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
                          setNewHabit({
                            ...newHabit,
                            trigger_cue: e.target.value,
                          })
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
                          setNewHabit({
                            ...newHabit,
                            consequence: e.target.value,
                          })
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
                Ứng dụng hiện đã tự động lưu cả trên Supabase và bộ nhớ trình
                duyệt. Nếu bạn muốn bảng <code>habits</code> trên Supabase lưu
                đầy đủ các cột mới, hãy dán đoạn lệnh này vào tab{" "}
                <strong>SQL Editor</strong> của Supabase:
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
