import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User, IUser } from "../../db/models/userModel.js";

export interface AuthPayload extends JwtPayload {
    userId: string;
    userName?: string;
    role?: string;
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
    dbUser?: IUser;
}

const MSG = {
    NOT_LOGGED: "User not logged in.",
    INVALID_TOKEN: "Invalid token.",
    TOKEN_EXPIRED: "Token expired.",
    USER_NOT_FOUND: "User not found.",
    FORBIDDEN: "Not authorized.",
};

const getToken = (req: Request) => {
    const raw = req.headers["x-access-token"];
    return typeof raw === "string" ? raw : null;
};

const decodeToken = (token: string): { payload?: AuthPayload; expired?: boolean } => {
    try {
        const payload = jwt.verify(token, process.env.JWT_TOKEN!) as AuthPayload;
        return { payload };
    } catch (err: any) {
        if (err instanceof jwt.TokenExpiredError) return { expired: true };
        return {};
    }
};

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: MSG.NOT_LOGGED });
    const { payload, expired } = decodeToken(token);
    if (expired) return res.status(401).json({ message: MSG.TOKEN_EXPIRED });
    if (!payload) return res.status(401).json({ message: MSG.INVALID_TOKEN });
    req.user = payload;
    next();
};

export const requireAuthUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        const token = getToken(req);
        if (!token) return res.status(401).json({ message: MSG.NOT_LOGGED });
        const { payload, expired } = decodeToken(token);
        if (expired) return res.status(401).json({ message: MSG.TOKEN_EXPIRED });
        if (!payload) return res.status(401).json({ message: MSG.INVALID_TOKEN });
        req.user = payload;
    }
    if (req.dbUser) return next();
    try {
        const doc = await User.findOne({ userId: req.user!.userId });
        if (!doc) return res.status(404).json({ message: MSG.USER_NOT_FOUND });
        req.dbUser = doc;
        next();
    } catch (err) {
        return res.status(500).json({ message: "Internal Server Error", err });
    }
};

const requireRole = (role: string) => async (req: AuthRequest, res: Response, next: NextFunction) => {
    await requireAuthUser(req, res, async () => {
        if (!req.dbUser) return;
        if (req.dbUser.role !== role) return res.status(403).json({ message: MSG.FORBIDDEN });
        next();
    });
};
export const requireAdmin = requireRole("Admin");

export const tryGetAuthStatus = (req: Request): { status: "ok" | "expired" | "invalid" | "missing"; payload?: AuthPayload } => {
    const token = getToken(req);
    if (!token) return { status: "missing" };
    const { payload, expired } = decodeToken(token);
    if (expired) return { status: "expired" };
    if (!payload) return { status: "invalid" };
    return { status: "ok", payload };
};
