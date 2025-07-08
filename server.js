import express from "express";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3001;
import pendaftaranRoute from "./src/interfaces/routes/pendaftaranRoute.js";
import { verifyUserToken } from "./src/interfaces/http/middlewares/verifAuth.js";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/pendaftaran", verifyUserToken, pendaftaranRoute);
app.get("/", (req, res) => {
  res.send("Welcome to the Pendaftaran Service API");
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
