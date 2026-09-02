"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type FilterGroup = {
  key: string;
  label: string;
  options: string[];
};

function useFilterActions() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function applyParams(params: URLSearchParams) {
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(key)?.split(",").filter(Boolean) ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (next.length > 0) params.set(key, next.join(","));
    else params.delete(key);
    applyParams(params);
  }

  function toggleBoolean(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === "1") params.delete(key);
    else params.set(key, "1");
    applyParams(params);
  }

  function clearAll(preserveKeys: string[] = ["q"]) {
    const params = new URLSearchParams();
    preserveKeys.forEach((k) => {
      const v = searchParams.get(k);
      if (v) params.set(k, v);
    });
    applyParams(params);
  }

  function applyDraft(draft: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    // Clear all filter keys first
    const allKeys = Object.keys(draft);
    allKeys.forEach((k) => params.delete(k));
    // Apply draft values
    Object.entries(draft).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    applyParams(params);
  }

  return { searchParams, toggle, toggleBoolean, clearAll, applyDraft };
}

function CheckboxGroup({
  group,
  selected,
  onToggle,
}: {
  group: FilterGroup;
  selected: string[];
  onToggle: (v: string) => void;
}) {
  if (group.options.length === 0) return null;
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 text-[var(--lp-muted)]">
        {group.label}
      </p>
      <div className="flex flex-col gap-2">
        {group.options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2.5 text-sm cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="w-4 h-4 rounded accent-[var(--lp-brass)]"
            />
            <span className={selected.includes(opt) ? "font-semibold" : "text-gray-700"}>
              {opt}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function FilterSidebar({
  groups,
  booleanToggle,
}: {
  groups: FilterGroup[];
  booleanToggle?: { key: string; label: string };
}) {
  const { searchParams, toggle, toggleBoolean, clearAll, applyDraft } =
    useFilterActions();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Draft state for mobile — starts as clone of current SP
  const buildDraft = useCallback(() => {
    const d: Record<string, string> = {};
    groups.forEach((g) => {
      const v = searchParams.get(g.key);
      if (v) d[g.key] = v;
    });
    if (booleanToggle) {
      const v = searchParams.get(booleanToggle.key);
      if (v) d[booleanToggle.key] = v;
    }
    return d;
  }, [searchParams, groups, booleanToggle]);

  const [draft, setDraft] = useState<Record<string, string>>({});

  function openMobile() {
    setDraft(buildDraft());
    setMobileOpen(true);
  }

  function draftToggle(key: string, value: string) {
    setDraft((prev) => {
      const current = prev[key]?.split(",").filter(Boolean) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const updated = { ...prev };
      if (next.length > 0) updated[key] = next.join(",");
      else delete updated[key];
      return updated;
    });
  }

  function draftToggleBoolean(key: string) {
    setDraft((prev) => {
      const updated = { ...prev };
      if (updated[key] === "1") delete updated[key];
      else updated[key] = "1";
      return updated;
    });
  }

  function applyAndClose() {
    // Build full keys list to clear + re-apply
    const allKeys = [
      ...groups.map((g) => g.key),
      ...(booleanToggle ? [booleanToggle.key] : []),
    ];
    const fullDraft: Record<string, string> = {};
    allKeys.forEach((k) => {
      if (draft[k]) fullDraft[k] = draft[k];
    });
    applyDraft(fullDraft);
    setMobileOpen(false);
  }

  function clearDraft() {
    setDraft({});
  }

  const activeCount =
    groups.reduce(
      (sum, g) =>
        sum + (searchParams.get(g.key)?.split(",").filter(Boolean).length ?? 0),
      0
    ) + (booleanToggle && searchParams.get(booleanToggle.key) === "1" ? 1 : 0);

  // Desktop body — auto-applies on each change
  const desktopBody = (
    <>
      {groups.map((g) => (
        <CheckboxGroup
          key={g.key}
          group={g}
          selected={searchParams.get(g.key)?.split(",").filter(Boolean) ?? []}
          onToggle={(v) => toggle(g.key, v)}
        />
      ))}
      {booleanToggle && (
        <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none mb-2">
          <input
            type="checkbox"
            checked={searchParams.get(booleanToggle.key) === "1"}
            onChange={() => toggleBoolean(booleanToggle.key)}
            className="w-4 h-4 rounded accent-[var(--lp-brass)]"
          />
          <span
            className={
              searchParams.get(booleanToggle.key) === "1" ? "font-semibold" : ""
            }
          >
            {booleanToggle.label}
          </span>
        </label>
      )}
      {activeCount > 0 && (
        <button
          onClick={() => clearAll()}
          className="text-xs font-semibold text-[var(--lp-brass)] hover:underline mt-2"
        >
          Clear all filters
        </button>
      )}
    </>
  );

  // Mobile draft body — only applies on "Update Now"
  const draftActiveCount =
    groups.reduce(
      (sum, g) =>
        sum + (draft[g.key]?.split(",").filter(Boolean).length ?? 0),
      0
    ) + (booleanToggle && draft[booleanToggle.key] === "1" ? 1 : 0);

  const mobileBody = (
    <>
      {groups.map((g) => (
        <CheckboxGroup
          key={g.key}
          group={g}
          selected={draft[g.key]?.split(",").filter(Boolean) ?? []}
          onToggle={(v) => draftToggle(g.key, v)}
        />
      ))}
      {booleanToggle && (
        <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none mb-2">
          <input
            type="checkbox"
            checked={draft[booleanToggle.key] === "1"}
            onChange={() => draftToggleBoolean(booleanToggle.key)}
            className="w-4 h-4 rounded accent-[var(--lp-brass)]"
          />
          <span
            className={draft[booleanToggle.key] === "1" ? "font-semibold" : ""}
          >
            {booleanToggle.label}
          </span>
        </label>
      )}
    </>
  );

  return (
    <>
      {/* ── Desktop — sticky left column ── */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-24 bg-white border border-[var(--lp-border)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-base font-semibold">Filters</p>
            {activeCount > 0 && (
              <span className="bg-[var(--lp-brass)] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          {desktopBody}
        </div>
      </aside>

      {/* ── Mobile trigger button ── */}
      <div className="lg:hidden">
        <button
          onClick={openMobile}
          className="flex items-center gap-2 border border-[var(--lp-border)] rounded-xl px-4 py-2 text-sm font-semibold bg-white shadow-sm"
        >
          <span className="text-base">⚙️</span>
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="bg-[var(--lp-brass)] text-black rounded-full text-[10px] font-bold w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile full-screen filter popup ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lp-border)] shrink-0">
            <p className="font-display text-lg font-bold">Filter Packages</p>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-xl leading-none transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {draftActiveCount > 0 && (
              <button
                onClick={clearDraft}
                className="text-xs font-semibold text-[var(--lp-brass)] hover:underline mb-4 block"
              >
                Clear all filters
              </button>
            )}
            {mobileBody}
          </div>

          {/* Footer — Update Now */}
          <div className="shrink-0 px-5 py-4 border-t border-[var(--lp-border)] bg-white">
            <button
              onClick={applyAndClose}
              className="w-full bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] text-black font-bold py-3.5 rounded-xl text-sm transition-colors"
            >
              {draftActiveCount > 0
                ? `Update Now · ${draftActiveCount} filter${draftActiveCount > 1 ? "s" : ""} active`
                : "Update Now"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
