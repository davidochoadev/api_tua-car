import { botApiService } from "../../Service/botApiService.js";
import chalk from "chalk";
const bot = new botApiService();

export const ricercaManualeBot = async (req, res) => {
    const data = req.body;
    const platform = data.platform;
    const number_of_pages = parseInt(data.number_of_pages, 10) || 5;

    const platformOptions = ["platform-04", "platform-05", "platform-06","platform-07","platform-08"];
    if (!platform) {
        return res.status(400).json({ error: "La platform è obbligatoria, le opzioni disponibili sono: " + platformOptions.join(", ") });
    }

    if (!platformOptions.includes(platform)) {
        return res.status(400).json({ error: "La platform non è valida, le opzioni disponibili sono: " + platformOptions.join(", ") });
    }

    switch (platform) {
        case "platform-04":
            const resultMotoIt = await bot.ricercaManualeMotoIt(platform, number_of_pages);
            if (!resultMotoIt.success) {
                return res.status(500).json({ error: "Errore durante la ricerca manuale" });
            }
            const updateMotoIt = await retryOperation(() => bot.updateLastExecution(platform));
            if (!updateMotoIt.success) {
                return res.status(500).json({ error: "Errore durante l'aggiornamento del last_run" });
            }
            console.log(chalk.bgGreen(" 🏁 Annunci di Moto.it aggiornati con successo 🏁 "));
            return res.status(200).json(resultMotoIt);          
        case "platform-05":
            const resultSubito = await bot.ricercaManualeMotoSubito(platform, number_of_pages);
            if (!resultSubito.success) {
                return res.status(500).json({ error: "Errore durante la ricerca manuale" });
            }
            const updateSubito = await retryOperation(() => bot.updateLastExecution(platform));
            if (!updateSubito.success) {
                return res.status(500).json({ error: "Errore durante l'aggiornamento del last_run" });
            }
            console.log(chalk.bgGreen(" 🏁 Annunci di Subito.it per moto aggiornati con successo 🏁 "));
            return res.status(200).json(resultSubito);
        case "platform-06":
            const resultCaravanCamper = await bot.ricercaManualeCaravanCamperSubito(platform, number_of_pages);
            if (!resultCaravanCamper.success) {
                return res.status(500).json({ error: "Errore durante la ricerca manuale" });
            }
            const updateCaravanCamper = await retryOperation(() => bot.updateLastExecution(platform));
            if (!updateCaravanCamper.success) {
                return res.status(500).json({ error: "Errore durante l'aggiornamento del last_run" });
            }
            console.log(chalk.bgGreen(" 🏁 Annunci di Subito.it per caravan e camper aggiornati con successo 🏁 "));
            return res.status(200).json(resultCaravanCamper);
        case "platform-07":
            const resultVeicoliCommerciali = await bot.ricercaManualeVeicoliCommercialiSubito(platform, number_of_pages);
            if (!resultVeicoliCommerciali.success) {
                return res.status(500).json({ error: "Errore durante la ricerca manuale" });
            }
            const updateVeicoliCommerciali = await retryOperation(() => bot.updateLastExecution(platform));
            if (!updateVeicoliCommerciali.success) {
                return res.status(500).json({ error: "Errore durante l'aggiornamento del last_run" });
            }
            console.log(chalk.bgGreen(" 🏁 Annunci di Subito.it per veicoli commerciali aggiornati con successo 🏁 "));
            return res.status(200).json(resultVeicoliCommerciali);
        case "platform-08":
            return res.status(501).json({ error: "Platform non ancora implementata" });
            
        default:
            return res.status(400).json({ error: "La platform non è valida, le opzioni disponibili sono: " + platformOptions.join(", ") });
    }
}

// Funzione di utility per gestire i retry
const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        const result = await operation();
        if (result.success) return result;
        
        retryCount++;
        if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    return { success: false };
};