import express from "express";
import { ricercaManualeBot } from "../../controllers/v2/botController.js";
const botApiRouter = express();
botApiRouter.use(express.json());

botApiRouter.get("/", (req, res) => {
  return res.send("Bot API Route");
});

botApiRouter.post("/ricercaManuale", ricercaManualeBot);


export default botApiRouter;
