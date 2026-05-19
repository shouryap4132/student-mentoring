import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../../utils/supabaseClient";

const MASTER_EMAIL = "adroit.shourya@gmail.com";

export default function MasterDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAccessAndFetch() {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // 2. Verify email is exactly the master email
      if (session.user.email !== MASTER_EMAIL) {
        toast.error("Access denied. Master account only.");
        navigate("/login");
        return;
      }

      // 3. Fetch all profiles
      await fetchAllProfiles();
      setLoading(false);
    }

    checkAccessAndFetch();
  }, [navigate]);

  const fetchAllProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch profiles:", error);
      toast.error("Failed to load users.");
      return;
    }

    setUsers(data || []);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSavingId(userId);

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      console.error("Role update failed:", error);
      toast.error("Failed to update role.");
    } else {
      toast.success("Role updated successfully.");
      await fetchAllProfiles();
    }

    setSavingId(null);
  };

  const filteredUsers = users.filter((user) =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        {/* HEADER */}
        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-10 shadow-sm">
          <h1 className="text-4xl font-playfair font-bold">Master Dashboard</h1>
          <p className="text-stone-500 mt-2">Manage all users, roles, and system permissions. Only accessible to {MASTER_EMAIL}.</p>
        </div>

        {/* SEARCH */}
        <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-stone-100 border border-stone-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-black transition-all"
          />
          <p className="text-xs text-stone-400 mt-3 uppercase tracking-widest font-bold">
            {filteredUsers.length} of {users.length} users
          </p>
        </div>

        {/* USER TABLE */}
        <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-10 text-center text-stone-500">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-600">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-600">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-600">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-stone-900">{user.full_name || "Unknown"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-stone-600">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          user.role === "master"
                            ? "bg-purple-100 text-purple-700"
                            : user.role === "leadership"
                            ? "bg-blue-100 text-blue-700"
                            : user.role === "tutor"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-stone-100 text-stone-700"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={savingId === user.id}
                          className="bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-black transition-all disabled:opacity-50 cursor-pointer"
                        >
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

        {/* STATS */}
        <div className="grid gap-6 md:grid-cols-4">
          <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-stone-400">Total Users</p>
            <p className="text-3xl font-playfair font-bold mt-4">{users.length}</p>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-stone-400">Students</p>
            <p className="text-3xl font-playfair font-bold mt-4">{users.filter(u => u.role === "student").length}</p>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-stone-400">Tutors</p>
            <p className="text-3xl font-playfair font-bold mt-4">{users.filter(u => u.role === "tutor").length}</p>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] font-bold text-stone-400">Leadership</p>
            <p className="text-3xl font-playfair font-bold mt-4">{users.filter(u => u.role === "leadership").length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
