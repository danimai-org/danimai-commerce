import {
  InjectDB,
  InjectS3,
  NotFoundError,
  Process,
  ValidationError,
} from "@danimai/core";
import { DeleteObjectsCommand, type S3Client } from "@aws-sdk/client-s3";
import { Kysely } from "kysely";
import type { DeleteMediaProcessInput } from "./delete-media.schema";
import type { Database } from "../../db";

export const DELETE_MEDIA_PROCESS = Symbol("DeleteMedia");

@Process(DELETE_MEDIA_PROCESS)
export class DeleteMediaProcess {
  constructor(
    @InjectDB() private readonly db: Kysely<Database>,
    @InjectS3() private readonly s3: S3Client,
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

    const rowsByBucket = mediaRows.reduce<Record<string, typeof mediaRows>>((acc, row) => {
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
