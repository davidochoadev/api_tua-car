import express from "express";
import { userHasScheduledTask, userOnDb } from "../../controllers/userController.js";

const userApirouter = express();
userApirouter.use(express.json());

userApirouter.get("/", (req, res) => {
  return res.send("Search User API Route");
});

userApirouter.get("/informations", userOnDb);
userApirouter.get("/scheduledTask", userHasScheduledTask);

export default userApirouter;