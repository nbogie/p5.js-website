import { useEffect, useState } from 'preact/hooks';

interface TOCItem {
  id: string;
  title: string;
}

export default function DynamicToC() {
  const [items, setItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    const scan = () => {
      const islands = document.querySelectorAll('astro-island');
      const found: TOCItem[] = [];
      let sketchCount = 0;

      islands.forEach((island) => {
        const editor = island.querySelector('.cm-content') as HTMLElement;
        if (!editor) return;

        sketchCount++;
        const container = island.querySelector('.my-md') as HTMLElement;
        const id = container?.id || `sketch-step-${sketchCount}`;
        if (container && !container.id) container.id = id;

        const code = editor.innerText || "";
        const lines = code.split(/\r?\n/);
        
        const allComments = lines
          .map(line => {
            const match = line.match(/\/\/\s*(.+)/);
            return match ? match[1].trim() : null;
          })
          .filter((c): c is string => !!c && !c.startsWith('http'));

        const title = allComments.length > 0 ? allComments[0] : `Sketch ${sketchCount}`;
        found.push({ id, title });
      });

      setItems(prev => {
        const nextJSON = JSON.stringify(found);
        return JSON.stringify(prev) === nextJSON ? prev : found;
      });
    };

    const timer = setTimeout(scan, 200);
    const observer = new MutationObserver(() => scan());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <aside className="fixed right-0 top-1/4 w-64 z-[9999] bg-white border border-slate-200 shadow-lg rounded-l-lg p-4">
      <h2 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
        Sketches
      </h2>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={item.id} className="text-sm">
            <a 
              href={`#${item.id}`} 
              className="text-indigo-600 hover:underline flex gap-2"
            >
              <span className="text-slate-300 font-mono">{i + 1}.</span>
              <span>{item.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}