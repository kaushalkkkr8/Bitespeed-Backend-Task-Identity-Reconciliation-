import express from "express";
import { orderController } from "../controller/orderController.js";
import { orderMiddleware } from "../middleware/orderMiddleware.js";

const router = express.Router();

router.route("/").post(orderMiddleware, orderController);

export default router;
