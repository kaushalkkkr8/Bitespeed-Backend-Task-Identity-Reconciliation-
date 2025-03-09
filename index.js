import express from "express";

import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Surver is running");
});

import orderRoutes from "./Routes/orderRoute.js";

app.use("/identify", orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("app is running in port:", PORT);
});
