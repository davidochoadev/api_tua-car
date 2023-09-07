// Qui sono disponibili i controller per le locazioni richiamati all'interno della route:
// locationApi.js

import "dotenv/config";
import { locationApiService } from "../Service/locationApiService.js";
import chalk from "chalk";

const comune = new locationApiService();

export const regionList = async (req, res) => {
  try {
    const data = await comune.getAllRegions();
    const regionsArray = data.map(item => item.regione);
    res.status(200).json({ regionList: regionsArray });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error });
  }
};


export const provsByRegion = async (req, res) => {
   if(!req.query.regione) {
      res.status(500).json({ error: "Nessuna regione inviata!"});
   }
   try {
      const data = await comune.getProvsByRegion(req.query.regione);
      const provinceArray = Promise.all(data.map(async item => {
         let denominazione = await comune.getDenominazioneBySigla(item.provincia);
         let provincia = {}
         provincia["sigla"] = item.provincia;
         provincia["denominazione"] = denominazione.provincia;
         return provincia;
      }))
      res.status(200).json({ provList: await provinceArray });
    } catch (err) {
      res.status(500).json({ error : "Errore nella formulazione della chiamata."});
    }
}

export const comuneBySiglaProv = async (req, res) => {
   console.log(req.query.sigla);
   try {
      const data = await comune.getComuniBySiglaProv(req.query.sigla);
      const comuniArray = data.map(item => item.comune);
      res.status(200).json({ comuni: comuniArray });
   } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).json({ error });
    }
}

export const provByProv = async (req, res) => {
   try {
      const data = await comune.getProvsByRegion(req.body.regione);
      res.status(200).json({ regionList: data });
    } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).json({ error });
    }
}

export const comuniByUserMail = async (req, res) => {
  const { userMail } = req.query;
  console.log(userMail);
  try {
    const user = await comune.getUserId(userMail);
    const data = await comune.getUserComuni(user.id);
    const comuniParsed = JSON.parse(data.user_config);
    const provincia = await comune.getProvByComuni(comuniParsed);
    console.log("PRovincia: ", provincia)
    res.status(200).json({
      provincia: provincia,
      comuni: comuniParsed
    });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error });
  }
}