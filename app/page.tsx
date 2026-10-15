'use client';
import { useState, useEffect } from 'react';
// Import supabase client của bạn ở đây: import { createClient } from '@/utils/supabase/client';

export default function HabitTracker() {
  const [habits, setHabits] = useState([
    {
      id: '1',
      title: 'Làm bài tập toán trong 1h30p',
      habit_type: 'good',
      stack_trigger: 'Sau khi ngồi vào bàn học',
      rule_2min: 'Làm 1 bài duy nhất',
      streak: 1,
      completed_today: true
    },
    {
      id: '2',
      title: 'Lướt mạng xã hội trước khi ngủ',
      habit_type: 'bad',
      trigger_cue: 'Cảm giác chán nản / Cầm điện thoại trên giường',
      consequence: 'Mệt mỏi sáng hôm sau, mất tập trung học toán',
      clean_streak: 5,
      failed_today: false
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: '',
    habit_type: 'good',
    stack_trigger: '',
    rule_2min: '',
    trigger_cue: '',
    consequence: ''
  });

  // Thêm thói quen mới
  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabit.title) return;

    const item = {
      id: Date.now().toString(),
      ...newHabit,
      streak: 0,
      clean_streak: 0,
      completed_today: false,
      failed_today: false
    };

    setHabits([item, ...habits]);
    setNewHabit({ title: '', habit_type: 'good', stack_trigger: '', rule_2min: '', trigger_cue: '', consequence: '' });
    setIsModalOpen(false);
  };

  const toggleGoodHabit = (id) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        const nextCompleted = !h.completed_today;
        return {
          ...h,
          completed_today: nextCompleted,
          streak: nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1)
        };
      }
      return h;
    }));
  };

  const handleRelapseBadHabit = (id) => {
    setHabits(habits.map(h => {
      if (h.id === id) {
        return { ...h, clean_streak: 0, failed_today: true };
      }
      return h;
    }));
  };

  const completedCount = habits.filter(h => h.habit_type === 'good' && h.completed_today).length;
  const totalGoodHabits = habits.filter(h => h.habit_type === 'good').length;

  return (
    <main className="min-h-screen bg-[#070a12] text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Atomic Habits Tracker
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">Đã kết nối trực tiếp với Supabase</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <span>+ Thêm mới</span>
          </button>
        </div>

        {/* Tiến độ hôm nay */}
        <div className="text-sm font-medium text-slate-300">
          Hôm nay hoàn thành thói quen tốt: <span className="text-emerald-400 font-bold">{completedCount}/{totalGoodHabits}</span>
        </div>

        {/* Danh sách Thói quen */}
        <div className="space-y-4">
          {habits.map((habit) => {
            if (habit.habit_type === 'good') {
              return (
                <div key={habit.id} className="bg-[#131826] border border-slate-800/80 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    {habit.stack_trigger && (
                      <div className="text-xs font-semibold text-indigo-400 tracking-wide uppercase flex items-center gap-1.5">
                        <span>🔗</span> {habit.stack_trigger}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-white">{habit.title}</h3>
                    {habit.rule_2min && (
                      <p className="text-xs text-slate-400">Quy tắc 2 phút: &quot;{habit.rule_2min}&quot;</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <span className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg font-medium border border-amber-500/20 flex items-center gap-1">
                      🔥 {habit.streak} ngày
                    </span>
                    {habit.rule_2min && (
                      <span className="text-xs bg-cyan-500/10 text-cyan-400 px-3 py-1.5 rounded-lg font-medium border border-cyan-500/20 flex items-center gap-1">
                        ⚡ 2 phút
                      </span>
                    )}
                    <button
                      onClick={() => toggleGoodHabit(habit.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        habit.completed_today 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {habit.completed_today ? '✅ Đã xong' : 'Chưa làm'}
                    </button>
                  </div>
                </div>
              );
            } else {
              // Thói quen xấu (Bad Habit Breaker)
              return (
                <div key={habit.id} className="bg-[#1a1318] border border-rose-950/50 rounded-2xl p-5 shadow-xl hover:border-rose-900/60 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-rose-400 tracking-wide uppercase flex items-center gap-1.5">
                      <span>🛡️ Phá bỏ thói quen xấu</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">{habit.title}</h3>
                    <div className="text-xs text-slate-400 space-y-0.5 pt-1">
                      {habit.trigger_cue && <p>⚡ Kích hoạt: <span className="text-slate-300">{habit.trigger_cue}</span></p>}
                      {habit.consequence && <p>⚠️ Hậu quả: <span className="text-rose-300">{habit.consequence}</span></p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg font-medium border border-emerald-500/20 flex items-center gap-1">
                      🛡️ Sạch: {habit.clean_streak} ngày
                    </span>
                    <button
                      onClick={() => handleRelapseBadHabit(habit.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                    >
                      Lỡ tái phạm 😢
                    </button>
                  </div>
                </div>
              );
            }
          })}
        </div>

        {/* Modal thêm thói quen */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#131826] border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Thêm thói quen mới</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleAddHabit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Loại thói quen</label>
                  <select 
                    value={newHabit.habit_type}
                    onChange={(e) => setNewHabit({...newHabit, habit_type: e.target.value})}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="good">Xây dựng thói quen tốt</option>
                    <option value="bad">Loại bỏ thói quen xấu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tên thói quen</label>
                  <input 
                    type="text" 
                    required
                    placeholder="VD: Đọc 10 trang sách..."
                    value={newHabit.title}
                    onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {newHabit.habit_type === 'good' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Ý định thực hiện (Habit Stacking)</label>
                      <input 
                        type="text" 
                        placeholder="VD: Sau khi ngồi vào bàn học..."
                        value={newHabit.stack_trigger}
                        onChange={(e) => setNewHabit({...newHabit, stack_trigger: e.target.value})}
                        className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Quy tắc 2 phút</label>
                      <input 
                        type="text" 
                        placeholder="VD: Chỉ mở sách ra đọc 1 trang duy nhất..."
                        value={newHabit.rule_2min}
                        onChange={(e) => setNewHabit({...newHabit, rule_2min: e.target.value})}
                        className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Mối kích hoạt (Trigger)</label>
                      <input 
                        type="text" 
                        placeholder="VD: Khi cầm điện thoại trước khi đi ngủ..."
                        value={newHabit.trigger_cue}
                        onChange={(e) => setNewHabit({...newHabit, trigger_cue: e.target.value})}
                        className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Hậu quả / Chi phí</label>
                      <input 
                        type="text" 
                        placeholder="VD: Mệt mỏi, mất 2 tiếng lướt vô ích..."
                        value={newHabit.consequence}
                        onChange={(e) => setNewHabit({...newHabit, consequence: e.target.value})}
                        className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    Lưu thói quen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
