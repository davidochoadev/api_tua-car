import express from "express";
import { ricercaManualeBot, attivazioneRicercaAutomaticaBot, updateStatusPagineDaAnalizzareBot } from "../../controllers/v2/botController.js";
const botApiRouter = express();
botApiRouter.use(express.json());

botApiRouter.get("/", (req, res) => {
  return res.send("Bot API Route");
});

botApiRouter.post("/ricercaManuale", ricercaManualeBot);
botApiRouter.post("/attivazioneRicercaAutomatica", attivazioneRicercaAutomaticaBot);
botApiRouter.post("/modificaPagine", updateStatusPagineDaAnalizzareBot);


export default botApiRouter;
