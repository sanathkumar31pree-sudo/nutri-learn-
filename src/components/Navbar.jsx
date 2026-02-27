import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGame } from '../contexts/GameContext'
import { Zap, LogOut, LayoutDashboard, ShoppingBag, Bell, BookOpen } from 'lucide-react'

export default function Navbar() {
    const { user, signOut } = useAuth()
    const { gameState } = useGame()
    const location = useLocation()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSignOut = () => {
        signOut()
        navigate('/login')
    }

    const navLinks = [
        { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
        { to: '/weekly-log', label: 'Journal', icon: <BookOpen size={16} /> },
        { to: '/shop', label: 'Point Shop', icon: <ShoppingBag size={16} /> },
        { to: '/notifications', label: 'Reminders', icon: <Bell size={16} /> },
    ]

    return (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl">
            <nav className="
        flex items-center justify-between
        bg-white/10 backdrop-blur-xl
        rounded-full px-4 py-2.5
        shadow-[0_8px_32px_rgba(0,0,0,0.2)]
        border border-white/20
      ">
                {/* Logo */}
                <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-full bg-white/25 border border-white/40 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-caveat text-sm font-bold">N</span>
                    </div>
                    <div className="hidden sm:block">
                        <span className="text-white font-caveat text-lg font-bold tracking-tight">Nutri</span>
                        <span className="text-[#FF8C00] font-caveat text-lg font-bold tracking-tight">Learn</span>
                    </div>
                </Link>

                {/* Status pill */}
                <div className="hidden md:flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    <span className="text-white/70 font-mono text-xs tracking-widest uppercase">System: Recruitment Active</span>
                </div>

                {/* Right section */}
                {user ? (
                    <div className="flex items-center gap-2" ref={menuRef}>
                        {/* XP badge */}
                        <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 cursor-default">
                            <Zap size={13} className="text-[#FF8C00]" />
                            <span className="text-white font-mono text-xs font-medium">{gameState?.xp ?? 0} XP</span>
                        </div>

                        {/* Nav links — desktop */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`
                    flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-outfit font-medium transition-all duration-200 btn-magnetic
                    ${location.pathname === link.to
                                            ? 'bg-white/30 text-white border border-white/40'
                                            : 'text-white/70 hover:text-white hover:bg-white/15'}
                  `}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Avatar / menu toggle */}
                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            className="w-8 h-8 rounded-full bg-[#FF8C00] border border-white/30 flex items-center justify-center text-white text-xs font-bold btn-magnetic"
                        >
                            {user.username?.[0]?.toUpperCase() ?? 'U'}
                        </button>

                        {/* Dropdown */}
                        {menuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-44 bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl shadow-2xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/15">
                                    <p className="text-white text-sm font-caveat font-semibold truncate">{user.username}</p>
                                    <p className="text-white/50 text-xs truncate font-mono">{user.email}</p>
                                </div>
                                {navLinks.map(link => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMenuOpen(false)}
                                        className="flex items-center gap-2 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/10 text-sm transition-colors font-outfit"
                                    >
                                        {link.icon} {link.label}
                                    </Link>
                                ))}
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-[#FF8C00] hover:bg-white/10 text-sm transition-colors border-t border-white/15 font-outfit"
                                >
                                    <LogOut size={14} /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link to="/login" className="text-white/70 hover:text-white text-sm font-outfit font-medium px-4 py-1.5 rounded-full hover:bg-white/15 transition-all btn-magnetic">
                            Sign In
                        </Link>
                        <Link to="/signup" className="bg-[#FF8C00] text-white text-sm font-outfit font-semibold px-4 py-1.5 rounded-full btn-magnetic shadow-lg border border-white/20">
                            Get Started
                        </Link>
                    </div>
                )}
            </nav>
        </header>
    )
}
