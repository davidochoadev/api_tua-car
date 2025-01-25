import { botApiService } from "../../Service/botApiService.js";
import chalk from "chalk";
const bot = new botApiService();
// * RICERCA MANUALE
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

// * ATTIVAZIONE RICERCA AUTOMATICA
export const attivazioneRicercaAutomaticaBot = async (req, res) => {
    const data = req.body;
    const platform = data.platform;
    const status = data.status === "true" ? 1 : 0;

    const validazione = await validazioneAttivazioneRicercaAutomatica(platform, status, data.status);
    if (!validazione.success) {
        return res.status(400).json({ error: validazione.message });
    }

    const updateStatus = await bot.updateStatusRicercaAutomatica(platform, status);
    if (!updateStatus.success) {
        return res.status(500).json({ error: "Errore durante l'aggiornamento del status" });
    }

    console.log(chalk.bgGreen(` 🏁 Status aggiornato con successo, per la piattaforma ${platform} con status ${status === 1 ? "attivo" : "disattivato"} 🏁 `));

    return res.status(200).json(updateStatus);
}

// * MODIFICA NUMERO DI PAGINE DA ANALIZZARE
export const updateStatusPagineDaAnalizzareBot = async (req, res) => {
    const data = req.body;
    const platform = data.platform;
    const pages = parseInt(data.pages, 10);

    const validazione = await validazioneModificaPagineDaAnalizzare(platform, pages);
    if (!validazione.success) {
        return res.status(400).json({ error: validazione.message });
    }

    const updatePagine = await bot.updateStatusPagineDaAnalizzare(platform, pages);
    if (!updatePagine.success) {
        return res.status(500).json({ error: "Errore durante l'aggiornamento del numero di pagine" });
    }

    console.log(chalk.bgGreen(` 🏁 Numero di pagine aggiornato con successo, per la piattaforma ${platform} con ${pages} pagine 🏁 `));
    return res.status(200).json(updatePagine);
}

// * UTILITY per gestire i retry
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
// * UTILITY per validare l'attivazione della ricerca automatica
const validazioneAttivazioneRicercaAutomatica = async (platform, status, dataStatus) => {
   const platformOptions = ["platform-04", "platform-05", "platform-06","platform-07","platform-08"];

   if (!platform) {
       return { success: false, message: "La platform è obbligatoria, le opzioni disponibili sono: " + platformOptions.join(", ") };
   }

   if (status !== 1 && status !== 0) {
       return { success: false, message: "Lo status è obbligatorio, le opzioni disponibili sono: true, false" };
   }

   if (!platformOptions.includes(platform)) {
       return { success: false, message: "La platform non è valida, le opzioni disponibili sono: " + platformOptions.join(", ") };
   }

   if (dataStatus !== "true" && dataStatus !== "false") {
         return { success: false, message: "Il status non è valido, le opzioni disponibili sono: true, false" };
   }

   return { success: true, message: "Validazione effettuata con successo" };
}

// * UTILITY per validare la modifica del numero di pagine da analizzare
const validazioneModificaPagineDaAnalizzare = async (platform, pages) => {
    const platformOptions = ["platform-04", "platform-05", "platform-06","platform-07","platform-08"];

    if (!platform) {
        return { success: false, message: "La platform è obbligatoria, le opzioni disponibili sono: " + platformOptions.join(", ") };
    }

    if (!pages) {
        return { success: false, message: "Il numero di pagine è obbligatorio" };
    }

    if (!platformOptions.includes(platform)) {
        return { success: false, message: "La platform non è valida, le opzioni disponibili sono: " + platformOptions.join(", ") };
    }

    if (pages < 1) {
        return { success: false, message: "Il numero di pagine deve essere maggiore di 0" };
    }

    if (!Number.isInteger(pages)) {
        return { success: false, message: "Il numero di pagine deve essere un numero intero" };
    }

    return { success: true, message: "Validazione effettuata con successo" };
}