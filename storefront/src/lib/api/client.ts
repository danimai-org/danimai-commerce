import { getClient } from "@danimai/backend";

const base =
  typeof import.meta.env.VITE_PUBLIC_API_URL === "string" &&
  import.meta.env.VITE_PUBLIC_API_URL
    ? import.meta.env.VITE_PUBLIC_API_URL
    : "http://localhost:8000";

export const client = getClient(base);
