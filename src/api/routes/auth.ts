import { Router, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { authenticateRoute } from "../middleware/authentications.js";
import { User } from "../../db/models/usersModel.js";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    try {
        const auth = await authenticateRoute(req, res, next);
        const payload = (auth.payload && typeof auth.payload === "object" && "userId" in auth.payload)
            ? auth.payload as JwtPayload & { userId: string }
            : undefined;

        if (auth.authStatus === true && payload && payload.userId) {
            const user = await User.findOne({ userId: payload.userId }).lean();
            if (!user) return res.status(404).json({ error: "User not found" });
            return res.status(200).json({
                authStatus: true,
                userRole: user.role,
                userName: user.name,
                userCart: user.cartItems,
            });
        }

        if (auth.authStatus === false) return res.status(401).json({ authStatus: false });
        return res.status(403).json({ authStatus: auth.authStatus });
    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error",
            details: (err as Error).message,
        });
    }
});

export default router;