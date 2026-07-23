import Link from "next/link";

export default function SearchResultsNotice({ q, basePath }: { q?: string; basePath: string }) {
  if (!q) return null;
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 mb-6 text-sm">
      <p className="text-muted">
        Showing results for <strong className="text-text">&quot;{q}&quot;</strong>
      </p>
      <Link href={basePath} className="text-gold font-semibold hover:underline">
        Clear search
      </Link>
    </div>
  );
}
