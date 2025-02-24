import express from "express";
import {
  userHasScheduledTask,
  userOnDb,
  userSpokiData,
  userUpdateData,
  userUpdate,
  userUpdatePassword,
  disableScheduledTask,
} from "../../controllers/userController.js";

const userApirouter = express();
userApirouter.use(express.json());

userApirouter.get("/", (req, res) => {
  return res.send("Search User API Route");
});

//? DA CONTROLLARE
userApirouter.get("/informations", userOnDb);
//* VERIFICA SE L'UTENTE HA UNA TASK PROGRAMMATA
userApirouter.get("/scheduledTask", userHasScheduledTask);
//* DISABILITA LA TASK PROGRAMMATA
userApirouter.post("/disableScheduledTask", disableScheduledTask);
userApirouter.get("/getSpoki", userSpokiData);

//* OTTIENI LE INFORMAZIONI DELL'UTENTE PER FILLARE IL FORM
userApirouter.get("/update", userUpdateData);
//* EFFETTUA LA MODIFICA DELL'UTENTE
userApirouter.post("/update", userUpdate);
//* EFFETTUA LA MODIFICA DELLA PASSWORD
userApirouter.post("/updatePassword", userUpdatePassword);

export default userApirouter;
