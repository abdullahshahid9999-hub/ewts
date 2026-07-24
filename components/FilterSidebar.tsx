"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export type FilterGroup = {
  key: string; // query param name
  label: string;
  options: string[];
};

function useAutoApplyFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(key)?.split(",").filter(Boolean) ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    if (next.length > 0) params.set(key, next.join(","));
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function toggleBoolean(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === "1") params.delete(key);
    else params.set(key, "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearAll(preserveKeys: string[] = ["q"]) {
    const params = new URLSearchParams();
    preserveKeys.forEach((k) => {
      const v = searchParams.get(k);
      if (v) params.set(k, v);
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return { searchParams, toggle, toggleBoolean, clearAll };
}

function CheckboxGroup({ group, selected, onToggle }: { group: FilterGroup; selected: string[]; onToggle: (v: string) => void }) {
  if (group.options.length === 0) return null;
  return (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-wide mb-3 text-navy/70">{group.label}</p>
      <div className="flex flex-col gap-2.5">
        {group.options.map((opt) => (
          <label key={opt} className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="w-4 h-4 rounded accent-gold"
            />
            <span className={selected.includes(opt) ? "font-semibold" : ""}>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function FilterSidebar({
  groups,
  showDirectToggle,
}: {
  groups: FilterGroup[];
  showDirectToggle?: boolean;
}) {
  const { searchParams, toggle, toggleBoolean, clearAll } = useAutoApplyFilters();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCount =
    groups.reduce((sum, g) => sum + (searchParams.get(g.key)?.split(",").filter(Boolean).length ?? 0), 0) +
    (showDirectToggle && searchParams.get("direct") === "1" ? 1 : 0);

  const body = (
    <>
      {groups.map((g) => (
        <CheckboxGroup
          key={g.key}
          group={g}
          selected={searchParams.get(g.key)?.split(",").filter(Boolean) ?? []}
          onToggle={(v) => toggle(g.key, v)}
        />
      ))}
      {showDirectToggle && (
        <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none mb-2">
          <input type="checkbox" checked={searchParams.get("direct") === "1"} onChange={() => toggleBoolean("direct")} className="w-4 h-4 rounded accent-gold" />
          <span className={searchParams.get("direct") === "1" ? "font-semibold" : ""}>Direct flights only</span>
        </label>
      )}
      {activeCount > 0 && (
        <button onClick={() => clearAll()} className="text-xs font-semibold text-gold hover:underline mt-2">
          Clear all filters
        </button>
      )}
    </>
  );

  return (
    <>
      {/* Desktop — sticky left column */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 bg-white border border-border rounded-2xl p-5">
          <p className="font-display text-lg font-semibold mb-4">Filters</p>
          {body}
        </div>
      </aside>

      {/* Mobile — trigger button + slide-in drawer */}
      <div className="lg:hidden mb-5">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold bg-white"
        >
          ⚙️ Filters {activeCount > 0 && <span className="bg-gold text-black rounded-full text-xs w-5 h-5 flex items-center justify-center">{activeCount}</span>}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="relative w-80 max-w-[85vw] bg-white h-full overflow-y-auto p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <p className="font-display text-lg font-semibold">Filters</p>
                <button onClick={() => setMobileOpen(false)} className="text-2xl leading-none" aria-label="Close">×</button>
              </div>
              {body}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
