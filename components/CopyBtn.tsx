"use client";

export default function CopyBtn({ href }: { href: string }) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(href)}
      className="text-[10px] font-semibold px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
    >
      📋 Copy
    </button>
  );
}
