import { Router } from "express";
import express from "express";
import { sendMessages, getElements } from "../../controllers/messengerController.js";

const messengerApiRouter = express();
messengerApiRouter.use(express.json());

messengerApiRouter.get("/", (req, res) => {
  return res.status(200).json("Messenger API Route");
});

messengerApiRouter.get("/sendMessages", sendMessages);
messengerApiRouter.post("/getElements", getElements);

export default messengerApiRouter ;