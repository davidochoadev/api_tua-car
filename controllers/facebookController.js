import Facebook from "./classes/facebook.js";
import fsPromises from 'fs/promises'
import "dotenv/config";
import { facebookApiService } from '../Service/facebookApiService.js'
import { comuneApiService } from '../Service/comuneApiService.js';
import chalk from "chalk";

const service = new facebookApiService();
const comune = new comuneApiService();

export const searchUserDataOnFacebook = async (req, res) => {
  try {
    const location = req.query.location;
    const scrollCount = req.query.scroll_count || 0;
    const test = new Facebook(
      0,
      parseInt(scrollCount),
      process.env.FACEBOOK_EMAIL2,
      process.env.FACEBOOK_PASSWORD2,
      location
    );
    const data = await test.clusterUserDataCollection(location);
    res.status(200).json({ successful : data });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error });
  }
}

export const deleteOldRecords = async (req,res) => {
   try {
    const date = new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000 + 1)
    await service.deleteExpiredCars(date);
    console.log(chalk.bgGreen("🗑 Database was updated successfully, expired records removed"))
    res.status(200).json({ successful: "🗑 Database was updated successfully, expired records removed"});
   }
   catch (err) {
     console.log(err);
     res.status(500).json({ error: err });
   }
}

export const searchOnFacebook = async (req, res) => {
  try {
    const location = req.query.location;
    const scrollCount = req.query.scroll_count || 0;
    const test = new Facebook(
      0,
      parseInt(scrollCount),
      process.env.FACEBOOK_EMAIL2,
      process.env.FACEBOOK_PASSWORD2,
      location
    );

    const data = await test.search(location);
    res.status(200).json({ success: "✅ Success Search on Facebook Marketplace!", data });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error : "❌ Error on Facebook Marketplace Search!" });
  }
}

export const saveOnDb = async (req, res) => {
  try {
    const location = req.query.location;
    const read = await fsPromises.readFile(`Temp/fb_${location}_result.json`, { encoding: "utf-8"});
    const parsedData = JSON.parse(read);
    var failures = 0;
    var correct = 0;
    for (let car of parsedData) {
      const geo_info = await comune.getComune(car.geo_town) || "";
      try {
        await service.createFacebookCar(car.urn, car.subject, isNaN(car.price) ? 0 : car.price, toString(car.mileage_scalar), car.register_year, car.geo_region, geo_info.provincia, car.geo_town, car.url);
        console.log(`Element ${car.subject} added to database`);
        correct++
      }
      catch (err) {
        console.log(chalk.bgRedBright("❌ Unable to add current item"), err);
        failures++
      }
    }
    res.status(200).json({success: `✅ Pushed on the database new ${correct} on ${parsedData.length}`});
  }catch (err) {
    res.status(500).json({ error : "Error on saving elements on database" , err });
  }
}

/* 
 */