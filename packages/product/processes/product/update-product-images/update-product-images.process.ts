import {
  InjectDB,
  InjectProcess,
  NotFoundError,
  Process,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Database } from "../../../db";
import type { MediaFileTable } from "@danimai/media";
import {
  DELETE_MEDIA_PROCESS,
  type DeleteMediaProcess,
  UPLOAD_MEDIA_PROCESS,
  type UploadMediaProcess,
} from "@danimai/media";
import {
  type UpdateProductImagesProcessInput,
  type UpdateProductImagesProcessOutput,
} from "./update-product-images.schema";

export const UPDATE_PRODUCT_IMAGES_PROCESS = Symbol("UpdateProductImages");

type ProductMediaDatabase = Database & {
  media_files: MediaFileTable;
};

@Process(UPDATE_PRODUCT_IMAGES_PROCESS)
export class UpdateProductImagesProcess {
  constructor(
    @InjectDB() private readonly db: Kysely<Database>,
    @InjectProcess(UPLOAD_MEDIA_PROCESS) private readonly uploadMediaProcess: UploadMediaProcess,
    @InjectProcess(DELETE_MEDIA_PROCESS) private readonly deleteMediaProcess: DeleteMediaProcess,
  ) { }

  /**
   * Syncs product images by uploading new files and deleting selected media IDs.
   * Input: product id with optional files and delete ids.
   * Output: uploaded media list and deleted ids.
   */
  async runOperations(
    context: { input: UpdateProductImagesProcessInput }
  ): Promise<UpdateProductImagesProcessOutput> {
    const { input } = context;
    const mediaDb = this.db as unknown as Kysely<ProductMediaDatabase>;

    const product = await this.db
      .selectFrom("products")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .select(["id"])
      .executeTakeFirst();
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    const files = this.normalizeFiles(input.files);
    const deleteIds = input.delete_ids ?? [];
    if (files.length === 0 && deleteIds.length === 0) {
      throw new ValidationError("No image operation provided", [{
        type: "invalid",
        message: "Provide files or delete_ids",
        path: "",
      }]);
    }

    const deleted_ids = await this.deleteMedia(mediaDb, input.id, deleteIds, "product");
    const uploaded = await this.uploadMedia(input, files);

    return { uploaded, deleted_ids };
  }

  private normalizeFiles(files: unknown): File[] {
    if (!files) return [];
    const normalized = Array.isArray(files) ? files : [files];
    if (normalized.some((file) => !(file instanceof File))) {
      throw new ValidationError("Invalid files", [{
        type: "invalid",
        message: "files must be multipart files",
        path: "files",
      }]);
    }
    return normalized;
  }

  private async deleteMedia(
    mediaDb: Kysely<ProductMediaDatabase>,
    ownerId: string,
    ids: string[],
    ownerType: "product" | "product_variant"
  ): Promise<string[]> {
    if (ids.length === 0) return [];
    const mediaRows = await mediaDb
      .selectFrom("media_files")
      .where("id", "in", ids)
      .where("owner_type", "=", ownerType)
      .where("owner_id", "=", ownerId)
      .where("deleted_at", "is", null)
      .select(["id"])
      .execute();
    const mediaIds = mediaRows.map((row) => row.id);
    if (mediaIds.length > 0) {
      await this.deleteMediaProcess.runOperations({
        input: {
          ids: mediaIds,
          owner_type: ownerType,
          owner_id: ownerId,
        },
      });
    }
    return mediaIds;
  }

  private async uploadMedia(
    input: UpdateProductImagesProcessInput,
    files: File[]
  ): Promise<UpdateProductImagesProcessOutput["uploaded"]> {
    if (files.length === 0) {
      return [];
    }
    const uploaded = await this.uploadMediaProcess.runOperations({
      input: {
        file: files,
        type: input.type ?? "product_image",
        owner_type: "product",
        owner_id: input.id,
        metadata: input.metadata,
      },
    });
    return uploaded.map((media) => ({
      id: media.id,
      url: media.url,
      object_key: media.object_key,
      filename: media.filename,
      mime_type: media.mime_type,
      size: media.size,
      owner_type: media.owner_type,
      owner_id: media.owner_id,
    }));
  }
}
