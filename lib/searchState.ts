// Central place for the query-param keys used to carry search state
// (pax counts, filters) from the landing search widget through listing
// pages, detail pages, and into booking widgets — so nobody has to
// retype what they already told the search widget. URL params are used
// deliberately (not sessionStorage) since they already work this way for
// booking-form (?packageId=&adults=&children=&infants=) — this extends
// the same convention backward to where that journey starts.

export type PaxParams = { adults?: string; children?: string; infants?: string };

// Builds a query string suffix (e.g. "&adults=2&children=1") from
// whatever pax values are present in a page's searchParams, to append
// onto outgoing links (listing → detail → booking widget).
export function paxQueryString(params: PaxParams): string {
  const parts: string[] = [];
  if (params.adults) parts.push(`adults=${encodeURIComponent(params.adults)}`);
  if (params.children) parts.push(`children=${encodeURIComponent(params.children)}`);
  if (params.infants) parts.push(`infants=${encodeURIComponent(params.infants)}`);
  return parts.length ? parts.join("&") : "";
}

export function parsePax(params: PaxParams) {
  return {
    adults: params.adults ? Math.max(1, parseInt(params.adults, 10) || 1) : 1,
    children: params.children ? Math.max(0, parseInt(params.children, 10) || 0) : 0,
    infants: params.infants ? Math.max(0, parseInt(params.infants, 10) || 0) : 0,
  };
}
