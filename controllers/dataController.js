import "dotenv/config";
import Search from "./classes/search.js";

export const region_index = {
    "Lombardia" : 10,
    "Piemonte" : 13,
    "Liguria" : 9,
    "Valle d'Aosta/Vallée d'Aoste" : 20,
}

export const search_lombardia ={
    location : "Lombardia",
    items_per_page: 10
}

export const search_liguria = {
    location : "Liguria",
    items_per_page: 10
}

export const search_piemonte = {
    location : "Piemonte",
    items_per_page: 10
}

export const search_vda = {
    location : "Valle d'Aosta/Vallée d'Aoste",
    items_per_page: 10
}

export const performData = async (req, res) => {
    const location = req.query.location;
    switch (location) {
        case "lombardia" :
        const searchLombardia = new Search(search_lombardia, 0, 10, 12);
        if (req.query.key === process.env.KEY) {
            try {
              const response = await searchLombardia.doClusterDataCollection("export_lombardia", req.query.location);
              // Handle success and send the response
              res.status(200).json({ message: "Lombardia Data performed successfully", response});
            } catch (err) {
              console.log("Timeout error occurred, cannot retrieve Lombardia auctions.", err);
              // Handle error and send the response
              res.status(500).json({ error: "Timeout error occurred, cannot retrieve Lombardia auctions." });
            }
        }
        break;
        case "liguria" :
        const searchLiguria = new Search(search_liguria, 0, 10, 12);
        if (req.query.key === process.env.KEY) {
            try {
              const response = await searchLiguria.doClusterDataCollection("export_liguria", req.query.location);
              // Handle success and send the response
              res.status(200).json({ message: "Liguria Data performed successfully", response });
            } catch (err) {
              console.log("Timeout error occurred, cannot retrieve Liguria auctions.", err);
              // Handle error and send the response
              res.status(500).json({ error: "Timeout error occurred, cannot retrieve Liguria auctions." });
            }
        }
        break;
        case "piemonte":
        const searchPiemonte = new Search(search_piemonte, 0, 10, 12);
        if (req.query.key === process.env.KEY) {
            try {
              const response = await searchPiemonte.doClusterDataCollection("export_piemonte", req.query.location);
              // Handle success and send the response
              res.status(200).json({ message: "Piemonte Data performed successfully", response });
            } catch (err) {
              console.log("Timeout error occurred, cannot retrieve Piemonte auctions.", err);
              // Handle error and send the response
              res.status(500).json({ error: "Timeout error occurred, cannot retrieve Piemonte auctions." });
            }
        }
        break;
        case "vda":
        const searchVda = new Search(search_vda, 0, 10, 12);
        if (req.query.key === process.env.KEY) {
            try {
              const response = await searchVda.doClusterDataCollection("export_vda", req.query.location);
              // Handle success and send the response
              res.status(200).json({ message: "Valle d'Aosta Data performed successfully", response });
            } catch (err) {
              console.log("Timeout error occurred, cannot retrieve Piemonte auctions.", err);
              // Handle error and send the response
              res.status(500).json({ error: "Timeout error occurred, cannot retrieve Valle d'Aosta auctions." });
            }
        }
        break;
        default : 
        res.status(500).json({error: "Missing location on Data! Currently location available are:", location : {location_9: "liguria", location_10: "lombardia",location_13: "piemonte"}})
    }
  };