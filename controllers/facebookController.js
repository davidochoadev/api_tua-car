import Facebook from "./classes/facebook.js";
import "dotenv/config";

export const searchOnFacebook = async (req, res) => {
  try {
    const location = req.query.location;
    const scrollCount = req.query.scroll_count || 0;
    const test = new Facebook(
      0,
      parseInt(scrollCount),
      process.env.FACEBOOK_EMAIL,
      process.env.FACEBOOK_PASSWORD
    );
    const data = await test.search(location);
    res.status(200).json({ ok: "test is working!", data });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: "Internal Server Error", error });
  }
}