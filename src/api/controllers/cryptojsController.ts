import CryptoJS from "crypto-js";


export function encryptData<T>(data: T): string {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) throw new Error("ENCRYPTION_KEY não definida");
    const json = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(json, key).toString();
    return encrypted;
}


export function decryptData<T>(encrypted: string): T {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) throw new Error("ENCRYPTION_KEY não definida");
    try {
        const bytes = CryptoJS.AES.decrypt(encrypted, key);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) throw new Error("Falha ao descriptografar os dados");
        return JSON.parse(decrypted) as T;
    } catch (err) {
        throw new Error("Falha ao descriptografar os dados");
    }
}
