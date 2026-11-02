import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutGrid, Timer, ArrowLeft, Plus, ChevronLeft, ChevronRight, ChevronDown, Check,
  Lightbulb, Utensils, ClipboardList, Dumbbell, Music, Trash2, Calendar, X,
  Lock, LogOut, KeyRound,
} from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const API = `${API_BASE}/api/todos`

const CATEGORIES = [
  { name: 'Idea', icon: Lightbulb },
  { name: 'Food', icon: Utensils },
  { name: 'Work', icon: ClipboardList },
  { name: 'Sport', icon: Dumbbell },
  { name: 'Music', icon: Music },
]
const iconOf = (name) => (CATEGORIES.find((c) => c.name === name) || CATEGORIES[0]).icon

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December']

const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const isoWeek = (d) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t - y0) / 86400000 + 1) / 7)
}

function Phone({ children, className = '', toast, onCloseToast }) {
  return (
    <div className={`relative w-[340px] max-w-full h-[700px] rounded-[38px] bg-white overflow-hidden shadow-[0_20px_50px_rgba(60,130,230,0.22)] ${className}`}>
      {toast && (
        <div className="absolute top-4 inset-x-4 z-[70] flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl shadow-lg border backdrop-blur-md animate-pop transition-all bg-white/95 border-neutral-200/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'delete' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'
            }`}>
              {toast.type === 'delete' ? <Trash2 size={13} /> : <Check size={13} strokeWidth={3} />}
            </div>
            <p className="text-[12px] font-medium text-neutral-800 truncate">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseToast}
            className="text-neutral-400 hover:text-neutral-600 shrink-0 p-0.5"
          >
            <X size={14} />
          </button>
        </div>
      )}
      {children}
    </div>
  )
}

function DateChips({ selected, onSelect, gray, month }) {
  const scrollRef = useRef(null)
  const activeRef = useRef(null)

  // Days of the active month
  const dates = useMemo(() => {
    const m = month || parse(selected)
    const year = m.getFullYear()
    const mon = m.getMonth()
    const totalDays = new Date(year, mon + 1, 0).getDate()
    return Array.from({ length: totalDays }, (_, i) => new Date(year, mon, i + 1))
  }, [month])

  // Center active date on mount or when selected/month changes
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selected, month])

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -160 : 160
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  return (
    <div className="flex items-center gap-1 w-full">
      <button
        type="button"
        aria-label="Previous dates"
        onClick={() => scroll('left')}
        className="w-5 h-[48px] flex items-center justify-center text-neutral-400 hover:text-brand hover:bg-soft/70 rounded transition shrink-0"
      >
        <ChevronLeft size={16} />
      </button>

      <div
        ref={scrollRef}
        className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1"
      >
        {dates.map((d) => {
          const dStr = fmt(d)
          const active = dStr === selected
          const inactive = gray
            ? 'bg-[#d9d9d9] text-neutral-600 hover:bg-[#cfcfcf]'
            : 'bg-soft-2 text-brand-dark hover:bg-soft'
          return (
            <button
              key={dStr}
              ref={active ? activeRef : null}
              type="button"
              onClick={() => onSelect(d)}
              className={`shrink-0 w-[50px] h-[48px] rounded-lg flex flex-col items-center justify-center leading-tight transition-all duration-200 hover:scale-105 active:scale-95 ${
                active
                  ? 'bg-brand text-white shadow-md shadow-brand/40 font-semibold'
                  : inactive
              }`}
            >
              <span className="text-[14px] font-semibold">{d.getDate()}</span>
              <span className="text-[10px] font-normal">{DAYS[d.getDay()]}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        aria-label="Next dates"
        onClick={() => scroll('right')}
        className="w-5 h-[48px] flex items-center justify-center text-neutral-400 hover:text-brand hover:bg-soft/70 rounded transition shrink-0"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

function TopBar({ title, light, back, onBack, workspace, onSwitchWorkspace }) {
  return (
    <div className={`flex items-center justify-between px-6 pt-7 ${light ? 'text-white' : 'text-neutral-800'}`}>
      {back ? (
        <button type="button" aria-label="Back" onClick={onBack} className="hover:-translate-x-0.5 transition"><ArrowLeft size={18} /></button>
      ) : workspace ? (
        <button
          type="button"
          onClick={onSwitchWorkspace}
          title="Ganti Ruang / Keluar"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition active:scale-95 shadow-sm ${
            light ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-soft hover:bg-soft-2 text-brand-dark'
          }`}
        >
          <Lock size={11} />
          <span className="max-w-[70px] truncate">{workspace}</span>
          <LogOut size={10} className="opacity-80" />
        </button>
      ) : <LayoutGrid size={16} />}
      <h2 className="text-[15px] font-medium">{title}</h2>
      <Timer size={18} />
    </div>
  )
}

export default function App() {
  const today = useMemo(() => fmt(new Date()), [])
  const [workspace, setWorkspace] = useState(() => {
    try {
      return localStorage.getItem('todo_workspace') || ''
    } catch {
      return ''
    }
  })
  const [inputWorkspace, setInputWorkspace] = useState('')
  const [todos, setTodos] = useState([])
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(today)
  const [stripStart, setStripStart] = useState(parse(today))
  const [category, setCategory] = useState('Idea')
  const [menuOpen, setMenuOpen] = useState(false)
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [startT, setStartT] = useState('09:00')
  const [endT, setEndT] = useState('10:00')
  const [now, setNow] = useState(new Date())
  const nameRef = useRef(null)

  const handleEnterWorkspace = (e) => {
    e.preventDefault()
    const trimmed = inputWorkspace.trim().toLowerCase()
    if (!trimmed) return
    setWorkspace(trimmed)
    try {
      localStorage.setItem('todo_workspace', trimmed)
    } catch {}
    setInputWorkspace('')
    showToast(`Masuk ke ruang "${trimmed}"`, 'success')
  }

  const handleSwitchWorkspace = () => {
    const prev = workspace
    setWorkspace('')
    try {
      localStorage.removeItem('todo_workspace')
    } catch {}
    setTodos([])
    showToast(`Keluar dari ruang "${prev}"`, 'delete')
  }

  const pageFromHash = () => {
    const h = window.location.hash.replace('#/', '')
    return ['activity', 'create'].includes(h) ? h : 'home'
  }
  const [page, setPage] = useState(pageFromHash)
  const go = (p) => { window.location.hash = p === 'home' ? '' : `/${p}`; setPage(p) }
  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const request = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-workspace': workspace || 'default',
      ...(options.headers || {}),
    }
    const res = await fetch(url, { ...options, headers })
    if (!res.ok) throw new Error('Request failed')
    return res.status === 204 ? null : res.json()
  }

  const saveTodosCache = (data) => {
    if (!workspace) return
    try { localStorage.setItem(`todos_cache_${workspace}`, JSON.stringify(data)) } catch {}
  }

  useEffect(() => {
    if (!workspace) return
    const cacheKey = `todos_cache_${workspace}`
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) setTodos(JSON.parse(cached))
      else setTodos([])
    } catch {}

    request(API)
      .then((data) => {
        if (Array.isArray(data)) {
          setTodos(data)
          saveTodosCache(data)
        }
      })
      .catch(() => setError('Cannot connect to server'))
  }, [workspace])

  const [showCalendarModal, setShowCalendarModal] = useState(false)

  const pick = (d) => { setSelected(fmt(d)); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)) }
  const pickFromCalendar = (d) => { pick(d); setStripStart(d); setShowCalendarModal(false) }

  const prevMonth = () => {
    const newM = new Date(month.getFullYear(), month.getMonth() - 1, 1)
    setMonth(newM)
    setSelected(fmt(newM))
  }

  const nextMonth = () => {
    const newM = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    setMonth(newM)
    setSelected(fmt(newM))
  }

  const create = async (e) => {
    e.preventDefault()
    if (!name.trim()) { nameRef.current?.focus(); return }

    const tempId = Date.now()
    const tempTask = {
      id: tempId,
      title: name.trim(),
      description: desc.trim(),
      category,
      date: selected,
      start_time: startT,
      end_time: endT,
      done: false,
      created_at: new Date().toISOString(),
    }

    // 1. Instant optimistic add and go to home
    const next = [...todos, tempTask]
    setTodos(next)
    saveTodosCache(next)
    setName('')
    setDesc('')
    setError('')
    go('home')
    showToast('Tugas baru berhasil dibuat!', 'success')

    // 2. Background sync to database
    try {
      const saved = await request(API, {
        method: 'POST',
        body: JSON.stringify({
          title: tempTask.title,
          description: tempTask.description,
          category: tempTask.category,
          date: tempTask.date,
          start_time: tempTask.start_time,
          end_time: tempTask.end_time,
        }),
      })
      if (saved && saved.id) {
        setTodos((curr) => {
          const updated = curr.map((x) => (x.id === tempId ? saved : x))
          saveTodosCache(updated)
          return updated
        })
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const [confirmTask, setConfirmTask] = useState(null)
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ message, type })
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const toggle = async (t) => {
    const updatedDone = !t.done
    // 1. Instant optimistic update (0ms UI reaction)
    const next = todos.map((x) => (x.id === t.id ? { ...x, done: updatedDone } : x))
    setTodos(next)
    saveTodosCache(next)

    // 2. Background sync to database
    try {
      const u = await request(`${API}/${t.id}`, {
        method: 'PUT',
        body: JSON.stringify({ done: updatedDone }),
      })
      if (u && u.id) {
        setTodos((curr) => {
          const updated = curr.map((x) => (x.id === u.id ? u : x))
          saveTodosCache(updated)
          return updated
        })
      }
    } catch (err) {
      // Revert if failed
      setTodos(todos)
      saveTodosCache(todos)
      setError(err.message)
    }
  }

  const handleToggle = (t) => {
    if (!t.done) {
      setConfirmTask(t)
    } else {
      toggle(t)
    }
  }

  const confirmComplete = () => {
    if (confirmTask) {
      const title = confirmTask.title
      toggle(confirmTask)
      setConfirmTask(null)
      showToast(`Tugas "${title}" selesai!`, 'success')
    }
  }

  const confirmDelete = () => {
    if (deleteTaskConfirm) {
      const title = deleteTaskConfirm.title
      remove(deleteTaskConfirm.id)
      setDeleteTaskConfirm(null)
      showToast(`Tugas "${title}" berhasil dihapus`, 'delete')
    }
  }

  const remove = async (id) => {
    const prev = todos
    const next = todos.filter((t) => t.id !== id)
    // Instant optimistic removal (0ms UI reaction)
    setTodos(next)
    saveTodosCache(next)

    try {
      await request(`${API}/${id}`, { method: 'DELETE' })
    } catch (err) {
      setTodos(prev)
      saveTodosCache(prev)
      setError(err.message)
    }
  }

  const dayTasks = todos
    .filter((t) => t.date === selected)
    .sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1
      }
      return a.start_time.localeCompare(b.start_time)
    })
  const countOf = (c) => todos.filter((t) => t.category === c).length

  const sel = parse(selected)
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const isCurrent = (t) => !t.done && t.date === today && t.start_time <= hhmm && hhmm < t.end_time

  // calendar grid (Monday first)
  const weeks = useMemo(() => {
    const first = new Date(month)
    const offset = (first.getDay() + 6) % 7
    const gridStart = addDays(first, -offset)
    return Array.from({ length: 6 }, (_, w) => {
      const days = Array.from({ length: 7 }, (_, i) => addDays(gridStart, w * 7 + i))
      return { week: isoWeek(days[0]), days }
    })
  }, [month])

  const CatIcon = iconOf(category)

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      {!workspace ? (
        <Phone toast={toast} onCloseToast={() => setToast(null)}>
          <div className="absolute inset-x-0 top-0 h-[225px] bg-brand flex flex-col justify-between p-6 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold tracking-wide uppercase opacity-90">To-Do List</span>
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Lock size={15} />
              </div>
            </div>
            <div>
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                <KeyRound size={22} className="text-white" />
              </div>
              <h1 className="text-[22px] font-bold leading-tight">Ruang Pribadi</h1>
              <p className="text-[12px] opacity-90 mt-1">Masukkan nama ruang atau kode PIN Anda</p>
            </div>
          </div>

          <div className="absolute inset-x-0 top-[195px] bottom-0 bg-white rounded-t-[30px] p-6 flex flex-col justify-between">
            <form onSubmit={handleEnterWorkspace} className="flex-1 flex flex-col pt-2">
              <label htmlFor="room-input" className="text-[12px] font-semibold text-neutral-700 mb-1.5">
                Nama Ruang / Kode PIN
              </label>
              <div className="relative">
                <input
                  id="room-input"
                  type="text"
                  value={inputWorkspace}
                  onChange={(e) => setInputWorkspace(e.target.value)}
                  placeholder="misal: anggi atau 1234"
                  autoFocus
                  required
                  className="w-full h-[46px] rounded-xl border border-neutral-300 focus:border-brand px-3.5 text-[14px] font-medium outline-none transition shadow-sm focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <p className="text-[11px] text-neutral-500 mt-3 leading-relaxed">
                💡 <strong>Setiap orang punya ruangnya sendiri.</strong> Tugas Anda hanya dapat dilihat dan diubah oleh mereka yang mengetahui nama ruang atau PIN yang sama.
              </p>

              <button
                type="submit"
                id="btn-enter-room"
                className="mt-6 w-full h-[46px] rounded-xl bg-brand text-white text-[13px] font-semibold hover:bg-brand-dark shadow-md shadow-brand/30 active:scale-[0.98] transition flex items-center justify-center gap-2"
              >
                <span>Buka Tugas Saya</span>
                <ChevronRight size={16} />
              </button>

              <div className="mt-auto p-3.5 rounded-xl bg-soft border border-soft-2 text-[11px] text-neutral-600 leading-relaxed">
                <p className="font-semibold text-brand-dark mb-1">Tips:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Tidak perlu registrasi atau password ribet.</li>
                  <li>Ingin berbagi tugas bersama tim/keluarga? Cukup gunakan nama ruang yang sama!</li>
                </ul>
              </div>
            </form>
          </div>
        </Phone>
      ) : (
        <>
          {/* Page 1: Today */}
          {page === 'home' && <Phone toast={toast} onCloseToast={() => setToast(null)}>
            <div className="absolute inset-x-0 top-0 h-[235px] bg-brand">
              <TopBar
                title={`${sel.getDate()} ${MONTHS[sel.getMonth()] === 'September' ? 'Sept' : MONTHS[sel.getMonth()].slice(0, 3)}`}
                light
                workspace={workspace}
                onSwitchWorkspace={handleSwitchWorkspace}
              />
          <div className="flex items-end justify-between px-6 mt-8">
            <div className="text-white">
              <p className="text-[22px] font-medium leading-none">
                {selected === today ? 'Today' : DAYS[sel.getDay()]}
              </p>
              <p className="text-[11px] mt-1 opacity-90">{dayTasks.length} Tasks</p>
            </div>
            <button
              id="add-new"
              onClick={() => go('activity')}
              className="bg-white text-brand-dark text-[12px] font-medium rounded-md px-5 py-2 shadow hover:scale-105 active:scale-95 transition"
            >
              Add New
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 top-[170px] bottom-0 bg-white rounded-t-[30px] px-5 pt-4 flex flex-col">
          {/* Month Selector Bar */}
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                id="btn-prev-month"
                onClick={prevMonth}
                aria-label="Bulan sebelumnya"
                className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:text-brand hover:bg-soft transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[13px] font-semibold text-neutral-800 min-w-[105px] text-center">
                {MONTHS[month.getMonth()]} {month.getFullYear()}
              </span>
              <button
                type="button"
                id="btn-next-month"
                onClick={nextMonth}
                aria-label="Bulan berikutnya"
                className="w-6 h-6 flex items-center justify-center rounded text-neutral-500 hover:text-brand hover:bg-soft transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              type="button"
              id="btn-open-calendar"
              onClick={() => setShowCalendarModal(true)}
              className="flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand-dark bg-soft hover:bg-soft-2 px-2.5 py-1 rounded-lg transition active:scale-95"
            >
              <Calendar size={13} />
              <span>Kalender</span>
            </button>
          </div>

          <DateChips selected={selected} onSelect={pick} month={month} />
          <h3 className="text-[15px] font-semibold mt-4 mb-2.5">My Tasks</h3>
          <ul className="flex-1 overflow-y-auto space-y-3 pb-5 pr-1">
            {dayTasks.length === 0 && (
              <li className="text-center text-neutral-400 text-sm mt-10">No tasks for this day</li>
            )}
            {dayTasks.map((t, idx) => {
              const cur = isCurrent(t)
              const prev = dayTasks[idx - 1]
              const showDivider = t.done && prev && !prev.done
              return (
                <div key={t.id} className="contents">
                  {showDivider && (
                    <li className="list-none flex items-center gap-2 py-1">
                      <div className="flex-1 h-px bg-neutral-200" />
                      <span className="text-[10px] font-medium text-neutral-400">Selesai</span>
                      <div className="flex-1 h-px bg-neutral-200" />
                    </li>
                  )}
                  <li
                    className={`animate-pop group flex items-center gap-2 rounded-md px-3 py-2.5 shadow-sm transition-all duration-300 ${
                      t.done
                        ? 'bg-neutral-100/70 border border-neutral-200/50 opacity-70'
                        : cur
                        ? 'bg-brand text-white'
                        : 'bg-soft'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-[8px] ${cur && !t.done ? 'text-white/80' : 'text-neutral-500'}`}>
                        {t.start_time} - {t.end_time}
                      </p>
                      <p className={`text-[12px] font-semibold truncate ${t.done ? 'line-through text-neutral-500' : cur ? 'text-white' : 'text-neutral-800'}`}>
                        {t.title}
                      </p>
                      {t.description && (
                        <p className={`text-[8px] truncate ${cur && !t.done ? 'text-white/80' : 'text-neutral-500'}`}>{t.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteTaskConfirm(t)}
                      aria-label="Delete task"
                      className="opacity-0 group-hover:opacity-100 transition text-red-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => handleToggle(t)}
                      aria-label={t.done ? "Tandai belum selesai" : "Tandai selesai"}
                      className={`h-[18px] w-[18px] rounded-[4px] border flex items-center justify-center transition ${
                        t.done ? 'bg-brand border-brand text-white' : cur ? 'border-white/80' : 'border-neutral-400 bg-white hover:border-brand'
                      }`}
                    >
                      {t.done && <Check size={12} strokeWidth={3} />}
                    </button>
                  </li>
                </div>
              )
            })}
          </ul>
        </div>

        {/* Confirmation Modal */}
        {confirmTask && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6 animate-pop">
            <div className="bg-white rounded-2xl p-5 w-full max-w-[280px] shadow-2xl border border-soft-2 text-center animate-pop">
              <div className="w-12 h-12 rounded-full bg-soft mx-auto flex items-center justify-center text-brand mb-3 shadow-inner">
                <Check size={24} strokeWidth={2.5} />
              </div>
              <h4 className="text-[15px] font-semibold text-neutral-800">
                Selesaikan Tugas?
              </h4>
              <p className="text-[12px] text-neutral-500 mt-1.5 mb-5 leading-relaxed">
                Apakah Anda yakin tugas <span className="font-semibold text-neutral-800">"{confirmTask.title}"</span> sudah selesai? Tugas ini akan dipindahkan ke bawah.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  id="btn-cancel-confirm"
                  onClick={() => setConfirmTask(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 text-neutral-600 text-[12px] font-medium hover:bg-neutral-50 active:scale-95 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="btn-confirm-done"
                  onClick={confirmComplete}
                  className="flex-1 py-2 px-3 rounded-lg bg-brand text-white text-[12px] font-medium hover:bg-brand-dark shadow-sm shadow-brand/30 active:scale-95 transition"
                >
                  Ya, Selesai
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTaskConfirm && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-6 animate-pop">
            <div className="bg-white rounded-2xl p-5 w-full max-w-[280px] shadow-2xl border border-soft-2 text-center animate-pop">
              <div className="w-12 h-12 rounded-full bg-red-50 mx-auto flex items-center justify-center text-red-500 mb-3 shadow-inner">
                <Trash2 size={24} strokeWidth={2} />
              </div>
              <h4 className="text-[15px] font-semibold text-neutral-800">
                Hapus Tugas?
              </h4>
              <p className="text-[12px] text-neutral-500 mt-1.5 mb-5 leading-relaxed">
                Apakah Anda yakin ingin menghapus tugas <span className="font-semibold text-neutral-800">"{deleteTaskConfirm.title}"</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  id="btn-cancel-delete"
                  onClick={() => setDeleteTaskConfirm(null)}
                  className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 text-neutral-600 text-[12px] font-medium hover:bg-neutral-50 active:scale-95 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete"
                  onClick={confirmDelete}
                  className="flex-1 py-2 px-3 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[12px] font-medium shadow-sm shadow-red-500/30 active:scale-95 transition"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Popup Modal */}
        {showCalendarModal && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-pop">
            <div className="bg-white rounded-2xl p-4 w-full max-w-[290px] shadow-2xl border border-soft-2 animate-pop">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    className="p-1 rounded text-neutral-500 hover:text-brand hover:bg-soft transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-[13px] font-semibold text-neutral-800">
                    {MONTHS[month.getMonth()]} {month.getFullYear()}
                  </span>
                  <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    className="p-1 rounded text-neutral-500 hover:text-brand hover:bg-soft transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  id="btn-close-calendar"
                  onClick={() => setShowCalendarModal(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-y-1.5 text-center text-[10px]">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d, i) => (
                  <span key={d} className={i > 4 ? 'text-brand font-medium' : 'text-neutral-500 font-medium'}>{d}</span>
                ))}
                {weeks.flatMap(({ days }) => days).map((d) => {
                  const out = d.getMonth() !== month.getMonth()
                  const act = fmt(d) === selected
                  const isTod = fmt(d) === today
                  return (
                    <button
                      type="button"
                      key={fmt(d)}
                      onClick={() => pickFromCalendar(d)}
                      className={`mx-auto h-[26px] w-[26px] rounded-full flex items-center justify-center transition text-[11px] ${
                        act
                          ? 'bg-brand text-white font-semibold shadow-sm shadow-brand/40'
                          : isTod
                          ? 'border border-brand text-brand font-semibold'
                          : out
                          ? 'text-neutral-300'
                          : 'text-neutral-700 hover:bg-soft'
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 pt-2.5 border-t border-neutral-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    const tod = parse(today)
                    pickFromCalendar(tod)
                  }}
                  className="text-[11px] font-medium text-brand hover:underline"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setShowCalendarModal(false)}
                  className="text-[11px] px-3 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </Phone>}

      {/* Page 2: Create Task - choose activity */}
      {page === 'activity' && <Phone toast={toast} onCloseToast={() => setToast(null)}>
        <TopBar title="Create Task" back onBack={() => go('home')} />
        <div className="px-5 mt-6">
          <DateChips selected={selected} onSelect={pick} gray month={month} />
          <h3 className="text-[16px] font-medium mt-5 mb-3">Choose Activity</h3>
          <div className="space-y-3">
            {CATEGORIES.map(({ name: n, icon: Icon }) => (
              <button
                key={n}
                id={`cat-${n.toLowerCase()}`}
                onClick={() => { setCategory(n); go('create') }}
                className={`w-full flex items-center gap-3 rounded-lg bg-soft px-4 h-[64px] text-left shadow-sm transition hover:-translate-y-0.5 ${
                  category === n ? 'ring-2 ring-brand' : ''
                }`}
              >
                <Icon size={26} strokeWidth={1.4} className="text-brand" />
                <div className="flex-1">
                  <p className="text-[14px] font-medium leading-tight">{n}</p>
                  <p className="text-[11px] text-neutral-500">{countOf(n)} Tasks</p>
                </div>
                <ChevronRight size={16} className="text-neutral-600" />
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => go('create')}
          aria-label="New task"
          className="absolute right-5 bottom-5 h-[46px] w-[46px] rounded-xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/50 hover:scale-110 active:scale-95 transition"
        >
          <Plus size={22} />
        </button>
      </Phone>}

          {/* Page 3: Create Task form */}
          {page === 'create' && <Phone toast={toast} onCloseToast={() => setToast(null)}>
            <div className="bg-soft pb-4 rounded-b-[26px]">
              <TopBar title="Create Task" back onBack={() => go('activity')} />
              <div className="h-3" />
            </div>
            <form onSubmit={create} className="px-5 pt-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <button type="button" aria-label="Previous month" className="text-neutral-400 hover:text-brand"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button>
                <span className="bg-neutral-800 text-white text-[9px] px-3 py-0.5 rounded">{MONTHS[month.getMonth()]}</span>
                <button type="button" aria-label="Next month" className="text-neutral-400 hover:text-brand"
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button>
              </div>
              <div className="grid grid-cols-8 gap-y-1.5 text-center text-[9px]">
                <span />
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d, i) => (
                  <span key={d} className={i > 4 ? 'text-brand font-medium' : 'text-neutral-500'}>{d}</span>
                ))}
                {weeks.map(({ week, days }) => (
                  <div key={week + fmt(days[0])} className="contents">
                    <span className="mx-auto h-[18px] w-[18px] rounded-[3px] bg-neutral-800 text-white text-[8px] flex items-center justify-center">{week}</span>
                    {days.map((d, i) => {
                      const out = d.getMonth() !== month.getMonth()
                      const act = fmt(d) === selected
                      return (
                        <button
                          type="button"
                          key={fmt(d)}
                          onClick={() => pickFromCalendar(d)}
                          className={`mx-auto h-[18px] w-[18px] rounded-[3px] flex items-center justify-center transition hover:bg-soft-2 ${
                            act ? 'bg-neutral-800 text-white font-semibold hover:bg-neutral-800'
                              : out ? 'text-neutral-300'
                              : i > 4 ? 'text-brand font-medium' : 'text-neutral-800 font-medium'
                          }`}
                        >
                          {d.getDate()}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              <div className="relative mt-3">
                <button
                  type="button"
                  id="category-select"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-full flex items-center gap-3 rounded-lg bg-soft h-[48px] px-4 shadow-sm"
                >
                  <CatIcon size={22} strokeWidth={1.4} className="text-brand" />
                  <span className="flex-1 text-left text-[15px]">{category}</span>
                  <ChevronDown size={16} className={`transition ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen && (
                  <ul className="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-xl border border-soft-2 overflow-hidden animate-pop">
                    {CATEGORIES.map(({ name: n, icon: Icon }) => (
                      <li key={n}>
                        <button
                          type="button"
                          onClick={() => { setCategory(n); setMenuOpen(false) }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-soft"
                        >
                          <Icon size={16} className="text-brand" /> {n}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <input
                ref={nameRef}
                id="task-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                className="mt-3 w-full rounded border border-neutral-300 px-2 h-[30px] text-[11px] outline-none focus:border-brand"
              />
              <textarea
                id="task-desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Task Description..."
                className="mt-2 w-full h-[72px] resize-none rounded border border-neutral-300 px-2 py-1.5 text-[11px] outline-none focus:border-brand"
              />
              <div className="mt-2 flex gap-2 text-[11px]">
                <input type="time" value={startT} onChange={(e) => setStartT(e.target.value)}
                  className="flex-1 rounded border border-neutral-300 px-2 h-[28px] outline-none focus:border-brand" />
                <input type="time" value={endT} onChange={(e) => setEndT(e.target.value)}
                  className="flex-1 rounded border border-neutral-300 px-2 h-[28px] outline-none focus:border-brand" />
              </div>
              <button
                id="create-task"
                className="mt-3 w-full h-[32px] rounded bg-brand text-white text-[12px] font-medium hover:bg-brand-dark active:scale-[0.98] transition"
              >
                Create Task
              </button>
              {error && <p className="mt-2 text-center text-[10px] text-red-500">{error}</p>}
            </form>
          </Phone>}
        </>
      )}
    </main>
  )
}
