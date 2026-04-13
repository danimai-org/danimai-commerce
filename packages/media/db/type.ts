import type { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface Database {
  media_files: MediaFileTable;
}

export interface MediaFileTable {
  id: Generated<string>;
  provider: string;
  bucket: string;
  region: string;
  object_key: string;
  url: string;
  etag: string | null;
  filename: string;
  original_filename: string;
  mime_type: string;
  extension: string | null;
  size: string;
  checksum: string | null;
  type: string;
  owner_type: string | null;
  owner_id: string | null;
  metadata: unknown | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}

export type MediaFile = Selectable<MediaFileTable>;
export type NewMediaFile = Insertable<MediaFileTable>;
export type MediaFileUpdate = Updateable<MediaFileTable>;
