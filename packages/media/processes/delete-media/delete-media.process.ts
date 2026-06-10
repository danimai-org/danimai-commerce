import {
  DANIMAI_CONFIG,
  InjectDB,
  InjectS3,
  NotFoundError,
  Process,
  ValidationError,
} from "@danimai/core";
import { DeleteObjectsCommand, type S3Client } from "@aws-sdk/client-s3";
import { inject } from "inversify";
import { Kysely } from "kysely";
import { join } from "node:path";
import { unlink } from "node:fs/promises";
import type { DeleteMediaProcessInput } from "./delete-media.schema";
import type { Database } from "../../db";

type MediaRuntimeConfig = {
  media?: {
    storage: "s3" | "local";
    localUploadDir?: string;
  };
};

export const DELETE_MEDIA_PROCESS = Symbol("DeleteMedia");

@Process(DELETE_MEDIA_PROCESS)
export class DeleteMediaProcess {
  constructor(
    @InjectDB() private readonly db: Kysely<Database>,
    @InjectS3() private readonly s3: S3Client,
    @inject(DANIMAI_CONFIG) private readonly config: MediaRuntimeConfig,
  ) { }

  /**
   * Deletes media objects from S3 and removes their DB records.
   * Input: media ids.
   * Output: void.
   */
  async runOperations(context: { input: DeleteMediaProcessInput }): Promise<void> {
    const ids = [...new Set(context.input.ids)];
    let query = this.db
      .selectFrom("media_files")
      .where("id", "in", ids)
      .selectAll();
    if (context.input.owner_type) {
      query = query.where("owner_type", "=", context.input.owner_type);
    }
    if (context.input.owner_id) {
      query = query.where("owner_id", "=", context.input.owner_id);
    }
    const mediaRows = await query.execute();

    if (mediaRows.length === 0) {
      throw new NotFoundError("Media not found");
    }

    const localRows = mediaRows.filter((row) => row.provider === "local");
    const s3Rows = mediaRows.filter((row) => row.provider !== "local");

    if (localRows.length > 0) {
      const uploadDir = this.config.media?.localUploadDir;
      if (!uploadDir) {
        throw new ValidationError("Local media storage is not configured", [{
          type: "invalid",
          message: "Missing local upload directory",
          path: "media",
        }]);
      }
      for (const row of localRows) {
        await unlink(join(uploadDir, row.object_key)).catch(() => undefined);
      }
    }

    const rowsByBucket = s3Rows.reduce<Record<string, typeof s3Rows>>((acc, row) => {
      const bucketRows = acc[row.bucket] ?? [];
      bucketRows.push(row);
      acc[row.bucket] = bucketRows;
      return acc;
    }, {});

    for (const [bucket, rows] of Object.entries(rowsByBucket)) {
      const deletionResult = await this.s3.send(new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: rows.map((row) => ({ Key: row.object_key })),
          Quiet: false,
        },
      }));

      if (deletionResult.Errors && deletionResult.Errors.length > 0) {
        throw new ValidationError("Failed to delete media from S3", deletionResult.Errors.map((error) => ({
          type: "invalid",
          message: error.Message ?? "S3 delete failure",
          path: error.Key ?? "ids",
        })));
      }
    }

    await this.db
      .deleteFrom("media_files")
      .where("id", "in", mediaRows.map((media) => media.id))
      .execute();
  }
}
