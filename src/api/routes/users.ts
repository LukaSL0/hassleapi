import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Randomstring from "randomstring";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { User } from "../../db/models/userModel.js";
import { sendConfirmationEmail, sendResetPasswordEmail } from "../controllers/emailController.js";
import { AuthRequest, requireAuth, requireAdmin, requireAuthUser } from "../middlewares/authentications.js";

const router = Router();

// Listar usuários (admin)
router.get("/", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const allUsers = await User.find({}).select("name -_id").lean();
    return res.status(200).json({ allUsers });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Registro de usuário
router.post("/register", async (req: Request, res: Response) => {
  const { nameSent, emailSent, passwordSent } = req.body;
  if (!nameSent || !emailSent || !passwordSent) return res.status(400).json({ message: "Campos obrigatórios ausentes." });

  try {
    const nameExists = await User.findOne({ name: nameSent }).lean();
    const emailExists = await User.findOne({ email: emailSent }).lean();
    if (emailExists || nameExists) return res.status(409).json({ message: "E-mail ou usuário já registrado." });

    const confirmationToken = Randomstring.generate(17);
    const hashedPassword = await bcrypt.hash(passwordSent, 10);
    const newUser = new User({
      name: nameSent,
      email: emailSent,
      password: hashedPassword,
      confirmationToken,
      userId: uuidv4(),
      secretKey: speakeasy.generateSecret().base32,
      nextOrderId: Randomstring.generate(6),
    });
    await newUser.save();
    sendConfirmationEmail(nameSent, emailSent, confirmationToken);
    return res.status(201).json({ message: "Usuário registrado, confirmação pendente." });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  const { emailSent, passwordSent, authCode } = req.body;
  try {
    const user = await User.findOne({ email: emailSent });
    if (!user) return res.sendStatus(401);
    const passwordMatches = await bcrypt.compare(passwordSent, user.password);
    if (!passwordMatches) return res.sendStatus(401);
    if (user.status !== "Active") return res.status(403).json({ message: "Account verification pending." });

    if (user.twoFactorAuth === "ON") {
      if (!authCode || authCode === "null") return res.status(400).json({ message: "2FA Code required." });
      if (!user.secretKey) return res.status(500).json({ message: "2FA secret key not set for user." });

      const isVerified = speakeasy.totp.verify({
        secret: user.secretKey,
        encoding: "base32",
        token: authCode,
      });
      if (!isVerified) return res.sendStatus(401);
    }
    const token = jwt.sign(
      { userName: user.name, userId: user.userId },
      process.env.JWT_TOKEN!,
      { expiresIn: "7d" }
    );
    return res.status(200).json({ message: "Logged-in Successfully.", token });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Confirmação de registro
router.put("/register/confirm/:confirmationCode", async (req: Request, res: Response) => {
  const code = req.params.confirmationCode;
  try {
    const user = await User.findOne({ confirmationToken: code }).lean();
    if (!user) return res.status(400).json({ message: "Confirmation Token Not Found." });

    await User.updateOne({ confirmationToken: code }, { status: "Active", $unset: { confirmationToken: "" } });
    return res.status(200).json({ message: "User successfully verified." });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Solicitar reset de senha
router.post("/resetpassword", async (req: Request, res: Response) => {
  const { emailSent } = req.body;
  try {
    const user = await User.findOne({ email: emailSent });
    if (!user) return res.status(400).json({ message: "Invalid e-mail address." });
    if (user.status !== "Active") return res.status(403).json({ message: "User is not verified." });
    if (user.tokenPasswordReset) return res.status(401).json({ message: "User already have a Reset Password Token active." });

    const resetPasswordToken = Randomstring.generate(40);
    user.tokenPasswordReset = resetPasswordToken;
    await user.save();
    sendResetPasswordEmail(user.name, user.email, resetPasswordToken);
    return res.status(200).json({ message: "Successfully sent email." });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Verificar token de reset de senha
router.get("/resetpassword/:resetPasswordToken", async (req: Request, res: Response) => {
  const passwordToken = req.params.resetPasswordToken;
  try {
    const user = await User.findOne({ tokenPasswordReset: passwordToken });
    if (!user) return res.status(400).json({ message: "Password Reset Token not found." });

    user.twoFactorAuth = "OFF";
    await user.save();
    return res.status(200).json({ message: "Password Reset Token found." });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Resetar senha
router.put("/resetpassword/:resetPasswordToken", async (req: Request, res: Response) => {
  const passwordToken = req.params.resetPasswordToken;
  const { newPasswordSent } = req.body;
  try {
    const user = await User.findOne({ tokenPasswordReset: passwordToken });
    if (!user) return res.status(400).json({ message: "Token inválido." });

    const isMatch = await bcrypt.compare(newPasswordSent, user.password);
    if (isMatch) return res.status(409).json({ message: "This is your actual password" });

    const newPasswordHashed = await bcrypt.hash(newPasswordSent, 10);
    user.password = newPasswordHashed;
    user.tokenPasswordReset = undefined;
    await user.save();
    return res.status(200).json({ message: "User password changed successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Trocar senha logado
router.put("/changepassword", requireAuth, async (req: AuthRequest, res: Response) => {
  const { oldPasswordSent, newPasswordSent } = req.body;
  try {
    const user = await User.findOne({ userId: req.user!.userId });
    if (!user) return res.status(404).json({ message: "Usuário não encontrado." });
    const oldIsMatch = await bcrypt.compare(oldPasswordSent, user.password);
    const newIsMatch = await bcrypt.compare(newPasswordSent, user.password);
    if (!oldIsMatch) return res.status(401).json({ message: "A senha é igual a atual." });

    if (newIsMatch) return res.status(400).json({ message: "Está é sua senha atual." });

    user.password = await bcrypt.hash(newPasswordSent, 10);
    await user.save();
    return res.status(200).json({ message: "Senha alterada com sucesso." });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Dados da conta
router.get("/account", requireAuthUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.dbUser!;

    return res.status(200).json({
      message: "Data fetched successfully",
      userData: {
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        createdDate: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// 2FA - QR Code
router.get("/account/2fa", requireAuthUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.dbUser!;
    if (!user.secretKey) return res.status(400).json({ message: "2FA secret key not set for user." });

    const qrCodeURL = `otpauth://totp/hassle:${user.email}?secret=${encodeURIComponent(user.secretKey)}`;
    qrcode.toDataURL(qrCodeURL, (err: Error | null | undefined, imageUrl: string) => {
      if (err) return res.status(500).json({ error: "Internal Server Error", err: err.message });

      return res.status(200).json({
        twoFactorStatus: user.twoFactorAuth,
        secretKey: user.secretKey,
        qrCodeURL: imageUrl,
      });
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// 2FA - Toggle
router.put("/account/toggle-2fa", requireAuthUser, async (req: AuthRequest, res: Response) => {
  const { toggleStatus } = req.body;
  try {
    const user = req.dbUser!;

    user.twoFactorAuth = toggleStatus === "OFF" ? "OFF" : "ON";
    await user.save();
    return res.status(200).json({ message: `2FA Status changed to ${user.twoFactorAuth}` });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// 2FA - Regenerar chave
router.put("/account/regenerate-2fa", requireAuthUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.dbUser!;

    user.secretKey = speakeasy.generateSecret().base32;
    await user.save();
    return res.status(200).json({ message: "2FA Secret Key changed." });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Editar quantidade do item no carrinho
router.put("/cart/edit-amount", requireAuth, async (req: AuthRequest, res: Response) => {
  const { ordem, amountSent } = req.body;
  try {
    await User.findOneAndUpdate(
      { userId: req.user!.userId },
      { $set: { [`cartItems.${ordem}.amount`]: amountSent } }
    );
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Remover item do carrinho
router.delete("/cart/delete-item/:ordem", requireAuthUser, async (req: AuthRequest, res: Response) => {
  const { ordem } = req.params;
  try {
    const user = req.dbUser!;
    if (!Array.isArray(user.cartItems)) return res.status(400).json({ message: "Cart is empty or not available." });

    const index = Number(ordem);
    if (isNaN(index) || index < 0 || index >= user.cartItems.length) return res.status(400).json({ message: "Invalid cart item index." });

    user.cartItems.splice(index, 1);
    await user.save();
    return res.sendStatus(204);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

export default router;