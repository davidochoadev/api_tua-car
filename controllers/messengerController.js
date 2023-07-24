import Messenger from "./classes/messenger.js";
import fsPromises from 'fs/promises'
import "dotenv/config";
import { facebookApiService } from '../Service/facebookApiService.js'
import chalk from "chalk";

const service = new facebookApiService();

export const sendMessages = async (req, res) => {
  try {
    const messenger = new Messenger(
      0,
      process.env.FACEBOOK_EMAIL2,
      process.env.FACEBOOK_PASSWORD2,
    );
    const data = await messenger.sendMessagge();
    res.status(200).json({ successful : data });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error });
  }
}

export const getElements = async (req, res) => {
   const reqBody = req.body;
   if(req.headers.api_key === process.env.API_KEY) {
      let arrayOfLinks = [];
      reqBody.map(car => {
         var newDatas = {}
         newDatas["urn"] = car.urn;
         newDatas["url"] = car.url;
         arrayOfLinks.push(newDatas);
      });
      const messenger = new Messenger(
         0,
         process.env.FACEBOOK_EMAIL2,
         process.env.FACEBOOK_PASSWORD2,
       );
      const data = await messenger.test(arrayOfLinks);
      res.status(200).json({
         successful: "api_key is okay",
         headerContent : arrayOfLinks,
         resultContent : data,
      })
   }else{
      res.status(500).json({
         error: "wrong api_key",
      })
   }
}