"use client";

import React, { useEffect, useState, useMemo, useCallback, memo } from "react";
import { createClient } from "@supabase/supabase-js";

// ==========================================
// 1. KHỞI TẠO SUPABASE & HÀM XỬ LÝ NGÀY GIỜ CHUẨN GMT+7
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Lấy chuỗi YYYY-MM-DD chuẩn theo giờ máy (Tránh lỗi lệch 7 tiếng của UTC)
function getLocalDateStr(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Lấy chuỗi ngày hôm qua (YYYY-MM-DD) để kiểm tra đứt chuỗi Streak
function getYesterdayDateStr(todayStr: string): string {
  const [y, m, d] = todayStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return getLocalDateStr(date);
}

// ==========================================
// 2. KIỂU DỮ LIỆU KHỚP VỚI SCHEMA SUPABASE CỦA BẠN
// ==========================================
interface Habit {
  id: string;
  title: string;
  two_minute_version: string | null;
  anchor_cue: string | null;
  streak: number;
  today_status: string | null;
  habit_type: string | null; // 'good' | 'bad'
  category: string | null;
}

interface HabitLog {
  id: string;
  habit_id: string;
  log_date: string; // YYYY-MM-DD
  status: "done" | "two_min";
}

// ==========================================
// 3. COMPONENT ĐỒNG HỒ ĐỘC LẬP (CHỐNG RE-RENDER TOÀN TRANG)
// ==========================================
const LiveClock = memo(function LiveClock({
  onDayChange,
}: {
  onDayChange: (newDateStr: string) => void;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const lastDateRef = React.useRef<string>(getLocalDateStr());

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      const current = new Date();
      setNow(current);
      const currentStr = getLocalDateStr(current);
      // Phát hiện khoảnh khắc bước qua 00:00:00 sang ngày mới
      if (currentStr !== lastDateRef.current) {
        lastDateRef.current = currentStr;
        onDayChange(currentStr);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [onDayChange]);

  if (!now) {
    return (
      <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-400">
        Đang đồng bộ giờ...
      </div>
    );
  }

  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="font-mono text-sm font-bold text-emerald-400 tracking-wider">
        {timeStr}
      </span>
      <span className="text-slate-600">|</span>
      <span className="text-xs font-medium text-slate-300">{dateStr}</span>
    </div>
  );
});

// ==========================================
// 4. COMPONENT TRẠM TẬP TRUNG (POMODORO & 2-MIN RULE)
// ==========================================
const FocusTimer = memo(function FocusTimer({
  onCompleteMinutes,
}: {
  onCompleteMinutes: (mins: number) => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [activeMode, setActiveMode] = useState<number | null>(null); // Số phút của chế độ đang chạy
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (activeMode) onCompleteMinutes(activeMode);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, activeMode, onCompleteMinutes]);

  const startTimer = (mins: number) => {
    setActiveMode(mins);
    setSecondsLeft(mins * 60);
    setIsRunning(true);
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
          <span>⏱️</span> TRẠM TẬP TRUNG PRO (2-MIN RULE & DEEP WORK)
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Áp dụng quy tắc 2 phút để phá vỡ sự trì hoãn hoặc bật Deep Work để tập trung sâu.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {secondsLeft > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-950 border border-indigo-500/40 mr-2">
            <span className="font-mono text-base font-bold text-indigo-300">
              {formatTimer(secondsLeft)}
            </span>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="text-xs px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isRunning ? "Tạm dừng" : "Tiếp tục"}
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                setSecondsLeft(0);
              }}
              className="text-xs text-slate-400 hover:text-rose-400 px-1"
            >
              ✕
            </button>
          </div>
        )}

        <button
          onClick={() => startTimer(2)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-700/50 transition"
        >
          ⚡ Bấm giờ 2 phút
        </button>
        <button
          onClick={() => startTimer(25)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/50 transition"
        >
          🍅 Pomodoro 25p
        </button>
        <button
          onClick={() => startTimer(50)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 transition"
        >
          🔥 Deep Work 50p
        </button>
      </div>
    </div>
  );
});

// ==========================================
// 5. TRANG CHÍNH: ATOMIC HABITS TRACKER
// ==========================================
export default function Home() {
  const [todayStr, setTodayStr] = useState<string>(() => getLocalDateStr());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "good" | "bad">("all");
  const [focusMinutes, setFocusMinutes] = useState<number>(0);

  // State cho Modal thêm thói quen mới
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTwoMin, setNewTwoMin] = useState("");
  const [newAnchor, setNewAnchor] = useState("");
  const [newCategory, setNewCategory] = useState("Học tập");
  const [newType, setNewType] = useState<"good" | "bad">("good");

  // ------------------------------------------
  // HÀM TẢI DỮ LIỆU TỪ SUPABASE
  // ------------------------------------------
  const fetchAllData = useCallback(async () => {
    if (!supabaseUrl || !supabaseKey) {
      setLoading(false);
      return;
    }

    const [habitsRes, logsRes] = await Promise.all([
      supabase.from("habits").select("*").order("created_at", { ascending: true }),
      supabase.from("habit_logs").select("*"),
    ]);

    if (habitsRes.data) setHabits(habitsRes.data as Habit[]);
    if (logsRes.data) setLogs(logsRes.data as HabitLog[]);
    setLoading(false);
  }, []);

  // ------------------------------------------
  // LẮNG NGHE REAL-TIME & SỰ KIỆN ĐỔI NGÀY / MỞ LẠI TAB
  // ------------------------------------------
  useEffect(() => {
    fetchAllData();

    // Kênh WebSocket lắng nghe thay đổi từ máy khác
    const channel = supabase
      .channel("atomic-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habits" },
        () => fetchAllData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_logs" },
        () => fetchAllData()
      )
      .subscribe();

    // Tự động kiểm tra ngày mới khi người dùng mở lại tab sau một đêm
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const currentStr = getLocalDateStr();
        setTodayStr(currentStr);
        fetchAllData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchAllData]);

  // ------------------------------------------
  // THUẬT TOÁN TÍNH STREAK & TRẠNG THÁI HÔM NAY (SỬA LỖI KẸT NGÀY)
  // ------------------------------------------
  const enrichedHabits = useMemo(() => {
    const yesterdayStr = getYesterdayDateStr(todayStr);

    return habits.map((habit) => {
      // Lọc tất cả lịch sử log của thói quen này
      const habitLogs = logs.filter((l) => l.habit_id === habit.id);
      const loggedDates = new Set(habitLogs.map((l) => l.log_date));

      // 1. Trạng thái THỰC TẾ của ngày hôm nay (Dựa vào bảng habit_logs chứ không tin cột today_status cũ)
      const todayLog = habitLogs.find((l) => l.log_date === todayStr);
      const realTodayStatus: "none" | "two_min" | "done" = todayLog
        ? todayLog.status
        : "none";

      // 2. Tính chuỗi Streak liên tiếp chuẩn xác từ lịch sử log
      let calculatedStreak = 0;
      let checkDateStr = "";

      if (loggedDates.has(todayStr)) {
        checkDateStr = todayStr;
      } else if (loggedDates.has(yesterdayStr)) {
        // Hôm nay chưa làm nhưng hôm qua đã làm -> Giữ nguyên chuỗi của hôm qua để chờ hôm nay bấm tiếp
        checkDateStr = yesterdayStr;
      }

      if (checkDateStr) {
        let [y, m, d] = checkDateStr.split("-").map(Number);
        const cursor = new Date(y, m - 1, d);
        while (loggedDates.has(getLocalDateStr(cursor))) {
          calculatedStreak++;
          cursor.setDate(cursor.getDate() - 1);
        }
      }

      // Hỗ trợ tương thích dữ liệu cũ: Nếu bảng habit_logs trước đó chưa kịp lưu nhưng habit.streak = 1
      const finalStreak =
        habitLogs.length === 0 && habit.streak > 0
          ? habit.streak
          : calculatedStreak;

      return {
        ...habit,
        realTodayStatus,
        realStreak: finalStreak,
      };
    });
  }, [habits, logs, todayStr]);

  // ------------------------------------------
  // HÀM CHECK-IN THÓI QUEN (OPTIMISTIC UI + ĐỒNG BỘ 2 BẢNG)
  // ------------------------------------------
  const handleMarkHabit = async (
    habitId: string,
    newStatus: "done" | "two_min" | "none"
  ) => {
    const targetHabit = enrichedHabits.find((h) => h.id === habitId);
    if (!targetHabit) return;

    // 1. Optimistic Update: Cập nhật giao diện ngay lập tức (0ms delay)
    if (newStatus === "none") {
      setLogs((prev) =>
        prev.filter((l) => !(l.habit_id === habitId && l.log_date === todayStr))
      );
    } else {
      setLogs((prev) => {
        const filtered = prev.filter(
          (l) => !(l.habit_id === habitId && l.log_date === todayStr)
        );
        return [
          ...filtered,
          {
            id: "temp-" + Date.now(),
            habit_id: habitId,
            log_date: todayStr,
            status: newStatus,
          },
        ];
      });
    }

    // 2. Tính toán Streak mới để cập nhật đồng bộ xuống cả bảng `habits`
    const wasDoneToday = targetHabit.realTodayStatus !== "none";
    let updatedStreak = targetHabit.realStreak;
    if (!wasDoneToday && newStatus !== "none") {
      updatedStreak = targetHabit.realStreak + 1;
    } else if (wasDoneToday && newStatus === "none") {
      updatedStreak = Math.max(0, targetHabit.realStreak - 1);
    }

    // 3. Ghi xuống Supabase
    if (newStatus === "none") {
      await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", habitId)
        .eq("log_date", todayStr);
    } else {
      // Kiểm tra xem hôm nay đã có log chưa
      const { data: existing } = await supabase
        .from("habit_logs")
        .select("id")
        .eq("habit_id", habitId)
        .eq("log_date", todayStr)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from("habit_logs")
          .update({ status: newStatus })
          .eq("id", existing.id);
      } else {
        await supabase.from("habit_logs").insert({
          habit_id: habitId,
          log_date: todayStr,
          status: newStatus,
        });
      }
    }

    // Cập nhật lại bảng habits để giữ tương thích hoàn toàn với schema cũ của bạn
    await supabase
      .from("habits")
      .update({
        today_status: newStatus,
        streak: updatedStreak,
      })
      .eq("id", habitId);
  };

  // ------------------------------------------
  // HÀM THÊM MỚI & XÓA THÓI QUEN
  // ------------------------------------------
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const { data, error } = await supabase
      .from("habits")
      .insert({
        title: newTitle.trim(),
        two_minute_version: newTwoMin.trim() || "Làm bước đầu tiên trong 2 phút",
        anchor_cue: newAnchor.trim() || "Sau khi thức dậy",
        category: newCategory,
        habit_type: newType,
        streak: 0,
        today_status: "none",
      })
      .select()
      .single();

    if (!error && data) {
      setHabits((prev) => [...prev, data as Habit]);
      setNewTitle("");
      setNewTwoMin("");
      setNewAnchor("");
      setShowAddModal(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    await supabase.from("habit_logs").delete().eq("habit_id", id);
    await supabase.from("habits").delete().eq("id", id);
  };

  // ------------------------------------------
  // TÍNH TOÁN CHỈ SỐ THỐNG KÊ (USEMEMO TỐI ƯU)
  // ------------------------------------------
  const stats = useMemo(() => {
    const total = enrichedHabits.length;
    if (total === 0) {
      return { completedCount: 0, fullCount: 0, twoMinCount: 0, weightedPercent: 0, maxStreak: 0 };
    }

    let fullCount = 0;
    let twoMinCount = 0;
    let maxStreak = 0;

    enrichedHabits.forEach((h) => {
      if (h.realTodayStatus === "done") fullCount++;
      if (h.realTodayStatus === "two_min") twoMinCount++;
      if (h.realStreak > maxStreak) maxStreak = h.realStreak;
    });

    // Trọng số: Hoàn thành Full = 100% điểm, 2-phút khởi động = 35% điểm
    const totalScore = fullCount * 1 + twoMinCount * 0.35;
    const weightedPercent = Math.min(100, Math.round((totalScore / total) * 100));

    return {
      completedCount: fullCount + twoMinCount,
      fullCount,
      twoMinCount,
      weightedPercent,
      maxStreak,
    };
  }, [enrichedHabits]);

  const filteredHabits = useMemo(() => {
    if (filterType === "all") return enrichedHabits;
    return enrichedHabits.filter((h) => (h.habit_type || "good") === filterType);
  }, [enrichedHabits, filterType]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        
        {/* HEADER + ĐỒNG HỒ THỜI GIAN THỰC */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Atomic Habits Tracker
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                PRO SYNC
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Đã kết nối Realtime Supabase • Mốc ngày: {todayStr}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Đồng hồ xem giờ & Tự động nhảy ngày lúc 00:00 */}
            <LiveClock onDayChange={(newDate) => setTodayStr(newDate)} />

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              + Thêm mới
            </button>
          </div>
        </header>

        {/* THANH TIẾN ĐỘ KỶ LUẬT TRỌNG SỐ */}
        <section className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                🎯 TIẾN ĐỘ KỶ LUẬT THỰC CHẤT HÔM NAY (WEIGHTED DAILY PROGRESS)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tính theo trọng số: Hoàn thành Full (100% điểm) • Làm 2 phút khởi động (35% điểm)
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold text-emerald-400">
                {stats.weightedPercent}%
              </span>
              <span className="text-xs text-slate-400 block">hoàn thành</span>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${stats.weightedPercent}%` }}
            />
          </div>
        </section>

        {/* TRẠM TẬP TRUNG PRO */}
        <FocusTimer
          onCompleteMinutes={(mins) => setFocusMinutes((prev) => prev + mins)}
        />

        {/* 4 THẺ CHỈ SỐ TỔNG QUAN */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Hôm nay hoàn thành</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {stats.completedCount}/{enrichedHabits.length}
            </div>
            <span className="text-[11px] text-slate-500">
              Full: {stats.fullCount} • 2-phút: {stats.twoMinCount}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Chuỗi cao nhất</span>
            <div className="text-2xl font-extrabold text-amber-400 mt-1">
              🔥 {stats.maxStreak} <span className="text-sm font-normal">ngày</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Mốc chuẩn tự động hóa: 66 ngày
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Tích lũy Tập trung</span>
            <div className="text-2xl font-extrabold text-teal-400 mt-1">
              ⚡ {focusMinutes} <span className="text-sm font-normal">phút</span>
            </div>
            <span className="text-[11px] text-slate-500">Mục tiêu: 90 phút/ngày</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400">Trạng thái Ngày mới</span>
            <div className="text-lg font-bold text-indigo-300 mt-1.5">
              {todayStr}
            </div>
            <span className="text-[11px] text-slate-500">
              Tự động mở khóa lúc 00:00
            </span>
          </div>
        </section>

        {/* BỘ LỌC DANH SÁCH THÓI QUEN */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterType === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              Tất cả ({enrichedHabits.length})
            </button>
            <button
              onClick={() => setFilterType("good")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterType === "good"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              🌱 Thói quen tốt
            </button>
            <button
              onClick={() => setFilterType("bad")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterType === "bad"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              🛡️ Loại bỏ xấu
            </button>
          </div>
        </div>

        {/* DANH SÁCH THÓI QUEN */}
        <section className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              Đang tải dữ liệu từ Supabase...
            </div>
          ) : filteredHabits.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              Chưa có thói quen nào. Hãy bấm <b>+ Thêm mới</b> ở góc trên để bắt đầu!
            </div>
          ) : (
            filteredHabits.map((habit) => {
              const isDone = habit.realTodayStatus === "done";
              const isTwoMin = habit.realTodayStatus === "two_min";

              return (
                <div
                  key={habit.id}
                  className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isDone
                      ? "bg-emerald-950/20 border-emerald-700/40"
                      : isTwoMin
                      ? "bg-teal-950/20 border-teal-700/40"
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {habit.anchor_cue && (
                        <span className="text-indigo-400 font-medium">
                          🔗 {habit.anchor_cue}
                        </span>
                      )}
                      {habit.category && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                          {habit.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white">{habit.title}</h3>

                    {habit.two_minute_version && (
                      <p className="text-xs text-slate-400">
                        2 phút: &ldquo;{habit.two_minute_version}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* CÁC NÚT TƯƠNG TÁC & STREAK */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold text-amber-400">
                      🔥 {habit.realStreak} ngày
                    </span>

                    <button
                      onClick={() =>
                        handleMarkHabit(
                          habit.id,
                          isTwoMin ? "none" : "two_min"
                        )
                      }
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isTwoMin
                          ? "bg-teal-500 text-slate-950 font-bold"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                      }`}
                    >
                      ⚡ 2 phút
                    </button>

                    <button
                      onClick={() =>
                        handleMarkHabit(habit.id, isDone ? "none" : "done")
                      }
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isDone
                          ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                          : "bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200"
                      }`}
                    >
                      {isDone ? "✓ Đã xong (Bấm để hoàn tác)" : "○ Đánh dấu Xong"}
                    </button>

                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      title="Xóa thói quen"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* MODAL THÊM THÓI QUEN MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddHabit}
            className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Thêm Thói Quen Mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Tên thói quen *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Luyện Speaking qua Luyennoi"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Phiên bản 2 phút (2-Minute Rule)
                </label>
                <input
                  type="text"
                  placeholder="VD: Làm 1 test part 3"
                  value={newTwoMin}
                  onChange={(e) => setNewTwoMin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Neo thói quen (Habit Stacking Cue)
                </label>
                <input
                  type="text"
                  placeholder="VD: Sau khi làm xong Mochi và web 10SAT"
                  value={newAnchor}
                  onChange={(e) => setNewAnchor(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Danh mục
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Loại thói quen
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "good" | "bad")}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="good">Thói quen tốt</option>
                    <option value="bad">Loại bỏ xấu</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Lưu thói quen
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
