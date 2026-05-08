export default function StudyMaterials() {
  const items = ["SAT Prep Guide 2024", "Algebra II Cheat Sheet", "Essay Writing Template"];
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-playfair font-bold">Study Materials</h2>
      <div className="grid gap-4">
        {items.map(item => (
          <div key={item} className="bg-white p-6 rounded-3xl border border-stone-100 flex justify-between items-center hover:bg-stone-50 cursor-pointer">
            <p className="font-bold">{item}</p>
            <span className="text-xs font-bold uppercase text-stone-400">Download PDF</span>
          </div>
        ))}
      </div>
    </div>
  );
}