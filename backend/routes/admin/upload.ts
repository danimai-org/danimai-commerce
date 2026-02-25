import { Elysia } from "elysia";
import { join } from "path";
import { mkdir, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";

const UPLOAD_DIR = join(import.meta.dir, "..", "..", "uploads");
const API_BASE = process.env.API_BASE_URL || "http://localhost:8000";

function imageContentType(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

// Serve uploaded files
const uploadsStatic = new Elysia()
  .get(
    "/uploads/:name",
    async ({ params, set }) => {
      const filePath = join(UPLOAD_DIR, params.name);
      if (!existsSync(filePath)) {
        set.status = 404;
        return "Not found";
      }
      const buffer = await readFile(filePath);
      const type = imageContentType(params.name);
      return new Response(buffer, {
        headers: { "Content-Type": type },
      });
    },
    { detail: { tags: ["Upload"] } }
  );

export const uploadRoutes = new Elysia()
  .use(uploadsStatic)
  .use(new Elysia({ prefix: "/upload" })
  .onError(({ error, set }) => {
    set.status = 500;
    return { error: error instanceof Error ? error.message : "Upload failed" };
  })
  .post(
    "/",
    async ({ request, set }) => {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        set.status = 400;
        return { error: "Missing file" };
      }
      if (!file.type.startsWith("image/")) {
        set.status = 400;
        return { error: "File must be an image" };
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
      const dir = UPLOAD_DIR;
      await mkdir(dir, { recursive: true });
      const filePath = join(dir, name);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      const url = `${API_BASE.replace(/\/$/, "")}/uploads/${name}`;
      return { url };
    },
    {
      detail: {
        tags: ["Upload"],
        summary: "Upload image",
        description: "Upload an image file; returns a public URL for the stored file.",
      },
    }
  ));
