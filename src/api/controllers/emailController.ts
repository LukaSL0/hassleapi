import nodemailer, { Transporter } from "nodemailer";

let cachedTransport: Transporter | null = null;

const getTransport = (): Transporter => {
    if (cachedTransport) return cachedTransport;

    const { MAIL_USER, MAIL_PASS } = process.env;
    if (!MAIL_USER || !MAIL_PASS) throw new Error("Erro nos dados do e-mail.");

    cachedTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: { user: MAIL_USER, pass: MAIL_PASS },
    });

    return cachedTransport;
}

const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
    try {
        await getTransport().sendMail({ from: process.env.MAIL_USER, to, subject, html });
    } catch {
        throw new Error("Falha no envio de e-mail.");
    }
};

export const sendConfirmationEmail = async (name: string, email: string, confirmationCode: string): Promise<void> => {
    if (!email) return;
    const html = `
        <h1>Olá, ${name}!</h1>
        <p>Confirme seu e-mail clicando no link abaixo:</p>
        <a href='https://Censored/register/confirm?v=${confirmationCode}'>Confirmar conta</a>
    `;
    await sendEmail(email, "[Hassle] Verificação de conta", html);
};

export const sendResetPasswordEmail = async (name: string, email: string, resetToken: string): Promise<void> => {
    if (!email) return;
    const html = `
        <h1>Olá, ${name}!</h1>
        <p>Redefina sua senha clicando no link abaixo (expira em 24h):</p>
        <a href='https://Censored/resetpassword/reset?v=${resetToken}'>Redefinir senha</a>
    `;
    await sendEmail(email, "[Hassle] Redefinição de senha", html);
};