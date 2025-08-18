const sendMailMock = jest.fn();
const createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));

process.env.MAIL_USER = "testemail@example.com";
process.env.MAIL_PASS = "testpassword";

jest.mock("nodemailer", () => ({
    __esModule: true,
    createTransport: createTransportMock,
    default: { createTransport: createTransportMock },
}));

import { sendConfirmationEmail, sendResetPasswordEmail } from "../emailController.js";

describe("Email Controller", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Envia e-mail de confirmação com conteúdo correto", async () => {
        await sendConfirmationEmail("Luka", "user@example.com", "CONFIRM123");
        const args = sendMailMock.mock.calls[0][0];
        expect(args.to).toBe("user@example.com");
        expect(args.subject).toBe("[Hassle] Verificação de conta");
        expect(args.html).toContain("CONFIRM123");
    });

    it("Envia e-mail de redefinição com conteúdo correto", async () => {
        await sendResetPasswordEmail("Luka", "user@example.com", "RESET999");
        const args = sendMailMock.mock.calls[0][0];
        expect(args.subject).toBe("[Hassle] Redefinição de senha");
        expect(args.html).toContain("RESET999");
    });
});