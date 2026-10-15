"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Flame, Link2, Moon, Sun, Plus } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jpkuwrffwkgpuqqpyplb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impwa3V3cmZmd2tncHVxcXB5cGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNDU1NzEsImV4cCI6MjEwNzYyMTU3MX0.2P0Wm2jdQ0GnrDaSmf8mekQ5ojlMjvL-UcX3qI4iNVI";
const supabase = createClient(supabaseUrl, supabaseKey);

type LogStatus = "NONE" | "FULL" | "TWO_MIN";

interface Habit {
  id: string;
  title: string;
  two_minute_version: string;
  anchor_cue: string;
  streak: number;
  today_status: LogStatus;
}

export default function AtomicDashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTwoMin, setNewTwoMin] = useState("");
  const [newCue, setNewCue] = useState("");

  useEffect(() => {
    fetchHabits();
  }, []);

  async function fetchHabits() {
    setLoading(true);
    const { data, error } = await supabase.from("habits").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setHabits(data);
    }
    setLoading(false);
  }

  async function handleToggle(id: string, status: LogStatus) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const newStatus = habit.today_status === status ? "NONE" : status;
    const newStreak = newStatus !== "NONE" ? habit.streak + 1 : Math.max(0, habit.streak - 1);

    const { error } = await supabase
      .from("habits")
      .update({ today_status: newStatus, streak: newStreak })
      .eq("id", id);

    if (!error) {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, today_status: newStatus, streak: newStreak } : h));
    }
  }

  async function addNewHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newCue) return;

    const newHabitPayload = {
      title: newTitle,
      two_minute_version: newTwoMin || "Làm phiên bản cực nhỏ trong 2 phút",
      anchor_cue: newCue,
      streak: 0,
      today_status: "NONE" as LogStatus
    };

    const { data, error } = await supabase.from("habits").insert([newHabitPayload]).select();
    if (!error && data) {
      setHabits([data[0], ...habits]);
      setNewTitle("");
      setNewTwoMin("");
      setNewCue("");
      setShowModal(false);
    }
  }

  const completedCount = habits.filter(h => h.today_status !== "NONE").length;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10 font-sans transition-colors">
        <div className="max-w-3xl mx-auto space-y-6">
          <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">🔥 Atomic Habits Tracker</h1>
              <p className="text-xs text-slate-500 mt-1">Đã kết nối trực tiếp với Supabase</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowModal(true)} className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1">
                <Plus className="w-4 h-4" /> Thêm mới
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold">
                {darkMode ? <Sun className="w-4 h-4 inline text-amber-400" /> : <Moon className="w-4 h-4 inline" />}
              </button>
            </div>
          </header>

          <div className="text-sm font-medium text-slate-500">
            Hôm nay hoàn thành: <span className="text-emerald-500 font-bold">{completedCount}/{habits.length}</span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-slate-500 text-sm">Đang tải dữ liệu từ đám mây...</div>
          ) : habits.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
              Chưa có thói quen nào trên mây. Hãy bấm "Thêm mới" để bắt đầu!
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map(habit => (
                <div key={habit.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                  <div className="space-y-1">
                    <div className="text-xs text-indigo-500 font-medium flex items-center gap-1">
                      <Link2 className="w-3 h-3" /> {habit.anchor_cue}
                    </div>
                    <h3 className="text-base font-bold">{habit.title}</h3>
                    <div className="text-xs text-slate-400">2 phút: "{habit.two_minute_version}"</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> {habit.streak} ngày
                    </span>
                    <button 
                      onClick={() => handleToggle(habit.id, "TWO_MIN")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${habit.today_status === "TWO_MIN" ? "bg-amber-500 text-slate-950 border-amber-500" : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"}`}
                    >
                      ⚡ 2 phút
                    </button>
                    <button 
                      onClick={() => handleToggle(habit.id, "FULL")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${habit.today_status === "FULL" ? "bg-emerald-500 text-slate-950" : "bg-indigo-600 text-white hover:bg-indigo-500"}`}
                    >
                      <CheckCircle2 className="w-4 h-4 inline mr-1" /> {habit.today_status === "FULL" ? "Đã xong" : "Hoàn thành"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold">Thêm Thói quen Nguyên tử mới</h3>
                <form onSubmit={addNewHabit} className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tín hiệu ghép nối (Anchor Cue)</label>
                    <input 
                      type="text" 
                      placeholder="VD: Sau khi ngồi vào bàn học lúc 19:30" 
                      value={newCue} 
                      onChange={e => setNewCue(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-700 text-xs" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Tên thói quen chính</label>
                    <input 
                      type="text" 
                      placeholder="VD: Giải 3 bài tập Giải tích" 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-700 text-xs" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Quy tắc 2 phút (Phiên bản cực dễ)</label>
                    <input 
                      type="text" 
                      placeholder="VD: Mở vở nháp và chép đề 1 bài" 
                      value={newTwoMin} 
                      onChange={e => setNewTwoMin(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-700 text-xs" 
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold">Hủy</button>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">Lưu vào Database</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
