import {
  InjectDB,
  InjectS3,
  Process,
  ValidationError,
  DANIMAI_CONFIG,
} from "@danimai/core";
import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { inject } from "inversify";
import { Kysely } from "kysely";
import { randomUUID } from "crypto";
import { UploadMediaSchema, type UploadMediaProcessOutput } from "./upload-media.schema";
import type { Database } from "../../db";
import type { UploadMediaProcessInput } from "./upload-media.schema";

export const UPLOAD_MEDIA_PROCESS = Symbol("UploadMedia");

type MediaAwsConfig = {
  s3Bucket: string;
  region: string;
  mediaCloudfrontUrl?: string;
};

type MediaRuntimeConfig = {
  aws?: MediaAwsConfig;
};

@Process(UPLOAD_MEDIA_PROCESS)
export class UploadMediaProcess {
  constructor(
    @InjectDB() private readonly db: Kysely<Database>,
    @InjectS3() private readonly s3: S3Client,
    @inject(DANIMAI_CONFIG) private readonly config: MediaRuntimeConfig,
  ) { }

  /**
   * Uploads an incoming file to S3 and persists full media metadata in DB.
   * Input: file plus classification/ownership metadata.
   * Output: created media record.
   */
  async runOperations(context: { input: UploadMediaProcessInput }): Promise<UploadMediaProcessOutput> {
    const input = context.input;
    const bucket = this.config.aws?.s3Bucket;
    const region = this.config.aws?.region;
    if (!bucket || !region) {
      throw new ValidationError("AWS S3 is not configured", [{
        type: "invalid",
        message: "Missing AWS S3 configuration",
        path: "aws",
      }]);
    }

    const files = Array.isArray(input.file) ? input.file : [input.file];
    if (files.length === 0 || files.some((file) => !(file instanceof File))) {
      throw new ValidationError("Invalid file input", [{
        type: "invalid",
        message: "file must be a multipart file or array of files",
        path: "file",
      }]);
    }
    const cloudfrontBaseUrl = this.config.aws?.mediaCloudfrontUrl?.trim();
    const uploadedMedia: UploadMediaProcessOutput = [];
    for (const file of files) {
      const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? null : null;
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const objectKey = `${input.type}/${Date.now()}-${randomUUID()}-${safeFileName}`;
      const body = new Uint8Array(await file.arrayBuffer());

      const uploaded = await this.s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: body,
        ContentType: file.type || "application/octet-stream",
      }));

      const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;
      const url = cloudfrontBaseUrl
        ? `${cloudfrontBaseUrl.replace(/\/$/, "")}/${objectKey}`
        : s3Url;
      const media = await this.db
        .insertInto("media_files")
        .values({
          id: randomUUID(),
          provider: "aws_s3",
          bucket,
          region,
          object_key: objectKey,
          url,
          etag: uploaded.ETag ?? null,
          filename: safeFileName,
          original_filename: file.name,
          mime_type: file.type || "application/octet-stream",
          extension,
          size: file.size.toString(),
          checksum: null,
          type: input.type,
          owner_type: input.owner_type ?? null,
          owner_id: input.owner_id ?? null,
          metadata: input.metadata ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      uploadedMedia.push({
        ...media,
        metadata: (media.metadata ?? null) as Record<string, unknown> | null,
      });
    }

    return uploadedMedia;
  }
}
