import Randomstring from "randomstring";
import { Router, Response } from "express";
import { Transaction } from "../../db/models/transactionModel.js";
import { User } from "../../db/models/userModel.js";
import { decryptData } from "../controllers/cryptojsController.js";
import { Address } from "../../db/models/addressModel.js";
import { AuthRequest, requireAuth, requireAdmin, requireAuthUser } from "../middleware/authentications.js";

const router = Router();

// Listar todas as transações (admin)
router.get("/", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const allTransactions = await Transaction.find({}).select("price items -_id");
    return res.status(200).json({ allTransactions });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Listar todos os pedidos (admin)
router.get("/admin", requireAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const allOrders = await Transaction.find({}).select("-userId -items -updatedAt -_id").sort({ _id: -1 }).lean();

    return res.status(200).json({
      message: "Orders fetched successfully!",
      allOrders,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Atualizar status do pedido (admin)
router.put("/admin/update", requireAdmin, async (req: AuthRequest, res: Response) => {
  const { orderId, newStatus, orderTrackingCode } = req.body;

  try {
    const order = await Transaction.findOne({ transactionId: orderId }).lean();
    if (!order) return res.status(404).json({ message: "Order not found." });

    if (newStatus === "Completed" && orderTrackingCode) {
      await Transaction.updateOne(
        { transactionId: orderId },
        { $set: { trackingCode: orderTrackingCode } }
      );
    }
    await Transaction.updateOne({ transactionId: orderId }, { status: newStatus });
    return res.status(200).json({ message: "Order Status changed successfully!" });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Listar pedidos do usuário autenticado
router.get("/orders", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Transaction.find({ userId: req.user?.userId }).select("status transactionId price items -_id").lean();
    return res.status(200).json({
      message: "Orders fetched successfully!",
      orders,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Buscar detalhes de um pedido
router.get("/order/:orderId", requireAuth, async (req: AuthRequest, res: Response) => {
  const { orderId } = req.params;

  try {
    const order = await Transaction.findOne({ transactionId: orderId }).select("status transactionId price items paymentMethod userId createdAt trackingCode -_id").lean();
    if (!order) return res.status(404).json({ message: "Order not found." });

    const user = await User.findOne({ userId: order.userId }).select("email -_id").lean();
    const userReq = await User.findOne({ userId: req.user?.userId });
    if (!userReq || (userReq.userId !== order.userId && userReq.role !== "Admin")) return res.status(403).json({ message: "Unauthorized." });

    const orderAddress = await Transaction.findOne({ transactionId: orderId }).select("encryptedAddress -_id").lean();
    const address = orderAddress?.encryptedAddress ? await decryptData(orderAddress.encryptedAddress) : null;
    return res.status(200).json({
      message: "Order fetched successfully!",
      order,
      user,
      address,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Solicitar novo pedido
router.post("/request-order", requireAuthUser, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.dbUser!;

    const { orderId, price, payment, items } = req.body;
    const address = await Address.findOne({ addressId: user.addressSelected }).lean();
    if (!address) return res.status(404).json({ message: "Address not found." });

    const deliveryAddress = address.encryptedAddress;
    const email = user.email;
    const newOrder = new Transaction({
      items,
      price,
      transactionId: orderId,
      paymentMethod: payment,
      userEmail: email,
      userId: req.user?.userId,
      encryptedAddress: deliveryAddress,
    });
    await newOrder.save();
    user.cartItems = [];
    user.nextOrderId = Randomstring.generate(6);
    await user.save();
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

// Cancelar pedido
router.post("/cancel-order", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;
    await Transaction.findOneAndUpdate({ transactionId: orderId }, { status: "Requested" });
    return res.sendStatus(200);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error", err });
  }
});

export default router;