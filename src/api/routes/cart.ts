import { Router, Request, Response } from "express";
import { Drop } from "../../db/models/dropModel.js";

const router = Router();

interface CartRequestBody {
    cartItems: string[];
}

router.post("/", async (req: Request<{}, {}, CartRequestBody>, res: Response): Promise<Response> => {
    const { cartItems } = req.body;
    if (!Array.isArray(cartItems) || cartItems.length < 1) return res.status(204).send();

    try {
        const itemsData = await Promise.all(
            cartItems.map(async (itemId) => {
                return await Drop.findOne({ itemId }).lean();
            })
        );

        return res.status(200).json(itemsData);
    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error",
            details: (err as Error).message,
        });
    }
  }
);

export default router;