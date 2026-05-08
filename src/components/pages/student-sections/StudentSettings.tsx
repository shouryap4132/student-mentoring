import { useState } from "react";
import { supabase } from "../../../utils/supabaseClient";

export default function StudentSettings({ profile, setProfile }: any) {
  const [name, setName] = useState(profile?.full_name || "");

  const handleUpdate = async () => {
    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', profile.id);
    if (!error) {
      setProfile({...profile, full_name: name});
      alert("Updated successfully!");
    }
  };

  return (
    <div className="max-w-xl space-y-8">
      <h2 className="text-3xl font-playfair font-bold">Account Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase text-stone-400 block mb-2">Display Name</label>
          <input 
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-black"
          />
        </div>
        <button onClick={handleUpdate} className="px-8 py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest">
          Save Settings
        </button>
      </div>
    </div>
  );
}