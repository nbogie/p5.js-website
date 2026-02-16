import { useEffect, useState } from 'preact/hooks';

export default function DynamicToC() {
  const [items, setItems] = useState<{id: string, title: string}[]>([]);

  useEffect(() => {
    const syncToC = () => {
      const islands = Array.from(document.querySelectorAll('astro-island'));
      
      const nextItems = islands
        .map((island, idx) => {
          //.cm-content: codemirror content
          const editor = island.querySelector('.cm-content') as HTMLElement;
          const container = island.querySelector('.my-md') as HTMLElement;
          
          if (!editor || !container) return null;

          // Ensure the target has an ID for the anchor link
          const id = container.id || `sketch-${idx}`;
          if (container.id !== id) container.id = id;

          return { id, title: extractTitleFromCode(editor, idx) };
        })
        .filter((item) => !!item);

      // Deep compare to prevent unnecessary Preact re-renders
      setItems(prev => JSON.stringify(prev) === JSON.stringify(nextItems) ? prev : nextItems);
    };

    // Use a ResizeObserver or MutationObserver to catch hydration
    const observer = new MutationObserver(syncToC);
    observer.observe(document.body, { childList: true, subtree: true });
    
    syncToC(); // Initial run
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <aside className="fixed right-0 top-1/4 w-64 z-[9999] bg-white border border-slate-200 shadow-lg rounded-l-lg p-4 font-sans">
      <header className="border-b border-slate-100 pb-2 mb-3">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outline</h2>
      </header>
      <nav>
        <ol className="space-y-3">
          {items.map((item, i) => (
            <TOCLink key={item.id} number={i + 1} item={item} />
          ))}
        </ol>
      </nav>
    </aside>
  );
}

// Sub-component for better readability
function TOCLink({ number, item }: { number: number, item: {id: string, title: string} }) {
  return (
    <li className="text-sm group">
      <a href={`#${item.id}`} className="flex items-start gap-2 text-indigo-600 hover:text-indigo-800 transition-colors">
        <span className="text-slate-300 font-mono text-[10px] pt-0.5">{number}.</span>
        <span className="hover:underline decoration-indigo-200 underline-offset-4">{item.title}</span>
      </a>
    </li>
  );
}

function extractTitleFromCode(editor: HTMLElement, index: number): string {
  const code = editor.innerText || "";
  const lines = code.split(/\r?\n/);
  
  const firstComment = lines
    .map(l => l.match(/\/\/\s*(.+)/)?.[1]?.trim())
    .find(c => !!c && !c.startsWith('http'));

  return firstComment || `Sketch ${index + 1}`;
}
