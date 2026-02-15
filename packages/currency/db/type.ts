import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export interface Database {
  currencies: CurrencyTable;
}

// table currencies
export interface CurrencyTable {
  id: Generated<string>;
  code: string; // Three-character ISO code (e.g., "USD", "EUR") - unique
  symbol: string; // Display symbol (e.g., "$", "€")
  symbol_native: string; // Native symbol
  name: string; // Currency name (e.g., "US Dollar", "Euro")
  tax_inclusive_pricing: boolean;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Currency = Selectable<CurrencyTable>;
export type NewCurrency = Insertable<CurrencyTable>;
export type CurrencyUpdate = Updateable<CurrencyTable>;
