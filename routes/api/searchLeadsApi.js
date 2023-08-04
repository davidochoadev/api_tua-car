import { Router } from "express";
import express from "express";
import { searchOnDb, createNewSearch, searchList, leadsList } from "../../controllers/searchLeadsController.js";

const searchLeadsApiRouter = express();
searchLeadsApiRouter.use(express.json());

searchLeadsApiRouter.get("/", (req, res) => {
  return res.send("Search Leads API Route");
});

searchLeadsApiRouter.post("/search", searchOnDb);
searchLeadsApiRouter.post("/newSearch", createNewSearch);
searchLeadsApiRouter.get("/list", searchList);
searchLeadsApiRouter.get("/listLeads", leadsList);

export default searchLeadsApiRouter;