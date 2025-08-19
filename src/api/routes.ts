import { Router } from "express";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import dropRouter from "./routes/drops.js";
import cartRouter from "./routes/cart.js";
import transactionsRouter from "./routes/transactions.js";
import addressesRouter from "./routes/addresses.js";

const router = Router();

const routeMap: ReadonlyArray<[path: string, r: ReturnType<typeof Router>]> = [
    ["/auth", authRouter],
    ["/cart", cartRouter],
    ["/users", usersRouter],
    ["/drop", dropRouter],
    ["/transactions", transactionsRouter],
    ["/addresses", addressesRouter],
];

for (const [path, r] of routeMap) { router.use(path, r); }

export default router;