import Link from "next/link";

type Props = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  pageParam?: string;
  query?: Record<string, string | number | undefined>;
};

function buildHref(
  basePath: string,
  page: number,
  pageParam: string,
  query: Record<string, string | number | undefined>
): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  params.set(pageParam, String(page));
  return `${basePath}?${params.toString()}`;
}

export function PaginationControls({
  basePath,
  currentPage,
  totalPages,
  pageParam = "page",
  query = {}
}: Props) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];
  for (let p = start; p <= end; p += 1) pages.push(p);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <Link
        href={buildHref(basePath, Math.max(1, currentPage - 1), pageParam, query)}
        aria-disabled={currentPage <= 1}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
          currentPage <= 1
            ? "pointer-events-none bg-slate-100 text-slate-300"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        Onceki
      </Link>

      <div className="flex items-center gap-1">
        {pages.map((page) => (
          <Link
            key={page}
            href={buildHref(basePath, page, pageParam, query)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
              page === currentPage
                ? "bg-orange-500 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {page}
          </Link>
        ))}
      </div>

      <Link
        href={buildHref(basePath, Math.min(totalPages, currentPage + 1), pageParam, query)}
        aria-disabled={currentPage >= totalPages}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
          currentPage >= totalPages
            ? "pointer-events-none bg-slate-100 text-slate-300"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        Sonraki
      </Link>
    </nav>
  );
}
