// Qui sono disponibili i controller per le locazioni richiamati all'interno della route:
// locationApi.js
import fsPromises from "fs/promises";
import "dotenv/config";
// import { facebookApiService } from '../Service/facebookApiService.js'
import { locationApiService } from "../Service/locationApiService.js";
import chalk from "chalk";

const comune = new locationApiService();

export const regionList = async (req, res) => {
  try {
    const data = await comune.getAllRegions();
    res.status(200).json({ regionList: data });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error });
  }
};


export const provsByRegion = async (req, res) => {
   console.log(req.body.regione);
   console.log(req.query.regione);
   if(!req.body.regione && !req.query.regione) {
      res.status(500).json({ error: "Nessuna regione inviata!"});
   }
   try {
      const data = await comune.getProvsByRegion(req.query.regione ? req.query.regione : req.body.regione);
      const provinceArray = Promise.all(data.map(async item => {
         let denominazione = await comune.getDenominazioneBySigla(item.provincia);
         let provincia = {}
         provincia["sigla"] = item.provincia;
         provincia["denominazione"] = denominazione.provincia;
         return provincia;
      }))
      res.status(200).json({ provList: await provinceArray });
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