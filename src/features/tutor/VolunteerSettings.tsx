import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";

export default function VolunteerSettings({ profile, setProfile }: any) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    subjects: profile?.subjects || [],
  });

  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error("User session not found");

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success("Photo uploaded and saved!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: formData.full_name, bio: formData.bio, subjects: formData.subjects })
      .eq("id", session?.user?.id);
    if (error) toast.error("Update failed");
    else { setProfile({ ...profile, ...formData }); toast.success("Settings saved successfully."); }
    setLoading(false);
  };

  const addSubject = () => {
    if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
      setFormData({ ...formData, subjects: [...formData.subjects, newSubject.trim()] });
      setNewSubject("");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl pb-20">
      <header className="mb-12">
        <h2 className="text-4xl font-playfair font-bold text-stone-900">Volunteer Settings</h2>
        <p className="text-stone-400 mt-2">Personalize your tutor profile and availability.</p>
      </header>

      <div className="space-y-12">
        <section className="bg-white p-8 rounded-[2.5rem] border border-stone-200 flex items-center gap-8 shadow-sm">
          <div className="relative group">
            <div className="w-28 h-28 bg-stone-50 rounded-[2rem] border border-stone-100 overflow-hidden shadow-inner flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <span className="text-3xl font-bold text-stone-200">{profile?.full_name?.[0]}</span>
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-[2rem]">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Headshot</p>
            <label className="cursor-pointer group">
              <span className="text-sm font-bold border-b-2 border-black pb-0.5 group-hover:text-stone-500 transition-all">
                {uploading ? "Uploading..." : "Change Image"}
              </span>
              <input type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            </label>
            <p className="text-[10px] text-stone-300 mt-1">PNG, JPG up to 2MB.</p>
          </div>
        </section>

        <form onSubmit={handleSaveAll} className="space-y-8">
          <div className="grid gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Full Name</label>
              <input type="text" value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-white border border-stone-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Bio / Expertise</label>
              <textarea rows={4} value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Describe your background and teaching style..."
                className="w-full bg-white border border-stone-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all resize-none" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">Proficient Subjects</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.subjects?.map((sub: string) => (
                <span key={sub} className="bg-stone-100 text-stone-700 px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-3">
                  {sub}
                  <button type="button"
                    onClick={() => setFormData({ ...formData, subjects: formData.subjects.filter((s: string) => s !== sub) })}
                    className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSubject} placeholder="Add subject (e.g. SAT Math)"
                onChange={(e) => setNewSubject(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
                className="flex-1 bg-stone-50 border border-stone-200 px-4 py-3 rounded-xl text-sm outline-none" />
              <button type="button" onClick={addSubject}
                className="bg-stone-200 text-stone-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-300 transition-colors">
                Add
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full md:w-auto bg-black text-white px-12 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-stone-800 shadow-lg shadow-stone-200 disabled:bg-stone-300 transition-all">
            {loading ? "Saving..." : "Update Volunteer Profile"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
