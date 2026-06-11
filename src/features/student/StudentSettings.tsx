import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

export default function StudentSettings({ profile, setProfile }: any) {
  const [name, setName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [knowledge, setKnowledge] = useState(profile?.knowledge_level || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      toast.success("Photo uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, bio, knowledge_level: knowledge })
      .eq("id", profile.id);
    if (error) toast.error("Update failed");
    else { setProfile({ ...profile, full_name: name, bio, knowledge_level: knowledge }); toast.success("Settings saved!"); }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h2 className="text-4xl font-playfair font-bold">Account Settings</h2>
        <p className="text-stone-500 mt-2">Manage your profile and learning preferences.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm">
        <h3 className="text-2xl font-playfair font-bold mb-6">Profile Picture</h3>
        <div className="flex items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 bg-stone-100 rounded-3xl flex items-center justify-center border border-stone-200 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-stone-300">{name?.charAt(0).toUpperCase() || "?"}</span>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-3xl">
              <span className="text-white text-sm font-bold text-center">Upload Photo</span>
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
            </label>
          </div>
          <div>
            <p className="text-sm text-stone-600 mb-4">Upload a profile picture to help tutors connect with you.</p>
            <label className="inline-block px-6 py-3 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest cursor-pointer hover:bg-stone-900 transition-all">
              {uploading ? "Uploading..." : "Choose Photo"}
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-stone-200 p-8 shadow-sm space-y-6">
        <h3 className="text-2xl font-playfair font-bold">Personal Information</h3>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Display Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)}
            placeholder="Tell tutors about your learning goals."
            className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all resize-none"
            rows={4} />
          <p className="text-[10px] text-stone-400 mt-2">{bio.length}/200 characters</p>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-2">What do you already know?</label>
          <textarea value={knowledge} onChange={(e) => setKnowledge(e.target.value)}
            placeholder="E.g., 'Intermediate algebra, basic geometry, Python fundamentals'"
            className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-black transition-all resize-none"
            rows={3} />
          <p className="text-[10px] text-stone-400 mt-2">This helps tutors customize their approach for you.</p>
        </div>
        <button onClick={handleUpdate} disabled={loading}
          className="w-full px-8 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-stone-900 transition-all disabled:opacity-50">
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
