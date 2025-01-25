import express from "express";
import { userHasScheduledTask, userOnDb, userSpokiData } from "../../controllers/userController.js";

const userApirouter = express();
userApirouter.use(express.json());

userApirouter.get("/", (req, res) => {
  return res.send("Search User API Route");
});

//? DA CONTROLLARE
userApirouter.get("/informations", userOnDb);
userApirouter.get("/scheduledTask", userHasScheduledTask);
userApirouter.get("/getSpoki",userSpokiData);

export default userApirouter;