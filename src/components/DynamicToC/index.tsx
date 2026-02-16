import { useEffect, useState } from 'preact/hooks';

interface TOCItem {
  id: string;
  title: string;
}

export default function DynamicToC() {
  const [items, setItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    const scan = () => {
      // 1. Target the islands. Astro renders these in the exact order 
      // they appear in your MDX file. This solves the ordering issue.
      const islands = document.querySelectorAll('astro-island');
      
      const found: TOCItem[] = [];

      islands.forEach((island, index) => {
        // Only process islands that contain our CodeEmbed/Editor
        const editor = island.querySelector('.cm-content') as HTMLElement;
        if (!editor) return;

        const container = island.querySelector('.my-md') as HTMLElement;
        const id = container?.id || `sketch-step-${index}`;
        if (container && !container.id) container.id = id;

        // 2. Improved Scraper: Get all text and look for the first // comment
        const code = editor.innerText || "";
        
        // 'g' flag with exec lets us find the first one regardless of line position
        const commentRegex = /\/\/\s*([^\n\r]+)/g;
        const match = commentRegex.exec(code);
        
        let title = `Sketch ${index + 1}`;
        if (match && match[1]) {
          const content = match[1].trim();
          // Skip URLs (like p5.js includes)
          if (!content.startsWith('http')) {
            title = content;
          } else {
            // If the first comment was a URL, try to find a second one
            const secondMatch = commentRegex.exec(code);
            if (secondMatch && secondMatch[1]) {
              title = secondMatch[1].trim();
            }
          }
        }

        found.push({ id, title });
      });

      setItems(prev => (JSON.stringify(prev) === JSON.stringify(found) ? prev : found));
    };

    scan();
    const observer = new MutationObserver(() => scan());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  return (
    <nav className="p-4 my-8 border-l-4 border-indigo-500 bg-slate-50 rounded">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        In this tutorial
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