import Search from "./classes/search.js";
import { search_liguria, search_lombardia, search_piemonte, search_vda } from "./dataController.js";
import "dotenv/config";

export const removeData = async (req, res) => {
  const location = req.query.location;
  switch (location) {
    case "lombardia" :
      const search = new Search(search_lombardia, 0, 10, 12);
      if (req.query.key === process.env.KEY) {
        try {
          await search.deleteExpiredElements()
          // Handle success and send the response
          res.status(200).json({ message: "🗑 Deleted Expired Elements from lombardia storage" });
        } catch (err) {
          console.log("Timeout error occurred", err);
          // Handle error and send the response
          res.status(500).json({ error: "Timeout error occurred" });
        }
      } else {
        res.status(500).json({ error: "Wrong Key to Remove Data!" });
      }
    break;
    case "liguria" :
      const searchLiguria = new Search(search_liguria, 0, 10, 12);
      if (req.query.key === process.env.KEY) {
        try {
          await searchLiguria.deleteExpiredElements()
          // Handle success and send the response
          res.status(200).json({ message: "🗑 Deleted Expired Elements from liguria storage" });
        } catch (err) {
          console.log("Timeout error occurred", err);
          // Handle error and send the response
          res.status(500).json({ error: "Timeout error occurred" });
        }
      } else {
        res.status(500).json({ error: "Wrong Key to Remove Data!" });
      }
    break;
    case "piemonte":
      const searchPiemonte = new Search(search_piemonte, 0, 10, 12);
      if (req.query.key === process.env.KEY) {
        try {
          await searchPiemonte.deleteExpiredElements()
          // Handle success and send the response
          res.status(200).json({ message: "🗑 Deleted Expired Elements from piemonte storage" });
        } catch (err) {
          console.log("Timeout error occurred", err);
          // Handle error and send the response
          res.status(500).json({ error: "Timeout error occurred" });
        }
      } else {
        res.status(500).json({ error: "Wrong Key to Remove Data!" });
      }
    break;
    case "vda":
      const searchVda = new Search(search_vda, 0, 10, 12);
      if (req.query.key === process.env.KEY) {
        try {
          await searchVda.deleteExpiredElements()
          // Handle success and send the response
          res.status(200).json({ message: "🗑 Deleted Expired Elements from Valle d'Aosta storage" });
        } catch (err) {
          console.log("Timeout error occurred", err);
          // Handle error and send the response
          res.status(500).json({ error: "Timeout error occurred" });
        }
      } else {
        res.status(500).json({ error: "Wrong Key to Remove Data!" });
      }
    break;
    default :
    res.status(500).json({error: "Missing location! Currently location available are:", location : {location_9: "liguria", location_10: "lombardia",location_13: "piemonte"}})
  }
};
