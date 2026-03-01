import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";

const app = express();
app.use(cors());
app.use(express.json());

registerRoutes(app);

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
