import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = "ENCRYPTION_KEY" in process.env ? process.env.ENCRYPTION_KEY : "default_encryption_key";
if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY não definida nas variáveis de ambiente.");

const encryptData = <T>(data: T): string => {
  const json = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(json, ENCRYPTION_KEY).toString();
  return encrypted;
};

const decryptData = <T>(encryptedData: string): T | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) return null;

    return JSON.parse(decrypted) as T;
  } catch (err) {
    console.error("Falha ao descriptografar:", err);
    return null;
  }
};

export { encryptData, decryptData };
