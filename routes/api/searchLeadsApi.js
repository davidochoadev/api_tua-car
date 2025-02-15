import express from "express";
import {
  searchOnDb,
  searchList,
  getLeadsbyLeadsIds,
  scheduledSearchOnDb,
  manualSearch,
  getLastResult,
  searchBySearchId,
  createScheduledSearch,
  getLastRes,
} from "../../controllers/searchLeadsController.js";

const searchLeadsApiRouter = express();
searchLeadsApiRouter.use(express.json());

searchLeadsApiRouter.get("/", (req, res) => {
  return res.send("Search Leads API Route");
});

//? DA CONTROLLARE
searchLeadsApiRouter.post("/search", searchOnDb);

//? DA CONTROLLARE
searchLeadsApiRouter.post("/scheduledSearch", scheduledSearchOnDb);

// * LISTA DELLE RICERCHE EFFETTUATE DA UN UTENTE
searchLeadsApiRouter.get("/list", searchList);

// * RICERCA LEADS PER ID
searchLeadsApiRouter.post("/byLeadsIds", getLeadsbyLeadsIds);

// ! DEPRECATED - RECUPERA L'ULTIMO RISULTATO DI RICERCA DI UN UTENTE SPECIFICO
searchLeadsApiRouter.get("/lastResult", getLastResult);

// * RECUPERA L'ULTIMO RISULTATO DI RICERCA DI UN UTENTE SPECIFICO
searchLeadsApiRouter.get("/lastRes", getLastRes);

// * CREA UNA RICERCA MANUALE
searchLeadsApiRouter.post("/manualSearch", manualSearch);

// * LISTA DI LEADS PER ID DI RICERCA
searchLeadsApiRouter.get("/searchBySearchId", searchBySearchId);

// * CREA UNA RICERCA PROGRAMMATA
searchLeadsApiRouter.post("/ricercaProgrammata", createScheduledSearch);

//! DEPRECATED
/* searchLeadsApiRouter.post("/newSearch", createNewSearch);
searchLeadsApiRouter.get("/list", searchList);
searchLeadsApiRouter.get("/listLeads", leadsList); */

export default searchLeadsApiRouter;
