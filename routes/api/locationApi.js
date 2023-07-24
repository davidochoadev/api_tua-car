// Route di Locazione /location/
import express from "express";
import { regionList, provsByRegion } from "../../controllers/locationController.js";

const locationApiRouter = express();
locationApiRouter.use(express.json());

locationApiRouter.get("/", (req, res) => {
  return res.send("Location API Route");
});

locationApiRouter.get("/regioni", regionList);
locationApiRouter.post("/province", provsByRegion);

export default locationApiRouter ;