import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../../db/models/usersModel.js";

interface AuthPayload extends JwtPayload {
    userId: string;
    userName?: string;
    role?: string;
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
}

interface AuthResult {
    authStatus: boolean | string;
    payload?: string | JwtPayload;
}

export const authenticateRoute = async (req: Request, res: Response, next: NextFunction): Promise<AuthResult> => {
    const token = req.headers["x-access-token"] as string | undefined;

    try {
        if (!token) return { authStatus: false };

        const jwtSecret = process.env.JWT_TOKEN;
        if (!jwtSecret) return { authStatus: false };

        const response = jwt.verify(token, jwtSecret);
        return {
            authStatus: true,
            payload: response
        };
    } catch (err: any) {
        if (err instanceof jwt.TokenExpiredError) {
            return { authStatus: "Token Expired" };
        } else return { authStatus: false };
    }
};

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers["x-access-token"];
    if (!token || typeof token !== "string")  return res.status(401).json({ message: "User not logged in." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN!) as AuthPayload;
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid token." });
    }
}

export const adminAuthentication = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = await User.findOne({ userId: req.user?.userId });
    if (!user || user.role !== "Admin") return res.status(403).json({ message: "Não autorizado." });
    next();
}