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
        
        // 1. Split into lines and find all comments
        // This is more stable than a global regex loop
        const lines = code.split(/\r?\n/);
        const allComments = lines
          .map(line => {
            const match = line.match(/\/\/\s*(.+)/);
            return match ? match[1].trim() : null;
          })
          .filter((c): c is string => !!c && !c.startsWith('http'));

        // 2. Title is the first non-URL comment, or fallback
        const title = allComments.length > 0 
          ? allComments[0] 
          : `Sketch ${sketchCount}`;

        found.push({ id, title });
      });

      setItems(prev => {
        const nextJSON = JSON.stringify(found);
        if (JSON.stringify(prev) === nextJSON) return prev;
        return found;
      });
    };

    // Initial delay to let CodeMirror populate
    const timer = setTimeout(scan, 100);

    const observer = new MutationObserver(() => scan());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <nav className="p-4 my-8 border-l-4 border-indigo-500 bg-slate-50 rounded shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        Interactive Sketches
      </h2>
      <ol className="space-y-2 list-decimal list-inside">
        {items.map((item) => (
          <li key={item.id} className="text-sm">
            <a href={`#${item.id}`} className="font-medium text-indigo-600 hover:underline">
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}