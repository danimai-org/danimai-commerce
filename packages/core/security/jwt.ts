import { SignJWT, jwtVerify } from "jose";

export class Jwt {
    constructor(
        private readonly secret: string
    ) { }

    async sign(payload: Record<string, unknown>, expiresIn: string): Promise<string> {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime(expiresIn)
            .sign(new TextEncoder().encode(this.secret));
    }

    async verify(token: string): Promise<Record<string, unknown>> {
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(this.secret)
        );
        return payload as Record<string, unknown>;
    }
}