export default function TrustpilotBadge({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://www.trustpilot.com/review/eastwestpk.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <span className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="w-5 h-5 bg-[#00b67a] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
              <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.9l-6.18 3.12L7 13.14 2 8.27l6.91-1.01z" />
            </svg>
          </span>
        ))}
        {/* 5th star: half green / half grey, matching a 4.5 rating */}
        <span className="relative w-5 h-5 bg-[#dcdce6] overflow-hidden flex items-center justify-center">
          <span className="absolute inset-0 w-1/2 bg-[#00b67a]" />
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white relative z-10">
            <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.9l-6.18 3.12L7 13.14 2 8.27l6.91-1.01z" />
          </svg>
        </span>
      </span>
      <span className="flex items-center gap-1 font-bold text-[15px]" style={{ color: "#191919" }}>
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#00b67a]">
          <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.9l-6.18 3.12L7 13.14 2 8.27l6.91-1.01z" />
        </svg>
        Trustpilot
      </span>
    </a>
  );
}
