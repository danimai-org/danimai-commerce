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
  type UpdateProductVariantImagesProcessInput,
  type UpdateProductVariantImagesProcessOutput,
} from "./update-product-variant-images.schema";

export const UPDATE_PRODUCT_VARIANT_IMAGES_PROCESS = Symbol("UpdateProductVariantImages");

type ProductMediaDatabase = Database & {
  media_files: MediaFileTable;
};

@Process(UPDATE_PRODUCT_VARIANT_IMAGES_PROCESS)
export class UpdateProductVariantImagesProcess {
  constructor(
    @InjectDB() private readonly db: Kysely<Database>,
    @InjectProcess(UPLOAD_MEDIA_PROCESS) private readonly uploadMediaProcess: UploadMediaProcess,
    @InjectProcess(DELETE_MEDIA_PROCESS) private readonly deleteMediaProcess: DeleteMediaProcess,
  ) { }

  /**
   * Syncs product variant images by uploading new files and deleting selected media IDs.
   * Input: variant id with optional files and delete ids.
   * Output: uploaded media list and deleted ids.
   */
  async runOperations(
    context: { input: UpdateProductVariantImagesProcessInput }
  ): Promise<UpdateProductVariantImagesProcessOutput> {
    const { input } = context;
    const mediaDb = this.db as unknown as Kysely<ProductMediaDatabase>;

    const variant = await this.db
      .selectFrom("product_variants")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .select(["id"])
      .executeTakeFirst();
    if (!variant) {
      throw new NotFoundError("Product variant not found");
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

    const deleted_ids = await this.deleteMedia(mediaDb, input.id, deleteIds);
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
    _mediaDb: Kysely<ProductMediaDatabase>,
    _ownerId: string,
    ids: string[]
  ): Promise<string[]> {
    if (ids.length === 0) return [];
    await this.deleteMediaProcess.runOperations({
      input: {
        ids,
        owner_type: "product_variant",
        owner_id: _ownerId,
      },
    });
    return ids;
  }

  private async uploadMedia(
    input: UpdateProductVariantImagesProcessInput,
    files: File[]
  ): Promise<UpdateProductVariantImagesProcessOutput["uploaded"]> {
    if (files.length === 0) {
      return [];
    }
    const uploaded = await this.uploadMediaProcess.runOperations({
      input: {
        file: files,
        type: input.type ?? "variant_image",
        owner_type: "product_variant",
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
