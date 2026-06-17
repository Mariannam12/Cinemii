import { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { TASTE_GENRES, setTaste } from '../../core/taste';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export function TastePicker({ onDone }) {
  const [picked, setPicked] = useState(new Set());
  const trapRef = useFocusTrap(true);

  const toggle = (id) => setPicked(p => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const save = () => { setTaste([...picked]); onDone([...picked]); };
  const skip = () => { setTaste([]); onDone([]); };

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-overlay">
      <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Pick your favorite genres" className="glass-dark w-full max-w-lg rounded-3xl p-7 shadow-2xl animate-pop">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-11 h-11 rounded-2xl gradient-accent flex items-center justify-center shadow-lg shadow-accent/30">
            <Sparkles size={22} className="text-white" />
          </span>
          <div>
            <h2 className="text-xl font-black text-white">What do you love?</h2>
            <p className="text-muted text-sm">Pick a few genres so we can tailor your home.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 my-6">
          {TASTE_GENRES.map(g => {
            const on = picked.has(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                aria-pressed={on}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition active:scale-95 ${on ? 'gradient-accent text-white shadow-lg shadow-accent/30' : 'glass text-white hover:bg-white/10'}`}
              >
                {on && <Check size={13} className="inline mr-1" />}{g.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={skip} className="text-muted text-sm hover:text-white transition">Skip for now</button>
          <button
            onClick={save}
            disabled={picked.size === 0}
            className="gradient-accent text-white font-bold px-6 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition disabled:opacity-40"
          >
            Save ({picked.size})
          </button>
        </div>
      </div>
    </div>
  );
}
