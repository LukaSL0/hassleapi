import axios from "axios";
import { cepHandler } from "../cepController.js";

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
});