// Qui sono disponibili i controller per le vetture di AutoScout richiamati all'interno della route:
// autoscoutApi.js

import "dotenv/config";
import { searchLeadsApiService } from "../Service/searchLeadsApiService.js";
import chalk from "chalk";

const leads = new searchLeadsApiService();

async function searchOnDbFunc(annoDa, annoA, kmDa, kmA, comuni, platform) {
  if (!platform) {
    return res.status(400).json({
      error: "⚠️ Missing 'platform' parameter within the query parameters. It's not possible to perform the car search in the database without specifying the platform for the search.",
      platformOptions: ["facebook", "autoscout", "subito"]
    });
   }
  
   let data;

   switch (platform) {
     case 'facebook':
       // Call the function to get data for Facebook platform
       console.log("Calling fb", comuni, annoDa, annoA, kmDa, kmA);
       data = await leads.getCarsFromFacebook(comuni, annoDa, annoA, kmDa, kmA);
       break;
     case 'autoscout':
       // Call the function to get data for AutoScout platform
       data = await leads.getCarsFromAutoScout(comuni, annoDa, annoA, kmDa, kmA);
       break;
     case 'subito':
       // Call the function to get data for Subito platform
       data = await leads.getCarsFromSubito(comuni, annoDa, annoA, kmDa, kmA);
       break;
     default:
       return res.status(400).json({
         error: `⚠️ The specified platform '${platform}' is not supported. Supported platforms are: facebook, autoscout, subito.`,
         platformOptions: ["facebook", "autoscout", "subito"]
       });
   }

   return data;
}

export const createNewSearch = async (req, res) => {
  const { annoDa = "1980" } = req.query;
  const { annoA = new Date().getFullYear().toString() } = req.query;
  const { kmDa = "0" } = req.query;
  const { kmA = "500000"} = req.query;
  const { comuni } = req.body;
  const { platform } = req.query;
  const { userMail } = req.body;

  const search = await leads.createSearch(userMail, parseInt(annoDa),parseInt(annoA),parseInt(kmDa),parseInt(kmA),comuni,platform);
  const leadsFromPlatforms = await searchOnDbFunc(annoDa, annoA, kmDa, kmA, comuni, platform);
  const createLeads = await leads.createLeads2(leadsFromPlatforms, platform, search.id);

  return res.status(200).json({
    paramsToPost : {
      search: search,
      //comuni: JSON.parse(search.comuni),
      leadsQuantity: leadsFromPlatforms.length,
      leadsFromPlatforms: leadsFromPlatforms,
      createLeads: createLeads,
    }
  });
}

// FUNZIONE PER LA RICERCA DI VETTURE - MANUAL -
export const searchOnDb = async (req, res) => {
   const { annoDa = "1980" } = req.query;
   const { annoA = new Date().getFullYear().toString() } = req.query;
   const { kmDa = "0" } = req.query;
   const { kmA = "500000"} = req.query;
   const { comuni } = req.body;
   const { platform } = req.query;
   const platformMapping = {
    'facebook': 'cars_facebook',
    'autoscout': 'cars_autoscout',
    'subito': 'cars_subito'
  };

   if (!platform) {
    return res.status(400).json({
      error: "⚠️ Missing 'platform' parameter within the query parameters. It's not possible to perform the car search in the database without specifying the platform for the search.",
      platformOptions: ["facebook", "autoscout", "subito"]
    });
   } else if (!(platform in platformMapping)) {
    return res.status(400).json({
      error: `⚠️ The specified platform '${platform}' is not supported. Supported platforms are: ${Object.keys(platformMapping).join(', ')}.`,
      platformOptions: Object.keys(platformMapping)
    });
  }

   if (!comuni) {
    return res.status(400).json({
      error: "⚠️ Missing 'comuni' inside the body. Without a list of comuni It's not possible to perform the car search in the database without specifying the comuni for the search.",
    })
  }

  const platformOptions = platformMapping[platform];
  const data = await leads.getCars(comuni, annoDa, annoA, kmDa, kmA, platformOptions);

   res.status(200).json({
      parametriRicerca: { annoDa, annoA, kmDa, kmA, comuni },
      res: {
        platform: platform,
        length: data.length,
        data,
      },
   });
};

export const scheduledSearchOnDb = async (req, res) => {
  const { annoDa = "1980" } = req.query;
  const { annoA = new Date().getFullYear().toString() } = req.query;
  const { kmDa = "0" } = req.query;
  const { kmA = "500000"} = req.query;
  const { comuni } = req.body;
  const { platform } = req.query;
  const { userMail } = req.body;
  const { ore } = req.body;
  const platformMapping = {
    'facebook': 'cars_facebook',
    'autoscout': 'cars_autoscout',
    'subito': 'cars_subito'
  };

  if (!platform) {
   return res.status(400).json({
     error: "⚠️ Missing 'platform' parameter within the query parameters. It's not possible to perform the car search in the database without specifying the platform for the search.",
     platformOptions: ["facebook", "autoscout", "subito"]
   });
  } else if (!(platform in platformMapping)) {
    return res.status(400).json({
      error: `⚠️ The specified platform '${platform}' is not supported. Supported platforms are: ${Object.keys(platformMapping).join(', ')}.`,
      platformOptions: Object.keys(platformMapping)
    });
  }
  
  if (!comuni) {
    return res.status(400).json({
      error: "⚠️ Missing 'comuni' inside the body. Without a list of comuni It's not possible to perform the car search in the database without specifying the comuni for the search.",
    });
  }

  if (!userMail) {
    return res.status(400).json({
      error: "⚠️ Missing 'userMail` inside the body. Without the email of the user it's not possible to perform the scheduled search in the database"
    });
  }

  const platformOptions = platformMapping[platform];
  const data = await leads.getRecentCars(comuni, annoDa, annoA, kmDa, kmA, userMail, platformOptions, parseInt(ore));

  res.status(200).json({
     parametriRicerca: { annoDa, annoA, kmDa, kmA, comuni },
     res: {
       platform: platform,
       length: data.length,
       data,
     },
  });
};

export const searchList = async ( req, res ) => {
  const { usermail } = req.headers;
  const { pageNum = "1" } = req.query;
  const { pageSize = "10"} = req.query;

  if (!usermail) {
    return res.status(400).json({
      error: "⚠️ Missing 'userMail' parameter within the header parameters. It's not possible to perform the search list in the database without specifying the userMail for the search."
    });
  }
  
  const userId = await leads.getUserId(usermail);
  if (!userId) {
    return res.status(400).json({
      error: "La mail dell'utente non esiste nel database di leads.tua-car.it e non è possibile ricavare l'id ed ottenere le liste"
    })
  }

  const list = await leads.getSearchList(userId.id, parseInt(pageNum), parseInt(pageSize));
  return res.status(200).json({
/*     currentPage : pageNum, */
/*     totalPages : list.totalPages,
    list : list.searchList, */
    userId: userId.id,
    currentPage : parseInt(pageNum),
    totalPages : list.totalPages,
    list: list.searchList,

  });
}

export const leadsList = async (req,res) => {
  const { userMail } = req.header;
  const { searchId } = req.query;
  const { pageNum = "1" } = req.query;
  const { pageSize = "10"} = req.query;
  const list = await leads.getLeadsList(userMail, parseInt(searchId),parseInt(pageNum),parseInt(pageSize));

  return res.status(200).json({
    currentPage : pageNum,
    totalPages : list.totalPages,
    list: list.leadsList,
  })
}