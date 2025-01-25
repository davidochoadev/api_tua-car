import express from "express";
import cors from 'cors';
import corsOptions from "./config/corsOptions.js";
import { performSearch } from "./controllers/searchController.js";
import { performData } from "./controllers/dataController.js";
import { removeData } from "./controllers/removeController.js";
import fs from "fs";
import path from "path";
import leadsApiRouter from "./routes/api/leadsapi.js";
import facebookApiRouter from "./routes/api/facebookapi.js";
import messengerApiRouter from "./routes/api/messengerApi.js";
import locationApiRouter from "./routes/api/locationApi.js";
import searchLeadsApiRouter from "./routes/api/searchLeadsApi.js";
import userApirouter from "./routes/api/userApi.js";
import botApiRouter from "./routes/v2/botApi.js";

const app = express();
app.use(express.json());
app.use(cors(corsOptions));

app.get("/", (req, res) => {
    res.send("Server Express delle API per i leads di Tua Car");
});

app.get("/search", performSearch);
app.get("/data", performData);
app.get("/remove", removeData);

/* app.get("/facebook", searchOnFacebook);
app.get("/facebookData", searchUserDataOnFacebook); */

app.use("/api", leadsApiRouter);
app.use("/facebook", facebookApiRouter);
app.use("/messenger", messengerApiRouter);
app.use("/location", locationApiRouter);
app.use("/user", userApirouter);

app.use("/leads", searchLeadsApiRouter);
app.use("/bot", botApiRouter);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
