// Route di Locazione /location/
import express from "express";
import { regionList, provsByRegion, comuneBySiglaProv, comuniByUserMail } from "../../controllers/locationController.js";

const locationApiRouter = express();
locationApiRouter.use(express.json());

locationApiRouter.get("/", (req, res) => {
  return res.send("Location API Route");
});

locationApiRouter.get("/regioni", regionList);
locationApiRouter.get("/province", provsByRegion);
locationApiRouter.get("/comuni", comuneBySiglaProv);
locationApiRouter.get("/comuniByUser", comuniByUserMail);

export default locationApiRouter ;