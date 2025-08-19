import { encryptData, decryptData } from "../cryptojsController";

process.env.ENCRYPTION_KEY = "encryption_key_test";

describe("Encrypt e Decrypt Controller", () => {
    it("Deve criptografar e descriptografar um objeto corretamente", () => {
        const original = { id: 1, name: "Luka" };

        const encrypted = encryptData(original);
        expect(typeof encrypted).toBe("string");
        expect(encrypted).not.toBe(JSON.stringify(original));

        const decrypted = decryptData<typeof original>(encrypted);
        expect(decrypted).toEqual(original);
    });

    it("Deve criptografar e descriptografar uma string corretamente", () => {
        const original = "Teste de string";

        const encrypted = encryptData(original);
        expect(typeof encrypted).toBe("string");
        expect(encrypted).not.toBe(original);

        const decrypted = decryptData<string>(encrypted);
        expect(decrypted).toBe(original);
    });

    it("Lida com erro se ENCRYPTION_KEY não estiver definida (Criptografar)", () => {
        const oldKey = process.env.ENCRYPTION_KEY;
        delete process.env.ENCRYPTION_KEY;
        expect(() => encryptData("test")).toThrow(/ENCRYPTION_KEY|chave/i);
        process.env.ENCRYPTION_KEY = oldKey;
    });

    it("Lida com erro se ENCRYPTION_KEY não estiver definida (Descriptografar)", () => {
        const oldKey = process.env.ENCRYPTION_KEY;
        delete process.env.ENCRYPTION_KEY;
        expect(() => decryptData("qualquer")).toThrow(/ENCRYPTION_KEY|chave/i);
        process.env.ENCRYPTION_KEY = oldKey;
    });

    it("Lida com erro ao descriptografar string inválida", () => {
        expect(() => decryptData("string_invalida")).toThrow();
    });

    it("Lida com erro ao descriptografar dado corrompido", () => {
        const original = "corrompido";
        const encrypted = encryptData(original);
        const broken = encrypted.slice(0, -5) + "xxxxx";
        expect(() => decryptData(broken)).toThrow();
    });
});
