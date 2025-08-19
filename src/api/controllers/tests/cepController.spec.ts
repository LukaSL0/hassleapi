
import axios from "axios";
import { cepHandler } from "../cepController";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("CEP Controller", () => {
    it("Deve retornar um endereço válido quando o CEP existir", async () => {
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                cep: "01001-000",
                logradouro: "Praça da Sé",
                bairro: "Sé",
                localidade: "São Paulo",
                uf: "SP",
            },
        });

        const result = await cepHandler("01001000");

        expect(result).toEqual({
            cep: "01001-000",
            estado: "São Paulo",
            cidade: "São Paulo",
            bairro: "Sé",
            rua: "Praça da Sé",
        });
    });

    it("Lida com erro se o CEP for malformado (Menos de 8 dígitos)", async () => {
        const result = await cepHandler("12345");
        expect(result).toBeNull();
    });

    it("Lida com erro se o CEP não for encontrado", async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: null });
        const result = await cepHandler("99999999");
        expect(result).toBeNull();
    });

    it("Lida com erro se houver um problema de conexão com o site (ViaCEP)", async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));
        const result = await cepHandler("01001000");
        expect(result).toBeNull();
    });
});