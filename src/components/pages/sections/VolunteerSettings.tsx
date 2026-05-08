import { useState } from "react";
import { supabase } from "../../../utils/supabaseClient";

export default function VolunteerSettings({ profile, setProfile }: any) {
  const [bio, setBio] = useState(profile?.bio || "");

  const saveSettings = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ bio })
      .eq('id', profile.id);
    
    if (!error) {
        setProfile({...profile, bio});
        alert("Settings saved!");
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-3xl font-playfair font-bold">Profile Settings</h2>
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Public Bio</label>
        <textarea 
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-2xl p-4 h-32 focus:ring-2 focus:ring-black outline-none"
          placeholder="Tell students about your teaching style..."
        />
      </div>
      <button 
        onClick={saveSettings}
        className="px-8 py-4 bg-black text-white rounded-2xl font-bold uppercase text-xs tracking-widest"
      >
        Save Changes
      </button>
    </div>
  );
}