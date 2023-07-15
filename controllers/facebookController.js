import Facebook from "./classes/facebook.js";
import "dotenv/config";

export const searchOnFacebook = async (req, res) => {
   try {
      const test = new Facebook(0);
      const data = await test.search();
      res.status(200).json({ok: "test is working!", data});
    }catch(err) {
      res.status(500).json({ failed : "❌ Test is not working...", err});
    }
}