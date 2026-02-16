import { useEffect, useState } from 'preact/hooks';

interface TOCItem {
  id: string;
  title: string;
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

  if (items.length === 0) return null;

  return (
    <aside className="fixed right-0 top-[20%] w-72 z-[9999] bg-white border border-slate-200 shadow-xl rounded-l-xl p-5 font-sans overflow-y-auto max-h-[70vh]">
      <ol className="space-y-4">
        {/* The "Clear All" button - structured exactly like a ToC item */}
        <li className="flex items-center gap-3 pb-4 mb-2 border-b border-slate-100">
          <button 
            onClick={() => confirm('Clear all?') && (setCheckedItems({}), localStorage.removeItem('toc-progress'))}
            className="h-4 w-4 rounded bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold shrink-0"
          >
            ×
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Clear Progress ({Object.values(checkedItems).filter(Boolean).length}/{items.length})
          </span>
        </li>

        {/* The actual checklist */}
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
              className={`text-[13px] leading-tight ${
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