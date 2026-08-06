"use client";

import { useState, useRef, useCallback } from "react";

export type BlockType = "h1" | "h2" | "h3" | "paragraph" | "quote" | "image" | "divider" | "bullets" | "callout";

export type Block =
  | { id: string; type: "h1" | "h2" | "h3" | "paragraph" | "quote" | "callout"; text: string }
  | { id: string; type: "image"; url: string; caption: string; file?: File }
  | { id: string; type: "divider" }
  | { id: string; type: "bullets"; items: string[] };

function uid() { return Math.random().toString(36).slice(2, 9); }

function emptyBlock(type: BlockType): Block {
  if (type === "image") return { id: uid(), type: "image", url: "", caption: "" };
  if (type === "divider") return { id: uid(), type: "divider" };
  if (type === "bullets") return { id: uid(), type: "bullets", items: [""] };
  return { id: uid(), type, text: "" } as Block;
}

const BLOCK_LABELS: { type: BlockType; icon: string; label: string }[] = [
  { type: "h1",       icon: "H1", label: "Heading 1"  },
  { type: "h2",       icon: "H2", label: "Heading 2"  },
  { type: "h3",       icon: "H3", label: "Heading 3"  },
  { type: "paragraph",icon: "¶",  label: "Paragraph"  },
  { type: "quote",    icon: "❝",  label: "Quote"      },
  { type: "bullets",  icon: "•",  label: "Bullet List"},
  { type: "image",    icon: "🖼",  label: "Image"      },
  { type: "callout",  icon: "💡", label: "Callout"    },
  { type: "divider",  icon: "—",  label: "Divider"    },
];

function BlockToolbar({ onAdd }: { onAdd: (t: BlockType) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 0", borderBottom: "1px solid var(--a-border)", marginBottom: 12 }}>
      {BLOCK_LABELS.map(({ type, icon, label }) => (
        <button key={type} type="button" title={label} onClick={() => onAdd(type)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1.5px solid var(--a-border)", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--a-text)" }}>
          <span style={{ fontFamily: "monospace", fontSize: 13 }}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

function TextBlock({ block, onChange, onKeyDown }: {
  block: Extract<Block, { text: string }>;
  onChange: (text: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
}) {
  const styles: Record<string, React.CSSProperties> = {
    h1:        { fontSize: 26, fontWeight: 800, border: "none", outline: "none", resize: "none", width: "100%", fontFamily: "inherit", background: "transparent", padding: "4px 0" },
    h2:        { fontSize: 20, fontWeight: 700, border: "none", outline: "none", resize: "none", width: "100%", fontFamily: "inherit", background: "transparent", padding: "4px 0" },
    h3:        { fontSize: 16, fontWeight: 700, border: "none", outline: "none", resize: "none", width: "100%", fontFamily: "inherit", background: "transparent", padding: "4px 0" },
    paragraph: { fontSize: 15, fontWeight: 400, border: "none", outline: "none", resize: "none", width: "100%", fontFamily: "inherit", background: "transparent", padding: "4px 0", lineHeight: 1.7 },
    quote:     { fontSize: 15, fontStyle: "italic", borderLeft: "4px solid #B8923A", paddingLeft: 16, outline: "none", resize: "none", width: "100%", fontFamily: "inherit", background: "transparent", color: "#555", lineHeight: 1.7 },
    callout:   { fontSize: 14, border: "none", outline: "none", resize: "none", width: "100%", fontFamily: "inherit", background: "transparent", padding: "4px 0", lineHeight: 1.6 },
  };
  const placeholders: Record<string, string> = {
    h1: "Heading 1…", h2: "Heading 2…", h3: "Heading 3…",
    paragraph: "Write something…", quote: "Quote or pull text…", callout: "Callout note…",
  };
  return (
    <textarea
      value={block.text}
      placeholder={placeholders[block.type] ?? ""}
      rows={block.type === "paragraph" ? 3 : 1}
      onChange={e => { onChange(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
      onKeyDown={onKeyDown}
      style={{ ...styles[block.type], overflow: "hidden", minHeight: 28 }}
    />
  );
}

function BulletsBlock({ block, onChange }: { block: Extract<Block, { type: "bullets" }>; onChange: (items: string[]) => void }) {
  const update = (i: number, val: string) => {
    const next = [...block.items];
    next[i] = val;
    onChange(next);
  };
  const addItem = () => onChange([...block.items, ""]);
  const removeItem = (i: number) => onChange(block.items.filter((_, idx) => idx !== i));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {block.items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#B8923A", fontWeight: 700, fontSize: 18, lineHeight: 1 }}>•</span>
          <input value={item} onChange={e => update(i, e.target.value)} placeholder="List item…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", fontFamily: "inherit" }} />
          {block.items.length > 1 && (
            <button type="button" onClick={() => removeItem(i)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 16, lineHeight: 1, padding: "0 2px" }}>×</button>
          )}
        </div>
      ))}
      <button type="button" onClick={addItem}
        style={{ alignSelf: "flex-start", fontSize: 12, color: "var(--a-gold)", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontWeight: 600 }}>
        + Add item
      </button>
    </div>
  );
}

function ImageBlock({ block, onChange, uploadFn }: {
  block: Extract<Block, { type: "image" }>;
  onChange: (partial: Partial<typeof block>) => void;
  uploadFn: (file: File) => Promise<string>;
}) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function pick(file: File) {
    setUploading(true);
    try {
      const url = await uploadFn(file);
      onChange({ url, file });
    } finally { setUploading(false); }
  }
  return (
    <div style={{ border: "1.5px dashed var(--a-border)", borderRadius: 10, padding: 12, background: "var(--a-raised)" }}>
      {block.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.url} alt={block.caption} style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} />
      ) : (
        <div onClick={() => ref.current?.click()}
          style={{ height: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--a-muted)" }}>
          {uploading ? "Uploading…" : <><span style={{ fontSize: 28 }}>🖼</span><span style={{ fontSize: 13, marginTop: 6 }}>Click to upload image</span></>}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => e.target.files?.[0] && pick(e.target.files[0])} />
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <input value={block.caption} onChange={e => onChange({ caption: e.target.value })} placeholder="Caption (optional)"
          style={{ flex: 1, border: "1px solid var(--a-border)", borderRadius: 6, padding: "5px 8px", fontSize: 12, background: "#fff", outline: "none" }} />
        {block.url && (
          <button type="button" onClick={() => ref.current?.click()}
            style={{ fontSize: 11, padding: "5px 10px", border: "1px solid var(--a-border)", borderRadius: 6, cursor: "pointer", background: "#fff" }}>
            Change
          </button>
        )}
      </div>
    </div>
  );
}

interface BlogEditorProps {
  initialBlocks?: Block[];
  onChange: (blocks: Block[]) => void;
  uploadFn: (file: File) => Promise<string>;
}

export default function BlogEditor({ initialBlocks, onChange, uploadFn }: BlogEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks && initialBlocks.length > 0
      ? initialBlocks
      : [emptyBlock("paragraph")]
  );

  const update = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onChange(newBlocks);
  }, [onChange]);

  const addBlock = (type: BlockType, afterId?: string) => {
    const nb = emptyBlock(type);
    if (!afterId) { update([...blocks, nb]); return; }
    const idx = blocks.findIndex(b => b.id === afterId);
    const next = [...blocks];
    next.splice(idx + 1, 0, nb);
    update(next);
  };

  const updateBlock = (id: string, patch: Partial<Block>) => {
    update(blocks.map(b => b.id === id ? { ...b, ...patch } as Block : b));
  };

  const removeBlock = (id: string) => {
    const next = blocks.filter(b => b.id !== id);
    update(next.length === 0 ? [emptyBlock("paragraph")] : next);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx + dir < 0 || idx + dir >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    update(next);
  };

  return (
    <div style={{ border: "1.5px solid var(--a-border)", borderRadius: 10, background: "#fff", padding: 16 }}>
      <BlockToolbar onAdd={(t) => addBlock(t)} />

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {blocks.map((block, idx) => (
          <div key={block.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 0", borderBottom: idx < blocks.length - 1 ? "1px solid #f0f0f0" : "none" }}>
            {/* Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 4, minWidth: 22 }}>
              <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={idx === 0}
                style={{ fontSize: 10, padding: "1px 4px", border: "1px solid #e5e7eb", borderRadius: 4, cursor: "pointer", background: "#fafafa", color: "#999", lineHeight: 1.2 }}>↑</button>
              <button type="button" onClick={() => moveBlock(block.id, 1)} disabled={idx === blocks.length - 1}
                style={{ fontSize: 10, padding: "1px 4px", border: "1px solid #e5e7eb", borderRadius: 4, cursor: "pointer", background: "#fafafa", color: "#999", lineHeight: 1.2 }}>↓</button>
              <button type="button" onClick={() => removeBlock(block.id)}
                style={{ fontSize: 10, padding: "1px 4px", border: "1px solid #fecaca", borderRadius: 4, cursor: "pointer", background: "#fff0f0", color: "#ef4444", lineHeight: 1.2 }}>×</button>
            </div>

            {/* Block type label */}
            <div style={{ fontSize: 9, fontWeight: 700, color: "#B8923A", letterSpacing: "0.05em", textTransform: "uppercase", paddingTop: 8, minWidth: 28, textAlign: "center" }}>
              {BLOCK_LABELS.find(b => b.type === block.type)?.icon ?? "¶"}
            </div>

            {/* Block content */}
            <div style={{ flex: 1 }}>
              {block.type === "divider" ? (
                <div style={{ borderTop: "2px solid #e5e7eb", margin: "8px 0", width: "100%" }} />
              ) : block.type === "image" ? (
                <ImageBlock block={block} onChange={(patch) => updateBlock(block.id, patch as Partial<Block>)} uploadFn={uploadFn} />
              ) : block.type === "bullets" ? (
                <BulletsBlock block={block} onChange={(items) => updateBlock(block.id, { items })} />
              ) : block.type === "callout" ? (
                <div style={{ background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 8, padding: "10px 12px" }}>
                  <TextBlock block={block as Extract<Block, { text: string }>}
                    onChange={(text) => updateBlock(block.id, { text })} />
                </div>
              ) : (
                <TextBlock block={block as Extract<Block, { text: string }>}
                  onChange={(text) => updateBlock(block.id, { text })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addBlock("paragraph", block.id);
                    }
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helpers for serialising / deserialising ──────────────────────────────────

export function blocksToJson(blocks: Block[]): string {
  // strip File objects before serialising
  return JSON.stringify(blocks.map(b => {
    if (b.type === "image") { const { file: _f, ...rest } = b; return rest; }
    return b;
  }));
}

export function jsonToBlocks(json: string | null | undefined): Block[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed as Block[];
  } catch { /* */ }
  // Legacy plain text — wrap in one paragraph block
  if (typeof json === "string" && json.trim()) {
    return [{ id: uid(), type: "paragraph", text: json }];
  }
  return [];
}
