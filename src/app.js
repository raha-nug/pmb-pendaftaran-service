import express from "express";
import cors from "cors";
const app = express();
import pendaftaranRoute from "../src/interfaces/routes/pendaftaranRoute.js";
import { verifyUserToken } from "../src/interfaces/http/middlewares/authenticate.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/api/pendaftaran", verifyUserToken, pendaftaranRoute);
app.get("/", (req, res) => {
  res.send("Welcome to the Pendaftaran Service API");
});

export default app;
