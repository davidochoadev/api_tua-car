import fsPromises from 'fs/promises'
import puppeteer from 'puppeteer'
import { Cluster } from 'puppeteer-cluster'
import JSON2CSVParser from 'json2csv/lib/JSON2CSVParser.js'
import { region_index } from '../dataController.js'
import chalk from 'chalk';

async function searchComuneFunc(address,location) {
  console.log("location on fun", location);
  let comuniList;
  switch (location) {
    case "Liguria":
      comuniList = "comuni_liguria.json";
      break;
    case "Piemonte":
      comuniList = "comuni_piemonte.json";
      break;
    case "Lombardia":
      comuniList = "comuni_lombardia.json";
      break;
    case "Valle d'Aosta/Vallée d'Aoste":
      comuniList = "comuni_vda.json";
      break;
  }
    // Carica il file JSON contenente i dati dei comuni
    const response = await fsPromises.readFile(`./${comuniList}`, { encoding: "utf-8" });
    const comuniData = JSON.parse(response);

    // Estrai il nome del comune dall'indirizzo fornito
    const comuneRegex = /\d{5}\s(.+?)(?=\s\([^)]+\)$)/;

    const match = address.match(comuneRegex);
    if (match) {
        let comune = match[1];
        // Cerca il comune nel file JSON
        const result = comuniData.find((item) => item.comune === comune);
        if (result) {
        // Il comune è stato trovato nel file JSON

        let comune = result.comune;
        let provincia = result.den_prov;
        let sigla = result.sigla;
        let regione = location;
        return {comune, provincia, sigla,regione}
        // Puoi eseguire le operazioni desiderate con i dati del comune trovato
        } else {
        // Il comune non è stato trovato nel file JSON
        return []
        }
    } else {
        // Indirizzo non valido
       return []
    }
}

export default class Search{

    constructor(config = {location: 1, items_per_page: 10}, debugMode=0, maxCycles=3, threads_num=10){
        this.config = config
        this.debugMode = debugMode
        this.maxCycles = maxCycles
        this.threads_num = threads_num
        this.search_data = []
    }


    async convertToCSV(data, toFileName){
        console.log("Try to ConvertToCSV!")
        // Check if the new_[storage]_results.json is empty
        if(data.length !== 0) {
            const csvFields = Object.keys(data[0])
            const parser = new JSON2CSVParser({fields: csvFields, delimiter: ";"})
            var csvData = parser.parse(data)
            try {
                await fsPromises.writeFile(`./Data/${toFileName}.csv`, csvData);
                console.log("✅ CSV File was created successfully");
                return { csvRes: "✅ CSV File was created successfully" };
              } catch (err) {
                console.log("Can't compile CSV successfully", err);
                return 0;
              }
                                  
        } else {
            //If is empty it create an empty csv to export the file
            const csvFields = [];
            const csvData = '';
            const csvContent = csvFields.join(';') + '\n' + csvData;
            
            try {
            await fsPromises.writeFile(`./Data/${toFileName}.csv`, csvContent);
            console.log("Created empty CSV File!");
            return {csvRes: "Created empty CSV File! :("};
            } catch (err) {
            console.log(err);
            return 0;
            }
        }
    }

    //auction_threshold, auction_end_threshold
    fabricateQuery(){
        return `https://pvp.giustizia.it/pvp/it/risultati_ricerca.page?tipo_bene=immobili&categoria=&geo=geografica&nazione=ITA&regione=${region_index[this.config.location]}&localita=&indirizzo=&prezzo_da=&prezzo_a=&tribunale=&procedura=&anno=&idInserzione=&ricerca_libera=&disponibilita=&ordinamento=data_pub_decre&ordine_localita=a_z&view=tab&elementiPerPagina=${this.config.items_per_page}&frame4_item=1`
    }

    async grabCurrentRunDuplicates() {
        const auctionCards = await this.mainPage.$$('div.row.tile-blocks > div');
      
        const auctionCardDataPromises = auctionCards.map(async (auctionCard) => {
          const auctionCardLink = await auctionCard.$eval("div.col-xs-12.relative > a", (el) => el.href);
          const auction_id = auctionCardLink.split('&').find((el) => el.includes("contentId")).replace('contentId=', "");
          const auctionCardLocation = await auctionCard.$eval("div.col-xs-12 > div > div > div.anagrafica-risultato", (el) => el.textContent.trim());
          const auctionCardCategory = await auctionCard.$eval("div.col-xs-12.relative > span.categoria", (el) => el.textContent.trim());
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 20);
      
          return { auction_id, auctionCardLink, auctionCardCategory, auctionCardLocation, expirationDate };
        });
      
        return Promise.all(auctionCardDataPromises);
      }
      

    async popupButtonHandler() {
        try{
            const popupButton = await this.mainPage.$x('//*[@id="modalInformativa"]/div/div/div[3]/button')
            if(popupButton){
                await popupButton[0].click()
            }
            return 1
        }
        catch{
            return 0
        }
    }
    
    async grabDataFromdata(cluster, data, id){
        await cluster.goto(data.auctionCardLink, {waitUntil: "networkidle2"})
        await this.popupButtonHandler()
        await cluster.waitForSelector("#annunci > div > div:nth-child(2) > div")
        const auctionData = {}
        auctionData["Numero inserzione"] = (await cluster.evaluate(el => el.textContent, await cluster.$("#header-interna > div > h1:nth-child(2)"))).split(".")[1].trim()
        auctionData["Posizione lotto"] = data.auctionCardLocation;
        const getDataComuni = await searchComuneFunc(data.auctionCardLocation, this.config.location);
        auctionData["Comune"] = getDataComuni.comune;
        auctionData["Provincia"] = getDataComuni.provincia;
        auctionData["Sigla"] = getDataComuni.sigla;
        auctionData["Regione"] = getDataComuni.regione;
        auctionData["Categoria"] = data.auctionCardCategory;
        await cluster.waitForSelector('#annunci > div > div:nth-child(2) > div > div.row')
        const auction_sell_detailsRows = await cluster.$$('#annunci > div > div:nth-child(2) > div > div.row')
        for(const auction_sell_detailsRowHandle of auction_sell_detailsRows){
            if((await cluster.evaluate(el => el.children[0]?.className, auction_sell_detailsRowHandle) === 'col-xs-12 col-md-8 col-lg-6 margin-top-20')) continue
            const childKey = await cluster.evaluate(el => el.children[0]?.textContent, auction_sell_detailsRowHandle)
            const childValue = await cluster.evaluate(el => el.children[1]?.textContent, auction_sell_detailsRowHandle)
            auctionData[childKey?.replaceAll("\t", "").replaceAll("\n", "").trim()] = childValue?.replaceAll("\t", "").replaceAll("\n", "").trim()
        }
        const auction_sell_procedureRows = await cluster.$$('body > div:nth-child(10) > div > div.col-md-9.anagrafica-tribunale > div.row')
        for(const auction_sell_procedureRowHandle of auction_sell_procedureRows){
            var childValue = ""
            if(await cluster.evaluate(el => el.children.length, auction_sell_procedureRowHandle) === 3){
                const childKey = await cluster.evaluate(el => el.children[1]?.textContent, auction_sell_procedureRowHandle)
                if(await cluster.evaluate(el => el.children[2]?.children.length, auction_sell_procedureRowHandle) > 0){
                    childValue = await cluster.evaluate(el => el.children[2]?.children[0].textContent, auction_sell_procedureRowHandle)
                }
                else{
                    childValue = await cluster.evaluate(el => el.children[2]?.textContent, auction_sell_procedureRowHandle)
                }
                auctionData[childKey?.replaceAll("\t", "").replaceAll("\n", "").trim()] = childValue?.replaceAll("\t", "")
            }
            else{
                const childKey = await cluster.evaluate(el => el.children[0]?.textContent, auction_sell_procedureRowHandle)
                if(await cluster.evaluate(el => el.children[1]?.children.length, auction_sell_procedureRowHandle) > 0){
                    childValue = await cluster.evaluate(el => el.children[1]?.children[0].textContent, auction_sell_procedureRowHandle)
                }
                else{
                    childValue = await cluster.evaluate(el => el.children[1]?.textContent, auction_sell_procedureRowHandle)
                }
                if(childKey){
                    auctionData[childKey?.replaceAll("\t", "").replaceAll("\n", "").trim()] = childValue?.replaceAll("\t", "").replaceAll("\n", "").trim()
                }
            }
        }
        const auction_file_data = []
        const auctionFiledataRows = await cluster.$$('div.info-box > div.info-row > span > a')
        for(const auctionFiledataRowHandle of auctionFiledataRows){
            var file = (await cluster.evaluate(el => el?.href, auctionFiledataRowHandle))
            if(file.endsWith('.pdf')){
                auction_file_data.push(file)
            }
        }
        const auctionDetailsRows = await cluster.$('#annunci > div > div.row.margin-top-50 > div.col-md-9.anagrafica-tribunale.padding-bottom-20')
        const auctionDetails = await cluster.evaluate(el => el?.children[2].textContent, auctionDetailsRows)
        auctionData["Dettagli Lotto"] = auctionDetails.trim()
        auctionData["PDF files"] = auction_file_data
        const auctionItemsRows = await cluster.$$('#beni-lotto > div.container.bg-white')
        const auctionItems = []
        for(const auctionItemsRowsHandle of auctionItemsRows){
            const item = {}
            item["Indirizzo"] = (await cluster.evaluate(el => el?.children[0]?.children[1]?.children[0]?.textContent, auctionItemsRowsHandle)).replaceAll("\n", "").replaceAll("\t", "").trim()
            item["Descrizione"] = (await cluster.evaluate(el => el?.children[0]?.children[1]?.children[1]?.textContent, auctionItemsRowsHandle)).replaceAll("\n", "").replaceAll("\t", "").trim()
            const detailsRows = await cluster.$$('#beni-lotto > div.container.bg-white > div > div:nth-child(2) > div.anagrafica-tribunale > div.row')
            const details = {}
            try{
                for(const detail of detailsRows){
                    const key = (await cluster.evaluate(el => el?.children[0].textContent, detail)).replaceAll("\n", "").replaceAll("\t", "").trim()
                    details[key] = (await cluster.evaluate(el => el?.children[1].textContent, detail)).replaceAll("\n", "").replaceAll("\t", "").trim()
                }
            }
            catch(err){
                console.log(err)
            }
            item["Dettagli"] = details
            auctionItems.push(item)
        }
        auctionData["Beni lotto"] = auctionItems
        const auction_imgs = []
        for(var i = 0; i < auctionItems.length; i++ ){
            const auctionImgsdataRows = await cluster.$$(`#carousel-${i} > div.scroller > a`)
            for(const auctionFileImgsRowHandle of auctionImgsdataRows){
                var img = (await cluster.evaluate(el => el?.children[0]?.src, auctionFileImgsRowHandle))
                auction_imgs.push(img)
            }
        }
        auctionData["Immagini"] = auction_imgs
        const date = auctionData["Termine presentazione offerta"].replaceAll("/", "-").split(" ")[0]
        const auctionDate = new Date(date.split("-").reverse().join(","))
        const minDate = new Date(new Date().getDate() + 40 * 24 * 60 * 60 * 1000)
        if(auctionDate.getDate() > minDate.getDate()){
            console.log(chalk.green("✅ The termination date of the auction is within the time limit"))
            this.search_data.push(auctionData)
        }
        return 0
    }
    
    async getDuplicates(storageFileName) {
        try {
          console.log(chalk(`Trying to read the ${storageFileName} file`))
          const response = await fsPromises.readFile(`Temp/${storageFileName}`, { encoding: "utf-8" });
          const oldAuctionData = JSON.parse(response);
          console.log('Current file length: ' + oldAuctionData.length);
          return oldAuctionData;
        } catch (error) {
          console.log(chalk.redBright(`⚙️  Missing file! Creating a new ${storageFileName}...`));
          return [];
        }
      }
    
      async getDatasFromNewResults(newFileName) {
        try {
            console.log(chalk.yellow(`Trying to read the ${newFileName} file`));
            const response = await fsPromises.readFile(`Temp/${newFileName}`, { encoding: "utf-8" });
            const newAuctionData = JSON.parse(response);
            console.log('Current file length: ' + newAuctionData.length);
            return newAuctionData;
          } catch (error) {
            console.log(chalk.redBright(`⚙️  Missing file! Creating a ${newFileName}...`));
            return [];
          }
      }
      

    async doClusterDataCollection(file_name, location){
        let newFileName;
        switch (location) {
          case "liguria":
            newFileName = "new_liguria_results.json";
            break;
          case "piemonte":
            newFileName = "new_piemonte_results.json";
            break;
          case "lombardia":
            newFileName = "new_lombardia_results.json";
            break;
          case "vda":
            newFileName = "new_vda_results.json";
            break;
        }
        console.log(chalk.yellowBright("🏁 Starting Cluster Data Collection..."));
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: this.threads_num,
            puppeteerOptions: {
                headless: !this.debugMode
            },
            skipDuplicateUrls: true,
            retryLimit: 1
          })
        await cluster.task(async ({page, data: data, worker}) =>{
            await this.grabDataFromdata(page, data, worker.id)
        })
        const duplicates = await this.getDatasFromNewResults(newFileName);
        var checkedduplicates = 0
        var unCheckedduplicates = 0
        duplicates.every(async (data, i) =>{
            try{
                await cluster.execute(data)
                checkedduplicates++
                console.log(chalk.blue(`⚙️  Data number ${i} has been processed. Total progress: ${(checkedduplicates / (duplicates.length.toFixed(0) - unCheckedduplicates) * 100).toFixed(2)}%`))
            }
            catch(err){
                try{
                    console.log(chalk.redBright(`⚠️  Data number ${i} encountered an error. The program will try one more time before stopping`))
                    await cluster.execute(data)
                }
                catch(err){
                    console.log("Failed to evaluate data number :  " + i,err)
                }
            }
        })
        await cluster.idle()
        await cluster.close()
        try {
            const toCSV = await this.convertToCSV(this.search_data, file_name);
            console.log(chalk.greenBright(`✅ ${checkedduplicates} have been successfully fetched from a total of ${duplicates.length}. All data has been saved in ${file_name}.csv`), toCSV);
        
            try {
              // We delete the previous newFileName to create a new empty one.
              await fsPromises.writeFile(`Temp/${newFileName}`, '[]');
              console.log(chalk.green("✅ Correctly reset of", newFileName));
            } catch (err) {
              console.log(err);
              return 0;
            }
        
            return { toCSV, resOfCSV: `✅ ${checkedduplicates} have been successfully fetched from a total of ${duplicates.length}. All data has been saved in ${file_name}.csv` };
          } catch (error) {
            console.log(error);
            return 0;
          }
    }

    async doSearch() {
        let newFileName;
        let storageFileName;
        console.log("Config location", this.config.location);
        switch (this.config.location) {
          case "Liguria":
            newFileName = "new_liguria_results.json";
            storageFileName = "liguria_storage.json"
            break;
          case "Piemonte":
            newFileName = "new_piemonte_results.json";
            storageFileName = "piemonte_storage.json";
            break;
          case "Lombardia":
            newFileName = "new_lombardia_results.json";
            storageFileName = "lombardia_storage.json";
            break;
          case "Valle d'Aosta/Vallée d'Aoste":
            newFileName = "new_vda_results.json";
            storageFileName = "vda_storage.json";
            break;
        }

        console.log(chalk.bgYellow("Request to search auctions on ", this.config.location));
        console.log(chalk.yellow("🔍 Starting Search..."));
        var oldAuctionData = await this.getDuplicates(storageFileName);
        var url = this.fabricateQuery(this.config.location, this.config.items_per_page);
        const browser = await puppeteer.launch({ headless: !this.debugMode });
        this.mainPage = await browser.newPage();
        await this.mainPage.goto(url, { waitUntil: 'networkidle2' });
        let currentPage = 1;
        let lastPage = 0;
        let currentRunDuplicates = [];
        const oldDuplicates = oldAuctionData.filter((data) => data.auction_id);
        console.log("Result length: " + oldDuplicates.length);
        while (currentPage <= this.maxCycles) {
          console.log("Current page number: " + currentPage);
          await this.popupButtonHandler();
          const runDuplicates = await this.grabCurrentRunDuplicates();
          currentRunDuplicates = currentRunDuplicates.concat(
            runDuplicates.filter((data) => !oldDuplicates.some((oldData) => oldData.auction_id === data.auction_id))
          );          
          lastPage = currentPage;
          currentPage++;
          console.log('Current duplicates length: ' + currentRunDuplicates.length);
          url = url.replace(`frame4_item=${lastPage}`, `frame4_item=${currentPage}`);
          await this.mainPage.goto(url, { waitUntil: 'networkidle2' });
        }
        await browser.close();
        const newDuplicates = oldAuctionData.concat(currentRunDuplicates.filter((data) => !oldAuctionData.includes(data)));
            try {
                await fsPromises.writeFile(`Temp/${newFileName}`, '[]');
                await fsPromises.writeFile(`Temp/${storageFileName}`, JSON.stringify(newDuplicates));
                await fsPromises.writeFile(`Temp/${newFileName}`, JSON.stringify(currentRunDuplicates));
                console.log(chalk.green("✅ Correctly created ", newFileName));
                console.log(chalk.green("✅ Correctly compiled ", storageFileName));
                return {newFileLenght : currentRunDuplicates.length, storageLenght: newDuplicates.length}
            } catch (err) {
                console.log(err);
                return 0;
            }
      }

      async deleteExpiredElements() {
        let storageFileName;
        switch (this.config.location) {
          case "Liguria":
            storageFileName = "liguria_storage.json"
            break;
          case "Piemonte":
            storageFileName = "piemonte_storage.json";
            break;
          case "Lombardia":
            storageFileName = "lombardia_storage.json";
            break;
          case "Valle d'Aosta/Vallée d'Aoste":
            storageFileName = "vda_storage.json";
            break;
        }
        console.log(chalk.yellow(`🗑️ Removing expired elements from ${storageFileName}...`));
        const tempFilePath = `Temp/${storageFileName}`;
        const oldAuctionData = await this.getDuplicates(storageFileName);
        const currentDate = new Date();
        
        // Filter out expired elements
        const updatedData = oldAuctionData.filter((data) => {
          const expirationDate = new Date(data.expirationDate);
          return expirationDate >= currentDate;
        });
        
        try {
          // Write updated data back to storage.json
          await fsPromises.writeFile(tempFilePath, JSON.stringify(updatedData, null, 2));
          console.log(chalk.green(`✅ Expired elements have been removed from ${storageFileName}.`));
        } catch (err) {
          console.error(`Error writing to ${tempFilePath}:`, err);
        }
      }
}