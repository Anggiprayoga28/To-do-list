import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Timer, Plus, ChevronLeft, ChevronRight, Check,
  Lightbulb, Utensils, ClipboardList, Dumbbell, Music, Trash2, Calendar, X,
  Lock, LogOut, Users, ArrowRightLeft, Clock,
} from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const API = `${API_BASE}/api/todos`

const CATEGORIES = [
  { name: 'Idea', icon: Lightbulb, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { name: 'Food', icon: Utensils, color: 'text-orange-500 bg-orange-50 border-orange-200' },
  { name: 'Work', icon: ClipboardList, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { name: 'Sport', icon: Dumbbell, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  { name: 'Music', icon: Music, color: 'text-purple-500 bg-purple-50 border-purple-200' },
]
const iconOf = (name) => (CATEGORIES.find((c) => c.name === name) || CATEGORIES[0]).icon

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

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

function AppShell({ children, toast, onCloseToast, isCia }) {
  return (
    <div className={`w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl min-h-screen sm:min-h-0 sm:my-8 bg-white sm:rounded-[28px] ${
      isCia
        ? 'shadow-[0_20px_50px_rgba(244,114,182,0.15)] border border-pink-100/70'
        : 'shadow-[0_20px_60px_rgba(50,110,220,0.15)] border border-blue-100/60'
    } overflow-hidden flex flex-col relative transition-all`}>
      {toast && (
        <div className="fixed sm:absolute top-4 inset-x-4 sm:inset-x-6 z-[70] flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md animate-pop transition-all bg-white/95 border-neutral-200/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'delete' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'
            }`}>
              {toast.type === 'delete' ? <Trash2 size={15} /> : <Check size={15} strokeWidth={3} />}
            </div>
            <p className="text-[13px] font-semibold text-neutral-800 truncate">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseToast}
            className="text-neutral-400 hover:text-neutral-600 shrink-0 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {children}
    </div>
  )
}

function DateChips({ selected, onSelect, month }) {
  const scrollRef = useRef(null)
  const activeRef = useRef(null)

  const dates = useMemo(() => {
    const m = month || parse(selected)
    const year = m.getFullYear()
    const mon = m.getMonth()
    const totalDays = new Date(year, mon + 1, 0).getDate()
    return Array.from({ length: totalDays }, (_, i) => new Date(year, mon, i + 1))
  }, [month])

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selected, month])

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -200 : 200
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
    }
  }

  return (
    <div className="flex items-center gap-1.5 w-full">
      <button
        type="button"
        aria-label="Previous dates"
        onClick={() => scroll('left')}
        className="w-7 h-[52px] flex items-center justify-center text-neutral-400 hover:text-brand hover:bg-soft rounded-xl transition shrink-0"
      >
        <ChevronLeft size={18} />
      </button>

      <div
        ref={scrollRef}
        className="flex-1 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
      >
        {dates.map((d) => {
          const dStr = fmt(d)
          const active = dStr === selected
          return (
            <button
              key={dStr}
              ref={active ? activeRef : null}
              type="button"
              onClick={() => onSelect(d)}
              className={`shrink-0 w-[54px] sm:w-[60px] h-[52px] rounded-xl flex flex-col items-center justify-center leading-tight transition-all duration-200 hover:scale-105 active:scale-95 ${
                active
                  ? 'bg-brand text-white shadow-md shadow-brand/40 font-semibold'
                  : 'bg-soft text-brand-dark hover:bg-soft-2'
              }`}
            >
              <span className="text-[15px] font-bold">{d.getDate()}</span>
              <span className="text-[11px] font-medium opacity-80">{DAYS[d.getDay()]}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        aria-label="Next dates"
        onClick={() => scroll('right')}
        className="w-7 h-[52px] flex items-center justify-center text-neutral-400 hover:text-brand hover:bg-soft rounded-xl transition shrink-0"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

function TopBar({ title, light, workspace, onOpenProfileModal }) {
  const isAnggi = workspace === 'anggi'
  const isCia = workspace === 'cia'

  return (
    <div className={`flex items-center justify-between px-5 sm:px-8 pt-6 pb-2 ${light ? 'text-white' : 'text-neutral-800'}`}>
      <div className="flex items-center gap-2">
        {workspace ? (
          <button
            type="button"
            id="btn-workspace-badge"
            onClick={onOpenProfileModal}
            title="Ganti Profil / Ruang"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 shadow-sm ${
              light ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-soft hover:bg-soft-2 text-brand-dark'
            }`}
          >
            <span className="text-sm">{isAnggi ? '👤' : isCia ? '🌸' : '🔒'}</span>
            <span className="max-w-[120px] truncate capitalize">{workspace}</span>
            <ArrowRightLeft size={12} className="opacity-80" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-base">📝</span>
            <span className="font-bold text-sm tracking-wide">To-Do List</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
        <Timer size={16} className="opacity-80" />
        <span className="font-mono">{title}</span>
      </div>
    </div>
  )
}

export default function App() {
  const today = useMemo(() => fmt(new Date()), [])
  const [workspace, setWorkspace] = useState(() => {
    try {
      return (localStorage.getItem('todo_workspace') || '').trim().toLowerCase()
    } catch {
      return ''
    }
  })
  const isCia = workspace.trim().toLowerCase() === 'cia'

  useEffect(() => {
    if (isCia) {
      document.documentElement.dataset.theme = 'cia'
      document.body.dataset.theme = 'cia'
    } else {
      delete document.documentElement.dataset.theme
      delete document.body.dataset.theme
    }
    return () => {
      delete document.documentElement.dataset.theme
      delete document.body.dataset.theme
    }
  }, [isCia])

  const [inputWorkspace, setInputWorkspace] = useState('')
  const [todos, setTodos] = useState([])
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(today)
  const [filterCat, setFilterCat] = useState('ALL')
  const [category, setCategory] = useState('Idea')
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [startT, setStartT] = useState('09:00')
  const [endT, setEndT] = useState('10:00')
  const [now, setNow] = useState(new Date())
  const nameRef = useRef(null)

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
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

  const selectProfile = (id) => {
    const trimmed = id.trim().toLowerCase()
    if (!trimmed) return
    setWorkspace(trimmed)
    try {
      localStorage.setItem('todo_workspace', trimmed)
    } catch {}
    const displayName = trimmed === 'anggi' ? 'Anggi' : trimmed === 'cia' ? 'Cia' : trimmed
    showToast(`Masuk ke ruang ${displayName}`, 'success')
  }

  const handleEnterWorkspace = (e) => {
    e.preventDefault()
    const trimmed = inputWorkspace.trim().toLowerCase()
    if (!trimmed) return
    selectProfile(trimmed)
    setInputWorkspace('')
  }

  const handleSwitchWorkspace = () => {
    const prev = workspace
    setWorkspace('')
    try {
      localStorage.removeItem('todo_workspace')
    } catch {}
    setTodos([])
    const displayName = prev === 'anggi' ? 'Anggi' : prev === 'cia' ? 'Cia' : prev
    showToast(`Keluar dari ruang ${displayName}`, 'delete')
  }

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

    request(`${API}?workspace=${encodeURIComponent(workspace)}`)
      .then((data) => {
        if (Array.isArray(data)) {
          setTodos(data)
          saveTodosCache(data)
        }
      })
      .catch(() => setError('Cannot connect to server'))
  }, [workspace])

  const pick = (d) => { setSelected(fmt(d)); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)) }
  const pickFromCalendar = (d) => { pick(d); setShowCalendarModal(false) }

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
      workspace,
      created_at: new Date().toISOString(),
    }

    const next = [...todos, tempTask]
    setTodos(next)
    saveTodosCache(next)
    setName('')
    setDesc('')
    setError('')
    setShowCreateModal(false)
    showToast('Tugas baru berhasil dibuat!', 'success')

    try {
      const saved = await request(`${API}?workspace=${encodeURIComponent(workspace)}`, {
        method: 'POST',
        body: JSON.stringify({
          title: tempTask.title,
          description: tempTask.description,
          category: tempTask.category,
          date: tempTask.date,
          start_time: tempTask.start_time,
          end_time: tempTask.end_time,
          workspace,
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

  const toggle = async (t) => {
    const updatedDone = !t.done
    const next = todos.map((x) => (x.id === t.id ? { ...x, done: updatedDone } : x))
    setTodos(next)
    saveTodosCache(next)

    try {
      const u = await request(`${API}/${t.id}?workspace=${encodeURIComponent(workspace)}`, {
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
    setTodos(next)
    saveTodosCache(next)

    try {
      await request(`${API}/${id}?workspace=${encodeURIComponent(workspace)}`, { method: 'DELETE' })
    } catch (err) {
      setTodos(prev)
      saveTodosCache(prev)
      setError(err.message)
    }
  }

  const dayTasks = useMemo(() => {
    return todos
      .filter((t) => t.date === selected)
      .sort((a, b) => {
        if (a.done !== b.done) {
          return a.done ? 1 : -1
        }
        return a.start_time.localeCompare(b.start_time)
      })
  }, [todos, selected])

  const filteredTasks = useMemo(() => {
    if (filterCat === 'ALL') return dayTasks
    return dayTasks.filter((t) => t.category === filterCat)
  }, [dayTasks, filterCat])

  const completedCount = useMemo(() => dayTasks.filter((t) => t.done).length, [dayTasks])
  const pendingCount = dayTasks.length - completedCount

  const sel = parse(selected)

  const weeks = useMemo(() => {
    const first = new Date(month)
    const offset = (first.getDay() + 6) % 7
    const gridStart = addDays(first, -offset)
    return Array.from({ length: 6 }, (_, w) => {
      const days = Array.from({ length: 7 }, (_, i) => addDays(gridStart, w * 7 + i))
      return { week: isoWeek(days[0]), days }
    })
  }, [month])

  return (
    <main className="min-h-screen flex items-center justify-center p-0 sm:p-6">
      {!workspace ? (
        <AppShell toast={toast} onCloseToast={() => setToast(null)}>
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 text-white p-7 sm:p-10 rounded-b-[32px] sm:rounded-b-[36px] shadow-lg shadow-blue-500/15">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold tracking-widest uppercase opacity-90">To-Do List</span>
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Users size={18} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Siapa yang Menggunakan?</h1>
              <p className="text-xs sm:text-sm opacity-90 mt-1.5 font-medium">Pilih profil untuk membuka daftar tugas pribadi</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between flex-1">
            <div>
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                Pilih Profil
              </p>
              <div className="grid grid-cols-2 gap-3.5 sm:gap-4 mb-6">
                {/* Anggi Card */}
                <button
                  type="button"
                  id="btn-profile-anggi"
                  onClick={() => selectProfile('anggi')}
                  className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl border-2 border-blue-100 bg-gradient-to-b from-blue-50/70 to-white hover:border-brand hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] active:scale-95 transition-all text-center group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 group-hover:bg-brand group-hover:text-white flex items-center justify-center text-2xl mb-2.5 transition shadow-sm">
                    👤
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-800 leading-tight">Anggi</h3>
                  <span className="text-xs font-semibold text-brand mt-1">Ruang Anggi</span>
                </button>

                {/* Cia Card */}
                <button
                  type="button"
                  id="btn-profile-cia"
                  onClick={() => selectProfile('cia')}
                  className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl border-2 border-pink-100 bg-gradient-to-b from-pink-50/70 to-white hover:border-pink-400 hover:shadow-lg hover:shadow-pink-500/10 hover:scale-[1.02] active:scale-95 transition-all text-center group cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-pink-100 group-hover:bg-pink-500 group-hover:text-white flex items-center justify-center text-2xl mb-2.5 transition shadow-sm">
                    🌸
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-800 leading-tight">Cia</h3>
                  <span className="text-xs font-semibold text-pink-600 mt-1">Ruang Cia</span>
                </button>
              </div>

              {/* Custom Room section */}
              <div className="relative flex items-center my-4">
                <div className="flex-grow border-t border-neutral-200"></div>
                <span className="shrink-0 px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  atau ruang / PIN lain
                </span>
                <div className="flex-grow border-t border-neutral-200"></div>
              </div>

              <form onSubmit={handleEnterWorkspace} className="flex gap-2.5 mt-2">
                <input
                  id="room-input"
                  type="text"
                  value={inputWorkspace}
                  onChange={(e) => setInputWorkspace(e.target.value)}
                  placeholder="Nama ruang / PIN lain..."
                  className="flex-1 h-12 rounded-xl border border-neutral-200 focus:border-brand px-4 text-sm font-medium outline-none transition shadow-sm focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="submit"
                  id="btn-enter-room"
                  className="px-5 h-12 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold active:scale-95 transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
                >
                  <span>Masuk</span>
                  <ChevronRight size={16} />
                </button>
              </form>
            </div>

            <div className="p-4 rounded-2xl bg-soft border border-soft-2 text-xs text-neutral-600 leading-relaxed mt-8">
              <p className="font-bold text-brand-dark mb-1">💡 Informasi:</p>
              <p>Tugas Anggi & Cia tersimpan terpisah di cloud. Tampilan sekarang responsif dan nyaman digunakan di HP maupun Komputer/Laptop!</p>
            </div>
          </div>
        </AppShell>
      ) : (
        <AppShell toast={toast} onCloseToast={() => setToast(null)} isCia={isCia}>
          {/* Header Banner */}
          <div className={`text-white pb-6 pt-1 rounded-b-[30px] sm:rounded-b-[34px] transition-all ${
            isCia
              ? 'bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 shadow-lg shadow-pink-300/20'
              : 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 shadow-lg shadow-blue-500/15'
          }`}>
            <TopBar
              title={`${sel.getDate()} ${MONTHS[sel.getMonth()] === 'September' ? 'Sept' : MONTHS[sel.getMonth()].slice(0, 3)}`}
              light
              workspace={workspace}
              onOpenProfileModal={() => setShowProfileModal(true)}
            />
            <div className="px-5 sm:px-8 mt-4 sm:mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Halo, {workspace === 'anggi' ? 'Anggi 👋' : workspace === 'cia' ? 'Cia 🌸' : workspace}!
                </p>
                <p className="text-xs sm:text-sm opacity-90 mt-1 font-medium">
                  {dayTasks.length === 0
                    ? 'Belum ada tugas untuk hari ini.'
                    : pendingCount === 0
                    ? 'Hebat! Semua tugas hari ini selesai! 🎉'
                    : `${pendingCount} dari ${dayTasks.length} tugas belum selesai`}
                </p>
                {dayTasks.length > 0 && (
                  <div className="w-full sm:w-60 h-2 bg-white/25 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((completedCount / dayTasks.length) * 100)}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                id="add-new"
                onClick={() => setShowCreateModal(true)}
                className={`self-start sm:self-auto bg-white ${
                  isCia ? 'text-pink-500 hover:bg-pink-50/80' : 'text-blue-600 hover:bg-blue-50'
                } text-xs sm:text-sm font-bold rounded-xl px-5 py-2.5 shadow-md hover:scale-105 active:scale-95 transition flex items-center gap-1.5 cursor-pointer`}
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Tambah Tugas</span>
              </button>
            </div>
          </div>

          {/* Month Bar & Date Strip */}
          <div className="px-5 sm:px-8 pt-5 pb-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-neutral-100/90 p-1 rounded-xl">
                <button
                  type="button"
                  id="btn-prev-month"
                  onClick={prevMonth}
                  aria-label="Bulan sebelumnya"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-600 hover:text-brand hover:bg-white transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs sm:text-sm font-bold text-neutral-800 min-w-[120px] text-center">
                  {MONTHS[month.getMonth()]} {month.getFullYear()}
                </span>
                <button
                  type="button"
                  id="btn-next-month"
                  onClick={nextMonth}
                  aria-label="Bulan berikutnya"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-600 hover:text-brand hover:bg-white transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <button
                type="button"
                id="btn-open-calendar"
                onClick={() => setShowCalendarModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark bg-soft hover:bg-soft-2 px-3 py-1.5 rounded-xl transition active:scale-95 border border-soft-2"
              >
                <Calendar size={14} />
                <span>Kalender</span>
              </button>
            </div>

            <DateChips selected={selected} onSelect={pick} month={month} />
          </div>

          {/* Category Filter Pills */}
          <div className="px-5 sm:px-8 pt-2 pb-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setFilterCat('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                  filterCat === 'ALL'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Semua ({dayTasks.length})
              </button>
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                const count = dayTasks.filter((t) => t.category === c.name).length
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setFilterCat(c.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                      filterCat === c.name
                        ? 'bg-brand text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{c.name}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        filterCat === c.name ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 px-5 sm:px-8 pb-8 overflow-y-auto min-h-[320px]">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-soft flex items-center justify-center text-brand mb-3">
                  <ClipboardList size={30} strokeWidth={1.5} />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-neutral-700">Tidak ada tugas</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-[260px]">
                  {filterCat === 'ALL'
                    ? 'Belum ada tugas untuk tanggal ini. Mulai dengan membuat tugas baru!'
                    : `Tidak ada tugas dalam kategori ${filterCat}.`}
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-brand text-white rounded-xl text-xs font-semibold hover:bg-brand-dark transition active:scale-95 shadow-sm"
                >
                  + Tambah Tugas
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {filteredTasks.map((t, idx) => {
                  const Icon = iconOf(t.category)
                  const prev = filteredTasks[idx - 1]
                  const showDivider = t.done && prev && !prev.done
                  return (
                    <div key={t.id} className="contents">
                      {showDivider && (
                        <li className="list-none flex items-center gap-3 py-2">
                          <div className="flex-1 h-px bg-neutral-200" />
                          <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">Tugas Selesai</span>
                          <div className="flex-1 h-px bg-neutral-200" />
                        </li>
                      )}
                      <li
                        className={`group flex items-start sm:items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                          t.done
                            ? 'bg-neutral-50/80 border-neutral-200/60 opacity-60'
                            : 'bg-white hover:bg-soft/40 border-neutral-200/90 hover:border-brand/40 shadow-sm hover:shadow-md'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggle(t)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition active:scale-90 shrink-0 mt-0.5 sm:mt-0 ${
                            t.done
                              ? 'bg-green-500 text-white shadow-sm'
                              : 'border-2 border-neutral-300 hover:border-brand text-transparent'
                          }`}
                        >
                          <Check size={14} strokeWidth={3} className={t.done ? 'opacity-100' : 'opacity-0'} />
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold ${
                              t.done ? 'bg-neutral-200 text-neutral-600' : 'bg-soft text-brand-dark'
                            }`}>
                              <Icon size={11} />
                              <span>{t.category}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 font-mono">
                              <Clock size={11} />
                              <span>{t.start_time} - {t.end_time}</span>
                            </span>
                          </div>

                          <p className={`text-sm sm:text-base font-semibold leading-snug break-words ${
                            t.done ? 'line-through text-neutral-400' : 'text-neutral-800'
                          }`}>
                            {t.title}
                          </p>

                          {t.description && (
                            <p className={`text-xs mt-1 leading-relaxed break-words ${
                              t.done ? 'text-neutral-400' : 'text-neutral-500'
                            }`}>
                              {t.description}
                            </p>
                          )}
                        </div>

                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={() => setDeleteTaskConfirm(t)}
                          className="text-neutral-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition active:scale-95 shrink-0"
                          title="Hapus tugas"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    </div>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Floating Action Button for Mobile */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="sm:hidden fixed right-5 bottom-6 z-40 w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center shadow-xl shadow-brand/40 active:scale-95 transition"
            aria-label="Tambah tugas"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>

          {/* Modal: Create Task */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-pop">
              <div className="bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-neutral-100 max-h-[90vh] overflow-y-auto animate-pop">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-soft flex items-center justify-center text-brand">
                      <Plus size={18} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-base font-bold text-neutral-800">Buat Tugas Baru</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={create} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Nama Tugas <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={nameRef}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Belanja mingguan, Meeting tim..."
                      required
                      autoFocus
                      className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 focus:border-brand text-sm font-medium outline-none transition focus:ring-2 focus:ring-brand/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Kategori
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {CATEGORIES.map(({ name: n, icon: Icon }) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCategory(n)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition active:scale-95 ${
                            category === n
                              ? 'bg-brand text-white border-brand shadow-sm font-semibold'
                              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200/80'
                          }`}
                        >
                          <Icon size={18} strokeWidth={category === n ? 2.5 : 1.8} className="mb-1" />
                          <span className="text-[10px] truncate w-full">{n}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={selected}
                      onChange={(e) => setSelected(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 focus:border-brand text-xs sm:text-sm font-medium outline-none transition focus:ring-2 focus:ring-brand/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Jam Mulai
                      </label>
                      <input
                        type="time"
                        value={startT}
                        onChange={(e) => setStartT(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 focus:border-brand text-xs font-mono outline-none transition focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                        Jam Selesai
                      </label>
                      <input
                        type="time"
                        value={endT}
                        onChange={(e) => setEndT(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-neutral-200 focus:border-brand text-xs font-mono outline-none transition focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Deskripsi (Opsional)
                    </label>
                    <textarea
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="Tuliskan catatan tambahan..."
                      rows={2}
                      className="w-full p-3 rounded-xl border border-neutral-200 focus:border-brand text-xs font-medium outline-none transition focus:ring-2 focus:ring-brand/20 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition active:scale-95"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-task"
                      className="flex-1 h-11 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-semibold shadow-md shadow-brand/30 transition active:scale-95"
                    >
                      Simpan Tugas
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Profile Switcher Modal */}
          {showProfileModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-pop">
              <div className="bg-white rounded-2xl p-5 w-full max-w-[300px] shadow-2xl border border-soft-2 animate-pop">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                  <div className="flex items-center gap-1.5">
                    <Users size={16} className="text-brand" />
                    <h4 className="text-[13px] font-bold text-neutral-800">Ganti Profil / Ruang</h4>
                  </div>
                  <button
                    type="button"
                    id="btn-close-profile-modal"
                    onClick={() => setShowProfileModal(false)}
                    className="text-neutral-400 hover:text-neutral-600 p-0.5"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-2 mb-3">
                  <button
                    type="button"
                    id="modal-select-anggi"
                    onClick={() => { selectProfile('anggi'); setShowProfileModal(false) }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition active:scale-95 ${
                      workspace === 'anggi'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                        : 'bg-neutral-50/70 hover:bg-blue-50/50 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg shrink-0">👤</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight font-medium">Anggi</p>
                      <p className="text-[11px] text-neutral-400">Ruang tugas Anggi</p>
                    </div>
                    {workspace === 'anggi' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500 text-white font-medium">Aktif</span>
                    ) : (
                      <span className="text-xs text-blue-500 font-medium">Pilih</span>
                    )}
                  </button>

                  <button
                    type="button"
                    id="modal-select-cia"
                    onClick={() => { selectProfile('cia'); setShowProfileModal(false) }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition active:scale-95 ${
                      workspace === 'cia'
                        ? 'bg-pink-50/80 border-pink-300 text-pink-700 font-semibold'
                        : 'bg-neutral-50/70 hover:bg-pink-50/50 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-lg shrink-0">🌸</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight font-medium">Cia</p>
                      <p className="text-[11px] text-neutral-400">Ruang tugas Cia</p>
                    </div>
                    {workspace === 'cia' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-400 text-white font-medium">Aktif</span>
                    ) : (
                      <span className="text-xs text-pink-400 font-medium">Pilih</span>
                    )}
                  </button>
                </div>

                <div className="border-t border-neutral-100 pt-2.5 flex flex-col gap-1.5">
                  <button
                    type="button"
                    id="modal-btn-logout"
                    onClick={() => { setShowProfileModal(false); handleSwitchWorkspace() }}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <LogOut size={14} />
                    <span>Keluar ke Halaman Awal</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Popup Modal */}
          {showCalendarModal && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-pop">
              <div className="bg-white rounded-3xl p-5 w-full max-w-[320px] shadow-2xl border border-soft-2 animate-pop">
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
                        className={`mx-auto h-7 w-7 rounded-full flex items-center justify-center transition text-xs ${
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
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCalendarModal(false)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Complete Modal */}
          {confirmTask && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-pop">
              <div className="bg-white rounded-2xl p-5 w-full max-w-[280px] shadow-2xl border border-soft-2 text-center animate-pop">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-3">
                  <Check size={24} strokeWidth={2.5} />
                </div>
                <h4 className="text-sm font-bold text-neutral-800">Selesaikan Tugas?</h4>
                <p className="text-xs text-neutral-500 mt-1 mb-4">
                  Apakah tugas &ldquo;{confirmTask.title}&rdquo; sudah selesai dikerjakan?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmTask(null)}
                    className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-medium hover:bg-neutral-50 active:scale-95 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={confirmComplete}
                    className="flex-1 py-2 px-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Delete Modal */}
          {deleteTaskConfirm && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-pop">
              <div className="bg-white rounded-2xl p-5 w-full max-w-[280px] shadow-2xl border border-soft-2 text-center animate-pop">
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={24} />
                </div>
                <h4 className="text-sm font-bold text-neutral-800">Hapus Tugas?</h4>
                <p className="text-xs text-neutral-500 mt-1 mb-4">
                  Apakah Anda yakin ingin menghapus tugas &ldquo;{deleteTaskConfirm.title}&rdquo;?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTaskConfirm(null)}
                    className="flex-1 py-2 px-3 rounded-xl border border-neutral-200 text-neutral-600 text-xs font-medium hover:bg-neutral-50 active:scale-95 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-delete"
                    onClick={confirmDelete}
                    className="flex-1 py-2 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-sm active:scale-95 transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          )}
        </AppShell>
      )}
    </main>
  )
}
