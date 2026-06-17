import { useRef, useState, useCallback } from 'react';
import { Upload, Trash2, ImagePlus } from 'lucide-react';

// Resize/crop an image file to a square JPEG data URI (keeps payload small).
function fileToAvatar(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Please choose an image file.')); return; }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That image could not be loaded.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function AvatarUpload({ value, onChange, name = '' }) {
  const inputRef          = useRef(null);
  const [drag, setDrag]   = useState(false);
  const [err, setErr]     = useState(null);
  const initials = name?.[0]?.toUpperCase() || '?';

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setErr(null);
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Image must be under 8 MB.');
      onChange(await fileToAvatar(file));
    } catch (e) { setErr(e.message); }
  }, [onChange]);

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`flex items-center gap-4 rounded-2xl p-4 cursor-pointer border-2 border-dashed transition ${
          drag ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/25 bg-white/[0.03]'
        }`}
      >
        {/* Preview */}
        <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/10 flex-shrink-0 bg-surface">
          {value
            ? <img src={value} alt="avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full gradient-accent flex items-center justify-center text-white text-2xl font-black">{initials}</div>
          }
        </div>
        {/* Instructions */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold flex items-center gap-2">
            <ImagePlus size={15} className="text-accent" /> {drag ? 'Drop to upload' : 'Drag & drop a photo'}
          </p>
          <p className="text-muted text-xs mt-1">or click to browse · JPG/PNG, square works best</p>
          {err && <p className="text-red-400 text-xs mt-1">{err}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex items-center gap-3 mt-2">
        <button type="button" onClick={() => inputRef.current?.click()} className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition">
          <Upload size={13} /> Upload
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="flex items-center gap-1.5 text-xs text-muted hover:text-red-400 transition">
            <Trash2 size={13} /> Remove
          </button>
        )}
      </div>
    </div>
  );
}
