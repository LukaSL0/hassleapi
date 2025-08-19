import axios from "axios";

const estados = {
    AC: "Acre",
    AL: "Alagoas",
    AP: "Amapá",
    AM: "Amazonas",
    BA: "Bahia",
    CE: "Ceará",
    DF: "Distrito Federal",
    ES: "Espírito Santo",
    GO: "Goiás",
    MA: "Maranhão",
    MT: "Mato Grosso",
    MS: "Mato Grosso do Sul",
    MG: "Minas Gerais",
    PA: "Pará",
    PB: "Paraíba",
    PR: "Paraná",
    PE: "Pernambuco",
    PI: "Piauí",
    RJ: "Rio de Janeiro",
    RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul",
    RO: "Rondônia",
    RR: "Roraima",
    SC: "Santa Catarina",
    SP: "São Paulo",
    SE: "Sergipe",
    TO: "Tocantins",
} as const;

interface ViaCepResponse {
    cep: string;
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: SiglaEstado;
    erro?: boolean;
}

interface Endereco {
    cep: string;
    estado: string;
    cidade: string;
    bairro: string;
    rua: string;
}

type SiglaEstado = keyof typeof estados;
const getNomeEstado = (sigla: SiglaEstado): string => estados[sigla];

export const cepHandler = async (cepSent: string): Promise<Endereco | null> => {
    try {
        const cepLimpo = cepSent.replace(/\D/g, "");

        if (cepLimpo.length !== 8) throw new Error("CEP inválido: deve conter 8 dígitos.");

        const res = await axios.get<ViaCepResponse>(`https://viacep.com.br/ws/${cepLimpo}/json/`);

        if (res.data.erro) throw new Error("CEP não encontrado.");

        const { cep, logradouro, bairro, localidade, uf } = res.data;

        return {
            cep,
            estado: getNomeEstado(uf),
            cidade: localidade,
            bairro,
            rua: logradouro,
        };
    } catch (err) {
        return null;
    }
};