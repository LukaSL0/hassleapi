import { Router, Request, Response } from "express";
import Randomstring from "randomstring";
import { Drop } from "../../db/models/dropModel.js";
import { requireAdmin } from "../middleware/authentications.js";

const router = Router();

interface AddItemBody {
    name: string;
    images: string[];
    stock: number;
    price: number;
    category: string;
    dropID: string;
}

interface GetItemBody {
    itemsSent: { id: string; size: string }[];
}

// Buscar itens por id e retornar tamanhos
router.post("/get/item", async (req: Request<{}, {}, GetItemBody>, res: Response) => {
    const { itemsSent } = req.body;
    
    try {
        const allItems: any[] = [];
        const allSizes: string[] = [];
        
        for (const item of itemsSent) {
            const itemFound = await Drop.find({ itemId: item.id }).select("-_id -itemStock -itemCategory -itemId");
            allItems.push(itemFound);
            allSizes.push(item.size);
        }
        
        return res.status(200).json({
            message: "Items successfully returned.",
            items: allItems,
            sizes: allSizes,
        });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error", err });
    }
});

// Adicionar novo item ao drop
router.post("/add/item", requireAdmin, async (req: Request<{}, {}, AddItemBody>, res: Response) => {
    const { name, images, stock, price, category, dropID } = req.body;

    try {
        const nameExists = await Drop.findOne({ itemName: name }).lean();
        if (nameExists) return res.status(409).json({ message: "This item already exists." });

        const newItem = new Drop({
            itemName: name,
            itemImages: images,
            itemStock: stock,
            itemPrice: price,
            itemCategory: category,
            itemId: Randomstring.generate(28),
            dropId: dropID,
        });

        await newItem.save();
        return res.status(200).json({ message: "Item successfully added to database." });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error", err });
    }
});

export default router;