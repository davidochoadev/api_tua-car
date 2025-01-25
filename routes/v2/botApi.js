import express from "express";
import { ricercaManualeBot, attivazioneRicercaAutomaticaBot, updateStatusPagineDaAnalizzareBot } from "../../controllers/v2/botController.js";
const botApiRouter = express();
botApiRouter.use(express.json());

botApiRouter.get("/", (req, res) => {
  return res.send("Bot API Route");
});
//* RICERCA MANUALE DEL BOT
botApiRouter.post("/ricercaManuale", ricercaManualeBot);
//* ATTIVAZIONE/DISATTIVAZIONE RICERCA AUTOMATICA DEL BOT
botApiRouter.post("/attivazioneRicercaAutomatica", attivazioneRicercaAutomaticaBot);
//* MODIFICA NUMERO DELLE PAGINE DA ANALIZZARE
botApiRouter.post("/modificaPagine", updateStatusPagineDaAnalizzareBot);


export default botApiRouter;
