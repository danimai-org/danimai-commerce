import { Elysia } from "elysia";
import { getLogger } from "./logger";

const logger = getLogger();

new Elysia()
  .get("/", "Hello Elysia")
  .get("/user/:id", ({ params: { id } }) => id)
  .post("/form", ({ body }) => body)
  .listen(3000, () => logger.info("Server started on http://localhost:3000"));
