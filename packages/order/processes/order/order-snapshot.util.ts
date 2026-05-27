type RecordMeta = Record<string, unknown>;

export type ParsedAddressNames = {
  firstName: string;
  lastName: string;
};

export type LineItemSnapshot = {
  productTitle: string | null;
  variantTitle: string | null;
  variantSku: string | null;
  variantOptionValues: unknown | null;
  productHandle: string | null;
};

export function asRecord(value: unknown): RecordMeta | null {
  if (typeof value !== "object" || value === null) return null;
  return value as RecordMeta;
}

export function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Names may live on cart address metadata from checkout. */
export function parseAddressNames(metadata: unknown): ParsedAddressNames {
  const meta = asRecord(metadata);
  const first =
    readString(meta?.first_name) ??
    readString(meta?.firstName) ??
    readString(meta?.first);
  const last =
    readString(meta?.last_name) ??
    readString(meta?.lastName) ??
    readString(meta?.last);

  if (first || last) {
    return {
      firstName: first ?? "-",
      lastName: last ?? "-",
    };
  }

  const full = readString(meta?.full_name) ?? readString(meta?.name);
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: "-" };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" "),
    };
  }

  return { firstName: "-", lastName: "-" };
}

export function formatAddressLines(addr: {
  first_name: string;
  last_name: string;
  company?: string | null;
  address_1: string;
  address_2?: string | null;
  city: string;
  province?: string | null;
  postal_code?: string | null;
  country_code: string;
  phone?: string | null;
}): string[] {
  const name = `${addr.first_name} ${addr.last_name}`.trim();
  const lines = [
    name || "—",
    addr.address_1 || "—",
    ...(addr.address_2 ? [addr.address_2] : []),
    [addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ") ||
      "—",
    addr.country_code || "—",
  ];
  if (addr.phone) lines.push(addr.phone);
  return lines;
}

export function snapshotFromCartLineItem(li: {
  title?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  metadata?: unknown | null;
}): LineItemSnapshot {
  const meta = asRecord(li.metadata);
  const optionValues =
    meta?.variant_option_values ??
    meta?.option_values ??
    meta?.selectedOptions ??
    null;

  const variantTitle =
    readString(meta?.variant_title) ??
    readString(li.description) ??
    null;

  return {
    productTitle: readString(li.title),
    variantTitle,
    variantSku: readString(meta?.sku) ?? readString(meta?.variant_sku),
    variantOptionValues: optionValues,
    productHandle: readString(meta?.product_handle),
  };
}

export function variantLabelFromSnapshot(snapshot: LineItemSnapshot): string {
  const options = snapshot.variantOptionValues;
  if (Array.isArray(options) && options.length > 0) {
    const parts = options
      .map((entry) => {
        const row = asRecord(entry);
        if (!row) return null;
        const title = readString(row.title);
        const value = readString(row.value);
        if (title && value) return `${title}: ${value}`;
        return value ?? title;
      })
      .filter((value): value is string => Boolean(value));
    if (parts.length > 0) return parts.join(" / ");
  }

  return snapshot.variantTitle ?? "";
}
