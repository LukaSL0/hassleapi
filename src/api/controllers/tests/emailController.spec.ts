const sendMailMock = jest.fn();
const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

process.env.MAIL_USER = "testemail@example.com";
process.env.MAIL_PASS = "testpassword";

jest.mock("nodemailer", () => ({
    __esModule: true,
    createTransport: createTransportMock,
    default: { createTransport: createTransportMock },
}));

import { sendConfirmationEmail, sendResetPasswordEmail } from "../emailController";

describe("Email Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        sendMailMock.mockReset();
    });

    it("Envia e-mail de confirmação com conteúdo correto", async () => {
        await sendConfirmationEmail("Luka", "user@example.com", "CONFIRM123");
        const args = sendMailMock.mock.calls[0][0];
        expect(args.to).toBe("user@example.com");
        expect(args.subject).toBe("[Hassle] Verificação de conta");
        expect(args.html).toContain("CONFIRM123");
    });

    it("Envia e-mail de redefinição com conteúdo correto", async () => {
        await sendResetPasswordEmail("Luka", "user@example.com", "RESET123");
        const args = sendMailMock.mock.calls[0][0];
        expect(args.subject).toBe("[Hassle] Redefinição de senha");
        expect(args.html).toContain("RESET123");
    });

    it("Lida com erro ao enviar e-mail de confirmação", async () => {
        sendMailMock.mockImplementationOnce(() => { throw new Error("Falha no envio do e-mail de confirmação"); });
        await expect(sendConfirmationEmail("Luka", "user@example.com", "ERR123")).rejects.toThrow("Falha no envio de e-mail.");
    });

    it("Lida com erro ao enviar e-mail de redefinição", async () => {
        sendMailMock.mockImplementationOnce(() => { throw new Error("Falha no envio do e-mail de redefinição"); });
        await expect(sendResetPasswordEmail("Luka", "user@example.com", "ERR123")).rejects.toThrow("Falha no envio de e-mail.");
    });

    it("Não executa `sendMail` se e-mail for inválido (Confirmação)", async () => {
        await expect(sendConfirmationEmail("Luka", "", "INVALIDEMAIL")).resolves.toBeUndefined();
        expect(sendMailMock).not.toHaveBeenCalled();
    });

    it("Não executa `sendMail` se e-mail for inválido (Redefinição)", async () => {
        await expect(sendResetPasswordEmail("Luka", "", "INVALIDEMAIL")).resolves.toBeUndefined();
        expect(sendMailMock).not.toHaveBeenCalled();
    });
});