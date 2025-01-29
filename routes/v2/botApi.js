import express from "express";
import { ricercaManualeBot, attivazioneRicercaAutomaticaBot, updateStatusPagineDaAnalizzareBot, dettagliBot } from "../../controllers/v2/botController.js";
const botApiRouter = express();
botApiRouter.use(express.json());

botApiRouter.get("/", (req, res) => {
  return res.send("Bot API Route");
});

//* DETTAGLI TABELLA BOT bot_settings
botApiRouter.get("/dettagliBot", dettagliBot);

//* RICERCA MANUALE DEL BOT
botApiRouter.post("/ricercaManuale", ricercaManualeBot);
//* ATTIVAZIONE/DISATTIVAZIONE RICERCA AUTOMATICA DEL BOT
botApiRouter.post("/attivazioneRicercaAutomatica", attivazioneRicercaAutomaticaBot);
//* MODIFICA NUMERO DELLE PAGINE DA ANALIZZARE
botApiRouter.post("/modificaPagine", updateStatusPagineDaAnalizzareBot);


export default botApiRouter;
