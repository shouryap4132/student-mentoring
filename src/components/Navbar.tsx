import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

function Navbar() {
  const { scrollY } = useScroll();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [roles, setRoles] = useState<string[] | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const navbarContent = ["Home", "About", "Contact"];

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch profile roles, avatar, and notifications when user changes
  useEffect(() => {
    if (!user?.id) {
      if (!loading) {
        setRoles(null);
        setAvatarUrl(null);
        setNotifications([]);
      }
      return;
    }

    const uid = user.id;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role, roles, avatar_url")
        .eq("id", uid)
        .maybeSingle();

      const profileRoles: string[] = data?.roles ?? (data?.role ? [data.role] : []);
      setRoles(profileRoles.length ? profileRoles : null);
      setAvatarUrl(data?.avatar_url ?? null);
    };

    const fetchNotifs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, read, created_at, link")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(15);
      setNotifications(data ?? []);
    };

    fetchProfile().catch(() => { setRoles(null); setAvatarUrl(null); });
    fetchNotifs();

    const channel = supabase
      .channel("navbar-notifs")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
        fetchNotifs)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loading]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening && unreadCount > 0 && user?.id) {
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const width = useTransform(scrollY, [0, 50], ["100%", "90%"]);
  const borderRadius = useTransform(scrollY, [0, 50], ["0px", "24px"]);
  const marginTop = useTransform(scrollY, [0, 50], ["0px", "16px"]);
  const bgPos = useTransform(scrollY, [0, 200], ["0% 50%", "100% 50%"]);

  const isHomePage = location.pathname === "/";
  const isTutor = roles?.includes("tutor");
  const isMaster = roles?.includes("master");
  const isLeadership = roles?.includes("leadership");

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <motion.nav
      style={{ width, borderRadius, marginTop }}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 grid grid-cols-3 items-center p-4 bg-stone-200/90 backdrop-blur-md text-black border border-stone-300/20 shadow-lg"
    >
      <Link to="/" className="text-2xl font-playfair tracking-wider font-bold">
        SM<span className="italic text-stone-500">.</span>
      </Link>

      <ul className="flex justify-center gap-8 font-satoshi font-bold uppercase text-[10px] tracking-widest">
        {navbarContent.map((item) => (
          <li key={item}>
            <Link to={item === "Home" ? "/" : `/${item.toLowerCase()}`} className="hover:text-stone-500 transition">
              {item}
            </Link>
          </li>
        ))}
        {user && (
          <li className="relative">
            {isMaster ? (
              <div className="group inline-block">
                <button className="text-black hover:text-stone-500 transition font-bold">Dashboard ▾</button>
                <ul className="absolute left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block bg-white border border-stone-200 rounded-2xl shadow-xl py-2 z-50 min-w-[200px]">
                  <li><Link to="/masterdashboard" className="block px-5 py-2.5 hover:bg-stone-50 text-[10px] font-bold uppercase tracking-widest">Master Dashboard</Link></li>
                  <li><Link to="/tutordashboard" className="block px-5 py-2.5 hover:bg-stone-50 text-[10px] font-bold uppercase tracking-widest">Tutor Dashboard</Link></li>
                  <li><Link to="/leadership" className="block px-5 py-2.5 hover:bg-stone-50 text-[10px] font-bold uppercase tracking-widest">Leadership Dashboard</Link></li>
                  <li><Link to="/studentdashboard" className="block px-5 py-2.5 hover:bg-stone-50 text-[10px] font-bold uppercase tracking-widest">Student Dashboard</Link></li>
                </ul>
              </div>
            ) : isLeadership ? (
              <div className="group inline-block">
                <button className="text-black hover:text-stone-500 transition font-bold">Dashboard ▾</button>
                <ul className="absolute left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block bg-white border border-stone-200 rounded-2xl shadow-xl py-2 z-50 min-w-[200px]">
                  <li><Link to="/leadership" className="block px-5 py-2.5 hover:bg-stone-50 text-[10px] font-bold uppercase tracking-widest">Leadership Dashboard</Link></li>
                  {isTutor && <li><Link to="/tutordashboard" className="block px-5 py-2.5 hover:bg-stone-50 text-[10px] font-bold uppercase tracking-widest">Tutor Dashboard</Link></li>}
                </ul>
              </div>
            ) : isTutor ? (
              <Link to="/tutordashboard" className="text-black hover:text-stone-500 transition">Dashboard</Link>
            ) : (
              <Link to="/studentdashboard" className="text-black hover:text-stone-500 transition">Dashboard</Link>
            )}
          </li>
        )}
      </ul>

      <div className="flex justify-end gap-3 items-center">
        {user && (
          <div ref={notifRef} className="relative">
            <button
              onClick={handleBellClick}
              className="relative p-2 hover:bg-stone-300/50 rounded-xl transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-700">Notifications</p>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-stone-50">
                  {notifications.length === 0 ? (
                    <p className="p-5 text-sm text-stone-400 text-center">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-5 py-4 transition-colors ${n.read ? "bg-white" : "bg-stone-50"}`}
                      >
                        <p className="text-sm font-bold text-stone-900 leading-snug">{n.title}</p>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{n.body}</p>
                        <p className="text-[10px] text-stone-300 mt-2">{timeAgo(n.created_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {user ? (
          <>
            <Link to="/profile" className="flex items-center gap-2">
              <img
                src={avatarUrl ?? "/default-avatar.png"}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border border-stone-300"
              />
            </Link>
            <motion.button
              onClick={handleSignOut}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 font-satoshi font-bold text-xs uppercase tracking-widest text-black rounded-xl border border-stone-400 hover:bg-stone-300 transition-colors"
            >
              Sign Out
            </motion.button>
          </>
        ) : (
          <Link to={isHomePage ? "/signup" : "/login"}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ backgroundPosition: bgPos }}
              className="
                px-6 py-2 font-satoshi font-bold text-xs uppercase tracking-widest text-black rounded-xl
                bg-linear-to-r from-stone-300 via-stone-100 to-stone-300
                bg-[length:200%_100%] transition-shadow hover:shadow-md border border-stone-300
              "
            >
              {isHomePage ? "Start Now" : "Sign In"}
            </motion.button>
          </Link>
        )}
      </div>
    </motion.nav>
  );
}

export default Navbar;
