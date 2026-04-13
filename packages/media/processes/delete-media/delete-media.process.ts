import {
  InjectDB,
  InjectS3,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { DeleteObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { Kysely } from "kysely";
import { DeleteMediaSchema } from "./delete-media.schema";
import type { Database } from "../../db";

export const DELETE_MEDIA_PROCESS = Symbol("DeleteMedia");

@Process(DELETE_MEDIA_PROCESS)
export class DeleteMediaProcess
  implements ProcessContract<typeof DeleteMediaSchema, void> {
  constructor(
    @InjectDB() private readonly db: Kysely<Database>,
    @InjectS3() private readonly s3: S3Client,
  ) {}

  /**
   * Deletes a media object from S3 and removes its DB record.
   * Input: media id.
   * Output: void.
   */
  async runOperations(
    @ProcessContext({ schema: DeleteMediaSchema })
    context: ProcessContextType<typeof DeleteMediaSchema>
  ) {
    const media = await this.db
      .selectFrom("media_files")
      .where("id", "=", context.input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!media) {
      throw new NotFoundError("Media not found");
    }

    await this.s3.send(new DeleteObjectCommand({
      Bucket: media.bucket,
      Key: media.object_key,
    }));

    await this.db.deleteFrom("media_files").where("id", "=", media.id).execute();
  }
}
