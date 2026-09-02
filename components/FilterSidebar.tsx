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

  function applyDraft(draft: Record<string, string>, allKeys: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    allKeys.forEach((k) => params.delete(k));
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
    <div className="mb-6">
      <p className="text-[11px] font-bold uppercase tracking-widest mb-3 text-[var(--lp-muted)]">
        {group.label}
      </p>
      <div className="flex flex-col gap-3">
        {group.options.map((opt) => (
          <label key={opt} className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="w-4 h-4 rounded accent-[var(--lp-brass)]"
            />
            <span className={`text-sm ${selected.includes(opt) ? "font-semibold text-[var(--lp-ink)]" : "text-gray-600"}`}>
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
  resultCount,
}: {
  groups: FilterGroup[];
  booleanToggle?: { key: string; label: string };
  resultCount?: number;
}) {
  const { searchParams, toggle, toggleBoolean, clearAll, applyDraft } = useFilterActions();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allFilterKeys = [
    ...groups.map((g) => g.key),
    ...(booleanToggle ? [booleanToggle.key] : []),
  ];

  const buildDraft = useCallback(() => {
    const d: Record<string, string> = {};
    allFilterKeys.forEach((k) => {
      const v = searchParams.get(k);
      if (v) d[k] = v;
    });
    return d;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
    applyDraft(draft, allFilterKeys);
    setMobileOpen(false);
  }

  function clearDraftAndClose() {
    setDraft({});
  }

  const activeCount =
    groups.reduce(
      (sum, g) => sum + (searchParams.get(g.key)?.split(",").filter(Boolean).length ?? 0),
      0
    ) + (booleanToggle && searchParams.get(booleanToggle.key) === "1" ? 1 : 0);

  const draftActiveCount =
    groups.reduce(
      (sum, g) => sum + (draft[g.key]?.split(",").filter(Boolean).length ?? 0),
      0
    ) + (booleanToggle && draft[booleanToggle.key] === "1" ? 1 : 0);

  // Shared filter body (used in both desktop + mobile)
  function FilterBody({
    selectedFn,
    onToggle,
    onToggleBool,
    onClear,
    showClear,
  }: {
    selectedFn: (key: string) => string[];
    onToggle: (key: string, v: string) => void;
    onToggleBool: (key: string) => void;
    onClear: () => void;
    showClear: boolean;
  }) {
    return (
      <>
        {groups.map((g) => (
          <CheckboxGroup
            key={g.key}
            group={g}
            selected={selectedFn(g.key)}
            onToggle={(v) => onToggle(g.key, v)}
          />
        ))}
        {booleanToggle && (
          <label className="flex items-center gap-3 cursor-pointer select-none mb-4">
            <input
              type="checkbox"
              checked={selectedFn(booleanToggle.key).length > 0}
              onChange={() => onToggleBool(booleanToggle.key)}
              className="w-4 h-4 rounded accent-[var(--lp-brass)]"
            />
            <span className="text-sm text-gray-700">{booleanToggle.label}</span>
          </label>
        )}
        {showClear && (
          <button
            onClick={onClear}
            className="text-xs font-semibold text-[var(--lp-brass)] hover:underline"
          >
            Clear all filters
          </button>
        )}
      </>
    );
  }

  return (
    <>
      {/* ── DESKTOP: sticky left sidebar ── */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-24 bg-white border border-[var(--lp-border)] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <p className="font-display text-base font-bold">Filters</p>
            {activeCount > 0 && (
              <span className="bg-[var(--lp-brass)] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          <FilterBody
            selectedFn={(key) => searchParams.get(key)?.split(",").filter(Boolean) ?? []}
            onToggle={toggle}
            onToggleBool={toggleBoolean}
            onClear={() => clearAll()}
            showClear={activeCount > 0}
          />
        </div>
      </aside>

      {/* ── MOBILE: inline top bar (filter btn + result count) ── */}
      <div className="lg:hidden flex items-center justify-between gap-3 mb-4 w-full">
        <button
          onClick={openMobile}
          className="inline-flex items-center gap-2 bg-[var(--lp-ink)] text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm active:scale-95 transition-transform"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="bg-[var(--lp-brass)] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {resultCount != null && (
          <p className="text-sm font-semibold text-[var(--lp-ink)]">
            {resultCount} package{resultCount !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* ── MOBILE: slide-up bottom sheet filter popup ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[999] lg:hidden flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} onClick={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}>
          <div className="bg-white rounded-t-3xl flex flex-col max-h-[88dvh]" style={{ WebkitOverflowScrolling: "touch" }}>
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
              <div>
                <p className="font-display text-lg font-bold leading-tight">Filter Packages</p>
                {draftActiveCount > 0 && (
                  <p className="text-[11px] text-[var(--lp-muted)] mt-0.5">{draftActiveCount} filter{draftActiveCount > 1 ? "s" : ""} selected</p>
                )}
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-base font-medium transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 pb-2">
              {draftActiveCount > 0 && (
                <button
                  onClick={clearDraftAndClose}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 mb-4 flex items-center gap-1"
                >
                  <span>✕</span> Clear all filters
                </button>
              )}
              <FilterBody
                selectedFn={(key) => {
                  if (key === booleanToggle?.key) {
                    return draft[key] === "1" ? ["1"] : [];
                  }
                  return draft[key]?.split(",").filter(Boolean) ?? [];
                }}
                onToggle={draftToggle}
                onToggleBool={draftToggleBoolean}
                onClear={clearDraftAndClose}
                showClear={false}
              />
            </div>

            {/* Footer: Apply button */}
            <div className="shrink-0 px-5 pt-3 pb-6 border-t border-[var(--lp-border)] bg-white">
              <button
                onClick={applyAndClose}
                className="w-full bg-[var(--lp-brass)] hover:bg-[var(--lp-brass-light)] active:scale-[.98] text-black font-bold py-4 rounded-2xl text-sm transition-all"
              >
                {draftActiveCount > 0
                  ? `Show Results · ${draftActiveCount} filter${draftActiveCount > 1 ? "s" : ""} active`
                  : "Show All Packages"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
