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

// --- COMPONENTS ---

const TOCEntry = ({ 
  item, 
  index, 
  isChecked, 
  onToggle 
}: { 
  item: TOCItem, 
  index: number, 
  isChecked: boolean, 
  onToggle: (id: string) => void 
}) => (
  <li className="flex items-start gap-3 group">
    <input 
      type="checkbox" 
      checked={isChecked} 
      onChange={() => onToggle(item.id)}
      className="mt-1 h-3.5 w-3.5 accent-indigo-600 cursor-pointer shrink-0"
    />
    <a 
      href={`#${item.id}`} 
      className={`text-xs leading-snug transition-all ${
        isChecked ? 'text-slate-400 line-through italic' : 'text-indigo-600 font-medium'
      }`}
    >
      <span className="text-[10px] font-mono opacity-40 mr-1">
        {(index + 1).toString().padStart(2, '0')}
      </span>
      {item.title}
    </a>
  </li>
);

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

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
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
  const progressPercent = (completedCount / items.length) * 100;

  return (
    <aside className="fixed right-0 top-32 w-64 z-[9999] bg-white border-y border-l border-slate-200 shadow-xl rounded-l-2xl p-5 font-sans">
      <header className="border-b border-slate-100 pb-3 mb-4 space-y-3">
        {/* Top Row: Labels and Clear Button */}
        <div className="flex justify-between items-start">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</h2>
          <button 
            onClick={clearAll}
            className="text-[9px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-tighter transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Bottom Row: Stats and Bar */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
            {completedCount}/{items.length}
          </span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-400 transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <nav className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        <ol className="space-y-4">
          {items.map((item, i) => (
            <TOCEntry 
              key={item.id} 
              item={item} 
              index={i} 
              isChecked={!!checkedItems[item.id]} 
              onToggle={handleToggle} 
            />
          ))}
        </ol>
      </nav>
    </aside>
  );
}