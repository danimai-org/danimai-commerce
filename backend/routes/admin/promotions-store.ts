type Campaign = {
  id: string;
  name: string;
  description: string | null;
  identifier: string;
  start_date: string | null;
  end_date: string | null;
};

type Promotion = {
  id: string;
  code: string;
  method: "Automatic" | "Manual";
  status: "Active" | "Inactive" | "Draft";
  campaign_id: string | null;
};

export const campaignsStore: Campaign[] = [
  {
    id: "1",
    name: "Big Bang sale",
    description: null,
    identifier: "BIGBANG",
    start_date: null,
    end_date: null,
  },
];

export const promotionsStore: Promotion[] = [
  {
    id: "1",
    code: "SUMMER15",
    method: "Automatic",
    status: "Active",
    campaign_id: "1",
  },
];

export function normalizePage(page?: number) {
  return Math.max(1, Number(page ?? 1));
}

export function normalizeLimit(limit?: number) {
  return Math.max(1, Math.min(100, Number(limit ?? 10)));
}

export function paginateRows<T>(rows: T[], page?: number, limit?: number) {
  const currentPage = normalizePage(page);
  const currentLimit = normalizeLimit(limit);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / currentLimit));
  const startIdx = (currentPage - 1) * currentLimit;
  const pagedRows = rows.slice(startIdx, startIdx + currentLimit);

  return {
    rows: pagedRows,
    pagination: {
      total,
      page: currentPage,
      limit: currentLimit,
      total_pages: totalPages,
      has_next_page: currentPage < totalPages,
      has_previous_page: currentPage > 1,
    },
  };
}
