import { useEffect, useState } from 'preact/hooks';

interface TOCItem {
  id: string;
  title: string;
}

// --- PURE UTILS: Separating the Scraper ---
const getSketchTitle = (editor: HTMLElement, fallbackIndex: number): string => {
  const code = editor.innerText || "";
  const lines = code.split(/\r?\n/);
  
  const firstComment = lines
    .map(line => line.match(/\/\/\s*(.+)/)?.[1]?.trim())
    .find(content => !!content && !content.startsWith('http'));

  return firstComment || `Sketch ${fallbackIndex + 1}`;
};

// --- SUB-COMPONENT: UI Item Logic ---
interface ItemProps {
  item: TOCItem;
  index: number;
  isChecked: boolean;
  onToggle: (id: string) => void;
}

const TOCEntry = ({ item, index, isChecked, onToggle }: ItemProps) => (
  <li className="flex items-start gap-3 group">
    <input 
      type="checkbox" 
      checked={isChecked} 
      onChange={() => onToggle(item.id)}
      className="mt-1 h-3.5 w-3.5 accent-indigo-600 cursor-pointer shadow-sm"
    />
    <a 
      href={`#${item.id}`} 
      className={`text-xs leading-snug transition-all ${
        isChecked 
          ? 'text-slate-400 line-through italic' 
          : 'text-indigo-600 font-medium hover:text-indigo-800'
      }`}
    >
      <span className="text-[10px] font-mono opacity-40 mr-1">{(index + 1).toString().padStart(2, '0')}</span>
      {item.title}
    </a>
  </li>
);

// --- MAIN COMPONENT ---
export default function DynamicToC() {
  const [items, setItems] = useState<TOCItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Persistence initialization
    const saved = localStorage.getItem('toc-progress');
    if (saved) setCheckedItems(JSON.parse(saved));

    const scan = () => {
      const islands = document.querySelectorAll('astro-island');
      const found: TOCItem[] = [];
      let count = 0;

      islands.forEach((island) => {
        const editor = island.querySelector('.cm-content') as HTMLElement;
        if (!editor) return;

        const id = `sketch-${count}`; // Positional ID for localstorage stability
        const container = island.querySelector('.my-md') as HTMLElement;
        if (container && container.id !== id) container.id = id;

        found.push({
          id,
          title: getSketchTitle(editor, count)
        });
        count++;
      });

      setItems(prev => JSON.stringify(prev) === JSON.stringify(found) ? prev : found);
    };

    const timer = setTimeout(scan, 200);
    const observer = new MutationObserver(scan);
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

  if (items.length === 0) return null;

  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <aside className="fixed right-0 top-1/4 w-64 z-[9999] bg-white/90 backdrop-blur border border-slate-200 shadow-xl rounded-l-2xl p-5 font-sans">
      <header className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-end">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Tutorial Progress</h2>
          <p className="text-[9px] text-slate-300 font-medium mt-0.5 italic">Positional Tracking Active</p>
        </div>
        <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
          {completedCount}/{items.length}
        </span>
      </header>

      <nav>
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