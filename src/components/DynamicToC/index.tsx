import { useEffect, useState } from 'preact/hooks';

interface TOCItem {
  id: string;
  title: string;
}

export default function DynamicToC() {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('toc-progress');
    if (saved) setCheckedItems(JSON.parse(saved));

    const runScan = () => {
      const nextItems = processIslands(Array.from(document.querySelectorAll('astro-island')));
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

  const handleClear = () => {
    setCheckedItems({});
    localStorage.removeItem('toc-progress');
  };

  if (items.length === 0) return null;

  return (
    <aside className="fixed right-0 top-[20%] w-72 z-[9999] bg-white border border-slate-200 shadow-xl rounded-l-xl p-5 font-sans overflow-y-auto max-h-[75vh]">
      <ol className="space-y-4">
        {/* Clear Progress Row */}
        <li className="flex items-center gap-3 pb-4 mb-2 border-b border-slate-100">
          <button 
            onClick={handleClear}
            className="h-5 w-5 rounded bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs font-bold shrink-0 transition-colors border border-rose-100"
          >
            ×
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Clear ({Object.values(checkedItems).filter(Boolean).length}/{items.length})
          </span>
        </li>

        {/* List items */}
        {items.map((item, i) => (
          <li key={item.id} className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={!!checkedItems[item.id]} 
              onChange={() => handleToggle(item.id)}
              className="h-4 w-4 accent-indigo-600 cursor-pointer shrink-0"
            />
            <a 
              href={`#${item.id}`} 
              className={`text-[13px] leading-tight flex-1 ${
                checkedItems[item.id] ? 'text-slate-300 line-through italic' : 'text-slate-700 font-medium'
              }`}
            >
              <span className="text-[10px] font-mono opacity-30 mr-2">
                {(i + 1).toString().padStart(2, '0')}
              </span>
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}

const extractTitle = (code: string): string | null => {
  return code
    .split(/\r?\n/)
    .map(line => line.match(/\/\/\s*(.+)/)?.[1]?.trim())
    .find(content => !!content && !content.startsWith('http')) || null;
};

const processIslands = (islands: Element[]): TOCItem[] => {
  return Array.from(islands).map((island, index) => {
    const editor = island.querySelector('.cm-content') as HTMLElement;
    const container = island.querySelector('.my-md') as HTMLElement;
    if (!editor || !container) return null;
    const id = `sketch-${index}`;
    if (container.id !== id) container.id = id;
    const title = extractTitle(editor.innerText || "") || `Sketch ${index + 1}`;
    return { id, title };
  }).filter((item): item is TOCItem => !!item);
};
