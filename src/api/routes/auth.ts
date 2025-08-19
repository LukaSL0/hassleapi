import { Router, Request, Response } from "express";
import { getAuthStatus } from "../middleware/authentications.js";
import { User } from "../../db/models/userModel.js";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<Response> => {
    try {
        const auth = getAuthStatus(req);
        if (auth.status !== "ok" || !auth.payload) {
            const map: Record<string, number> = { missing: 401, invalid: 401, expired: 401 };
            return res.status(map[auth.status] ?? 401).json({ authStatus: false, reason: auth.status });
        }
        const user = await User.findOne({ userId: auth.payload.userId }).lean();
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.status(200).json({
            authStatus: true,
            userRole: user.role,
            userName: user.name,
            userCart: user.cartItems,
        });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error", details: (err as Error).message });
    }
});

export default router;