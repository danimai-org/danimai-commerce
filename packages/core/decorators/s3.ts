import { inject } from "inversify";
import { DANIMAI_S3 } from "../injection-keys";

/**
 * Purpose: Injects the shared AWS S3 client into process constructors.
 * Target: parameter
 * Arguments: none
 * Runtime behavior: resolves the `DANIMAI_S3` binding from inversify during class instantiation.
 * Side effects: constructor parameter receives IoC-managed S3 client instance.
 * Example: `constructor(@InjectS3() private readonly s3: S3Client) {}`
 */
export const InjectS3 = () => inject(DANIMAI_S3);
