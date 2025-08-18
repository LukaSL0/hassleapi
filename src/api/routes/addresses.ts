import { Router, Request, Response } from "express";
import Randomstring from "randomstring";
import { User } from "../../db/models/userModel.js";
import { cepHandler } from "../controllers/cepController.js";
import { Address } from "../../db/models/addressModel.js";
import { encryptData, decryptData } from "../controllers/cryptojsController.js";
import { requireAuth, requireAuthUser, AuthRequest } from "../middleware/authentications.js";

const router = Router();

router.post("/cep-get", async (req: Request, res: Response): Promise<Response | void> => {
    const { cepSent } = req.body;
    try {
        const cepInfo = await cepHandler(cepSent);
        if (!cepInfo || !cepInfo.cep) return res.status(400).send();

        return res.status(200).json({ cepInfo });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error", details: (err as Error).message });
    }
});

router.post("/register", requireAuth, async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const { nomeCompleto, cep, estado, cidade, bairro, rua, numero, complemento, telefone } = req.body;
    const addressInfo = { nomeCompleto, cep, estado, cidade, bairro, rua, numero, complemento, telefone };

    try {
        const encryptedAddress = await encryptData(addressInfo);
        const addressId = Randomstring.generate(20);

        const newAddress = new Address({
            encryptedAddress,
            addressId,
            userId: req.user?.userId,
        });

        await newAddress.save();
        return res.status(201).json({ message: "Address saved successfully!" });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error", details: (err as Error).message });
    }
});

router.get("/get-address", requireAuth, async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        const addressInfo = await Address.find({ userId: req.user?.userId }).lean();
        if (!addressInfo || addressInfo.length === 0) return res.status(404).json({ message: "Address Not Found" });

        const decryptedAddresses: any[] = [];
        const addressesIds: string[] = [];

        for (const address of addressInfo) {
            decryptedAddresses.push(await decryptData(address.encryptedAddress));
            addressesIds.push(address.addressId);
        }

        return res.status(200).json({
            message: "Address fetched successfully!",
            decryptedAddresses,
            addressesIds,
        });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error", details: (err as Error).message });
    }
});

router.delete("/delete-address/:addressId", requireAuth, async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const { addressId } = req.params;

    try {
        const addressInfo = await Address.findOne({ addressId }).lean();
        if (!addressInfo) return res.status(404).json({ message: "Address Not Found" });
        if (addressInfo.userId !== req.user?.userId) return res.status(403).send();

        await Address.deleteOne({ addressId });
        return res.sendStatus(204);
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error", details: (err as Error).message });
    }
});

router.get("/get", requireAuthUser, async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        const user = req.dbUser!;

        if (!user.addressSelected) {
            const addressFound = await Address.findOne({ userId: user.userId }).lean();
            if (!addressFound) return res.sendStatus(204);

            await User.updateOne({ userId: user.userId }, { $set: { addressSelected: addressFound.addressId } });
            return res.sendStatus(201);
        }

        const addressInfo = await Address.findOne({ addressId: user.addressSelected }).lean();
        if (!addressInfo) {
            await User.updateOne({ userId: user.userId }, { $unset: { addressSelected: "" } });
            return res.status(404).json({ message: "Address Not Found" });
        }

        return res.status(200).json({ ID: addressInfo.addressId });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error", details: (err as Error).message });
    }
});

router.post("/select", requireAuthUser, async (req: AuthRequest, res: Response): Promise<Response | void> => {
    const { addressIdSent } = req.body;

    try {
        const user = req.dbUser!;
        await User.updateOne({ userId: user.userId }, { $set: { addressSelected: addressIdSent } });

        return res.sendStatus(200);
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error", details: (err as Error).message });
    }
});

router.get("/get-addressselected", requireAuthUser, async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        const user = req.dbUser!;
        if (!user.addressSelected) return res.sendStatus(204);

        const addressSelected = await Address.findOne({ addressId: user.addressSelected }).lean();
        if (!addressSelected) return res.sendStatus(204);

        const decryptedAddress = await decryptData(addressSelected.encryptedAddress);

        return res.status(200).json({ addressSelected: decryptedAddress });
    } catch (err) {
        return res.status(500).json({ error: "Internal Server Error", details: (err as Error).message });
    }
});

export default router;