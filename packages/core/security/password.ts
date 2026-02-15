export class Password {
    constructor(private readonly algorithm: Bun.Password.AlgorithmLabel = "bcrypt", private readonly cost: number = 10) {
    }

    async hash(password: string): Promise<string> {
        return Bun.password.hash(password, { algorithm: this.algorithm, cost: this.cost });
    }

    async verify(password: string, hash: string): Promise<boolean> {
        return Bun.password.verify(password, hash);
    }
}