import Facebook from "./classes/facebook.js";
import "dotenv/config";

export const searchOnFacebook = async (req, res) => {
   const location = req.query.location;
   const scrollCount = req.query.scroll_count || 0
   try {
      const test = new Facebook(0,parseInt(scrollCount), process.env.FACEBOOK_EMAIL, process.env.FACEBOOK_PASSWORD);
      const timeoutDuration = 120000;
      const timeoutPromise = new Promise((resolve, reject) => {
         setTimeout(() => reject(new Error('Timeout')), timeoutDuration);
       });
       const result = await Promise.race([timeoutPromise, test.search(location)]);

       if (result instanceof Error) {
         // Timeout occurred
         // Handle the timeout error
         res.status(200).json({ not_ok: "test is not working!", result });
       } else {
         // Response received before timeout
         // Access the response data
         const data = result;
         res.status(200).json({ ok: "test is working!", data });
       }
    } catch(err) {
      res.status(500).json({ failed : "❌ Test is not working...", err});
    }
}