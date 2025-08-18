import { encryptData, decryptData } from "../cryptojsController.js";

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
});
