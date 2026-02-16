import { useEffect, useState } from 'preact/hooks';

interface TOCItem {
  id: string;
  title: string;
}

// --- PURE UTILS ---
const extractTitle = (code: string): string | null => {
  return code
    .split(/\r?\n/)
    .map(line => line.match(/\/\/\s*(.+)/)?.[1]?.trim())
    .find(content => !!content && !content.startsWith('http')) || null;
};

const processIslands = (islands: Element[]): TOCItem[] => {
  return Array.from(islands)
    .map((island, index) => {
      const editor = island.querySelector('.cm-content') as HTMLElement;
      const container = island.querySelector('.my-md') as HTMLElement;
      if (!editor || !container) return null;

      const id = `sketch-${index}`;
      if (container.id !== id) container.id = id;

      const code = editor.innerText || "";
      const title = extractTitle(code) || `Sketch ${index + 1}`;
      return { id, title };
    })
    .filter((item): item is TOCItem => !!item);
};

export default function DynamicToC() {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('toc-progress');
    if (saved) setCheckedItems(JSON.parse(saved));

    const runScan = () => {
      const islandElements = Array.from(document.querySelectorAll('astro-island'));
      const nextItems = processIslands(islandElements);
      setItems(prev => JSON.stringify(prev) === JSON.stringify(nextItems) ? prev : nextItems);
    };

    const timer = setTimeout(runScan, 200);
    const observer = new MutationObserver(runScan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  const handleToggle = (id: string) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    localStorage.setItem('toc-progress', JSON.stringify(next));
  };

  const clearAll = () => {
    if (confirm('Clear all progress?')) {
      setCheckedItems({});
      localStorage.removeItem('toc-progress');
    }
  };

  if (items.length === 0) return null;
  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <aside 
      className="fixed right-0 top-40 w-80 z-[9999] bg-white border border-slate-200 shadow-2xl rounded-l-2xl flex flex-col font-sans"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* Header - Z-index ensures it stays on top of list items */}
      <div className="relative z-20 p-5 bg-slate-50 border-b border-slate-100 rounded-tl-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tutorial Progress</h2>
          <button 
            onClick={clearAll}
            className="text-[10px] font-bold text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-200 px-2 py-1 rounded transition-all shadow-sm"
          >
            CLEAR ALL
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-indigo-500 transition-all duration-700 ease-out" 
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-black text-indigo-600 min-w-[40px] text-right">
            {completedCount}/{items.length}
          </span>
        </div>
      </div>

      {/* List - overflow-y-auto only here, with hidden scrollbars for a clean look */}
      <nav className="relative z-10 flex-1 overflow-y-auto p-5 scrollbar-hide">
        <ol className="space-y-5">
          {items.map((item, i) => (
            <li key={item.id} className="flex items-start gap-4">
              <div className="relative flex items-center justify-center">
                 <input 
                  type="checkbox" 
                  checked={!!checkedItems[item.id]} 
                  onChange={() => handleToggle(item.id)}
                  className="peer h-5 w-5 opacity-0 absolute cursor-pointer z-10"
                />
                <div className="h-5 w-5 border-2 border-slate-200 rounded peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all flex items-center justify-center text-white text-[10px]">
                  {!!checkedItems[item.id] && "✓"}
                </div>
              </div>
              
              <a 
                href={`#${item.id}`} 
                className={`text-[13px] leading-tight transition-all flex-1 ${
                  checkedItems[item.id] ? 'text-slate-300 line-through italic' : 'text-slate-700 font-medium hover:text-indigo-600'
                }`}
              >
                <span className="text-[10px] font-mono opacity-30 block mb-0.5">STEP {(i + 1).toString().padStart(2, '0')}</span>
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      
      {/* Visual Footer fade to show there is more to scroll */}
      <div className="h-4 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-bl-2xl" />
    </aside>
  );
}