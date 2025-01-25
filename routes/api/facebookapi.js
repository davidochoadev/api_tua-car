import { Router } from "express";
import express from "express";
import { searchOnFacebook, deleteOldRecords, saveOnDb, loggedSearch } from "../../controllers/facebookController.js";


//! DEPRECATED
const facebookApiRouter = express();
facebookApiRouter.use(express.json());

facebookApiRouter.get("/", (req, res) => {
  return res.send("Facebook API Route");
});

facebookApiRouter.get("/delete", deleteOldRecords);
facebookApiRouter.get("/search", searchOnFacebook);
facebookApiRouter.get("/loggedSearch", loggedSearch);
facebookApiRouter.get("/save", saveOnDb);

export default facebookApiRouter ;