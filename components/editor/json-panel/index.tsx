const JsonPanel = () => {
  return (
    <div className="h-full bg-black/50 backdrop-blur-md border border-slate-800 rounded-t-xl p-4 font-mono text-xs text-green-500 overflow-hidden">
      <span className="text-slate-500">// Real-time Scene Configuration</span>
      <pre className="mt-2">{'{ "items": [] }'}</pre>
    </div>
  );
};

export default JsonPanel;
