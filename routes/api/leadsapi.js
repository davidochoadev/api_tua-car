import { Router } from "express";
import express from "express";

// ! DEPRECATED
const leadsApiRouter = express();
leadsApiRouter.use(express.json());

leadsApiRouter.get("/", (req, res) => {
  return res.send("Leads API Route");
});

export default leadsApiRouter ;