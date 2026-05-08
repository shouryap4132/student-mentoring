export default function ResourceLibrary() {
  const resources = ["Tutor Handbook.pdf", "Effective Communication.mp4", "Math Teaching Tools.zip"];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-playfair font-bold">Resource Library</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {resources.map(file => (
          <div key={file} className="bg-white p-8 rounded-3xl border border-stone-200 hover:border-black cursor-pointer transition-all">
            <span className="text-2xl mb-2 block">📄</span>
            <p className="font-bold">{file}</p>
            <p className="text-xs text-stone-400 uppercase mt-2 font-bold tracking-widest">Download</p>
          </div>
        ))}
      </div>
    </div>
  );
}