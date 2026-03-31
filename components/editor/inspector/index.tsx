const Inspector = () => {
  return (
    <div className="p-4 h-full flex flex-col gap-4">
      <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest">
        Properties
      </h3>
      <div className="flex-1 border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-center p-4">
        [Select an item to view properties]
      </div>
    </div>
  );
};

export default Inspector;
