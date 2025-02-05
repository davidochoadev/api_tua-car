import express from "express";
import { userHasScheduledTask, userOnDb, userSpokiData, userUpdateData, userUpdate } from "../../controllers/userController.js";

const userApirouter = express();
userApirouter.use(express.json());

userApirouter.get("/", (req, res) => {
  return res.send("Search User API Route");
});

//? DA CONTROLLARE
userApirouter.get("/informations", userOnDb);
userApirouter.get("/scheduledTask", userHasScheduledTask);
userApirouter.get("/getSpoki",userSpokiData);

//* OTTIENI LE INFORMAZIONI DELL'UTENTE PER FILLARE IL FORM
userApirouter.get("/update", userUpdateData);
//* EFFETTUA LA MODIFICA DELL'UTENTE
userApirouter.post("/update", userUpdate);

export default userApirouter;