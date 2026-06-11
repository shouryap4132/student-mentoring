import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthProvider";

const MASTER_EMAIL = "adroit.shourya@gmail.com";

export default function MasterDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      if (!user) { navigate("/login", { replace: true }); return; }
      if (user.email !== MASTER_EMAIL) {
        toast.error("Access denied. Master account only.");
        navigate("/studentdashboard", { replace: true });
        return;
      }
      await fetchAllProfiles();
      setLoading(false);
    }
    load();
  }, [navigate, user, authLoading]);

  const fetchAllProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load users."); return; }
    setUsers(data ?? []);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSavingId(userId);
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) toast.error("Failed to update role.");
    else { toast.success("Role updated."); await fetchAllProfiles(); }
    setSavingId(null);
  };

  const filtered = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
          <h1 className="text-4xl font-playfair font-bold">Master Dashboard</h1>
          <p className="text-stone-500 mt-2">Manage all users, roles, and permissions. Only accessible to {MASTER_EMAIL}.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-stone-100 border border-stone-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all" />
          <p className="text-xs text-stone-400 mt-3 uppercase tracking-widest font-bold">
            {filtered.length} of {users.length} users
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-stone-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    {["Name", "Email", "Role", "Actions"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-stone-900">{u.full_name || "Unknown"}</td>
                      <td className="px-6 py-4 text-sm text-stone-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          u.role === "master"     ? "bg-purple-100 text-purple-700" :
                          u.role === "leadership" ? "bg-blue-100 text-blue-700" :
                          u.role === "tutor"      ? "bg-amber-100 text-amber-700" :
                          "bg-stone-100 text-stone-700"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={savingId === u.id}
                          className="bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-black transition-all disabled:opacity-50 cursor-pointer">
                          <option value="student">Student</option>
                          <option value="tutor">Tutor</option>
                          <option value="leadership">Leadership</option>
                          <option value="master">Master</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {[
            { label: "Total Users",  value: users.length },
            { label: "Students",     value: users.filter((u) => u.role === "student").length },
            { label: "Tutors",       value: users.filter((u) => u.role === "tutor").length },
            { label: "Leadership",   value: users.filter((u) => u.role === "leadership").length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] font-bold text-stone-400">{label}</p>
              <p className="text-3xl font-playfair font-bold mt-4">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
