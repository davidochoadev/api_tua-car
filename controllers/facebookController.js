import Facebook from "./classes/facebook.js";
import "dotenv/config";

export const searchOnFacebook = async (req, res) => {
   const location = req.query.location;
   const scrollCount = req.query.scroll_count || 0
   try {
      const test = new Facebook(0,parseInt(scrollCount), process.env.FACEBOOK_EMAIL, process.env.FACEBOOK_PASSWORD);
      const data = await test.search(location);
      res.status(200).json({ok: "test is working!", data});
    } catch(err) {
      res.status(500).json({ failed : "❌ Test is not working...", err});
    }
}