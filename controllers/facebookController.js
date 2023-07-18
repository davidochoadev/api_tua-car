import Facebook from "./classes/facebook.js";
import "dotenv/config";
import { facebookApiService } from '../Service/facebookApiService.js'
import { comuneApiService } from '../Service/comuneApiService.js';

const service = new facebookApiService();
const comune = new comuneApiService();

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
    res.status(200).json({ ok: "test is working!", data });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error });
  }
}      

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
    var failures = 0;
    var correct = 0;
    for (let car of data) {
      const geo_info = await comune.getComune(car.geo_town) || "";
      
      try {
        await service.createFacebookCar(car.urn, car.subject, isNaN(car.price) ? 0 : car.price, car.mileage_scalar, car.register_year, car.geo_region, geo_info.provincia, car.geo_town, car.url, car.advertiser_name, car.advertiser_phone);
        console.log(`Element ${car.subject} added to database`);
        correct++
      }
      catch (err) {
        console.log(chalk.bgRedBright("❌ Unable to add current item"), err);
        failures++
      }
    }
    res.status(200).json({ successful : `✅ Created new ${correct} announcement from facebook on the database`});
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error });
  }
}