import express from "express";
import { searchOnDb, searchList, getLeadsbyLeadsIds, scheduledSearchOnDb, manualSearch } from "../../controllers/searchLeadsController.js";

const searchLeadsApiRouter = express();
searchLeadsApiRouter.use(express.json());

searchLeadsApiRouter.get("/", (req, res) => {
  return res.send("Search Leads API Route");
});

searchLeadsApiRouter.post("/search", searchOnDb);
searchLeadsApiRouter.post("/scheduledSearch", scheduledSearchOnDb);
searchLeadsApiRouter.get("/list", searchList);
searchLeadsApiRouter.post("/byLeadsIds", getLeadsbyLeadsIds);
searchLeadsApiRouter.post("/manualSearch", manualSearch);
/* searchLeadsApiRouter.post("/newSearch", createNewSearch);
searchLeadsApiRouter.get("/list", searchList);
searchLeadsApiRouter.get("/listLeads", leadsList); */

export default searchLeadsApiRouter;