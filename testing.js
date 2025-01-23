import db from '../config/dataBaseOptions.js'
import Search from './classes/search.js'
import fs from 'fs'
import Mailer from './classes/mailer.js'
const db_platform = {
    "platform-01": "cars_autoscout",
    "platform-02": "cars_subito",
    "platform-03": "cars_facebook",
    "platform-04": "moto_motoit"
  }

const EXPORTS_PATH = "webfiles/exports/"
const doSearch = async (req, res) =>{
    const search_params = req.body.schedule_content
    const spoki_active = req.body.setSpokiActive
    const email_list = req.body.mail_list
    const user_id = req.body.user_id
    const email = req.body.email
    await doSearchHandler(user_id, search_params, spoki_active, ((csvFile) =>{
        const leadsMailer = new Mailer("leads@tua-car.it", "Nuova ricerca effettuata")
        if(csvFile === undefined) return res.json({error: true, message: "Nessun parametro di ricerca impostato"})
        if(email){
            const mail = new Mailer(email, "Nuova ricerca effettuata")
            const search_options = Object.keys(search_params).map(platform => {
                var options = search_params[platform]
                options = {...options, platform: db_platform[platform]}
                return options
            })
            //mail.SendEmail({user: req.body.name, options: search_options, fileName: csvFile?.fileName, filePath: csvFile?.fileNamePath})
            leadsMailer.SendEmail({user: req.body.name, options: search_options, fileName: csvFile?.fileName, filePath: csvFile?.fileNamePath})
        }
        else if(email_list){
            for(var mail_index = 0; mail_index < email_list.length; mail_index++){
                const mail = new Mailer(email_list[mail_index], "Nuova ricerca effettuata")
                const search_options = Object.keys(search_params).map(platform => {
                    var options = search_params[platform]
                    options = {...options, platform: db_platform[platform]}
                    return options
                })
                // mail.SendEmail({user: req.body.name, options: search_options, fileName: csvFile?.fileName, filePath: csvFile?.fileNamePath})
                leadsMailer.SendEmail({user: req.body.name, options: search_options, fileName: csvFile?.fileName, filePath: csvFile?.fileNamePath})
            }
        }
        const msg = `E' stato creato il file ${csvFile.fileName} ${csvFile.searchCnt > 0 ? ` con un totale di ${csvFile.searchCnt}` : ". Non è stato trovato nessun nuovo risultato, prova a cambiare i parametri di ricerca"}`
        return res.json({error: false, message: msg})
    }))
}

export const doSearchHandler = async (user_id, search_params, spoki_active, callback) =>{
    const csvData = []
    var loop_counter = 0
    if(search_params !== {}){
        Object.entries(search_params).forEach(([platform, platform_params]) =>{
            const search = new Search({...platform_params, user_id : user_id})
            const search_query = search.fabricateSearchQuery()
            console.log(search_query)
            db.query(search_query, (err, results)=>{
                if(err) console.log(err)
                var duplicates_query = "select duplicates_file from searches_duplicates where user_id= ? and platform= ? "
                db.query(duplicates_query, [user_id, db_platform[platform_params.platform]] , async (err, data)=>{
                    if(err) if (typeof callback == "function") callback(err);
                    search.getDuplicates(data, db, async (duplicates) =>{
                        var flippedDuplicates = (duplicates.length > 0) ? Object.fromEntries(duplicates.map((item) => [item, true])) : {};
                        var returnData = []
                        var newDuplicates = []
                        try{
                            console.log("Results found in database: " + results.length)
                        }
                        catch(err){
                            console.log("Errore nell'impostazione dei parametri di ricerca")
                            if (typeof callback == "function") callback(undefined)
                            return 0
                        }
                        if(results.length > 0){
                            results.forEach((result) =>{
                                if (JSON.stringify(flippedDuplicates) === '{}'){
                                    console.log(result.id + "added")
                                    newDuplicates.push(result.id);
                                    returnData.push(result);
                                }
                                else{
                                    if (!flippedDuplicates[result.id]) {
                                        console.log(result.id + " added")
                                        newDuplicates.push(result.id);
                                        returnData.push(result);
                                        }
                                }
                            })
                        }
                        console.log("Results found: " + returnData.length)
                        var nw = duplicates.concat(newDuplicates);
                        await search.writeDuplicates(nw, db)
                        csvData.push(returnData);
                        // Scrittura di un JSON per visualizzare l'output di csvData
                        /*const jsonCsvData = JSON.stringify(csvData);
                        fs.writeFileSync('csvData.json', jsonCsvData, 'utf-8');*/
                        loop_counter++
                        if(loop_counter === Object.entries(search_params).length){
                            await writeCsv(csvData, search_params, db, user_id, spoki_active, (csv_file) =>{
                                if (typeof callback == "function") callback(csv_file);
                            });
                        }
                    })
                })
            })
        })
    }
}

async function writeCsv(data, searchOptions, db, user_id, spoki_active, callback) {
    searchOptions = JSON.stringify(searchOptions)
    let timeOffset = new Date().getTimezoneOffset()
    let dtNow = new Date(new Date().getTime() - (timeOffset * 60 * 1000));
    const filePath = `${EXPORTS_PATH}${user_id}`;
    const currentDate = new Date(dtNow).toJSON().slice(0,19).replace(/-/g,'/').replaceAll("/", "_").replace("Z", "_").replace("T", "_").replaceAll(":", "")
    const fileName = `${currentDate}_export.csv`;
    console.log("Writing the csv file")
    if(!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, 0o775)
    }
    const fp = fs.openSync(`${filePath}/${fileName}`, 'w');
    fs.chmodSync(`${filePath}/${fileName}`, 0o755);
  
    const headers = ["Veicolo (Marca Modello Versione)", "Trattativa", "Nominativo", "Indirizzo", "Località", "Tel", "Cel", "Mail", "WebLink", "Nota_1", "Nota_2", "Nota_3", "Nota_4", "Nota_5", "PrezzoMin", "PrezzoMax"];
    fs.writeSync(fp, headers.join(";") + "\n");
    let cnt = 0;
    let results = []
    // Suddivisione dei risultati dentro ogni platform_index
    data.forEach((platform_index) => {
        let platform;
        switch (user_id) {
            case 19:
                platform = platform_index.slice(0, Math.ceil(platform_index.length / 2));
                break;
            case 36:
                platform = platform_index.slice(Math.ceil(platform_index.length / 2));
                break;
            default:
                platform = platform_index;
                break;
        };
        platform.forEach((item) =>{
            results.push(item.id);
            cnt++;
            item.advertiser_name = item.advertiser_name || "Gentile Cliente";
            const field = [item.subject, "A", item.advertiser_name, "", item.geo_town, "", item.advertiser_phone, "", item.url, item.mileage_scalar, item.fuel, item.pollution, "", "", "", item.price];
            fs.writeSync(fp, field.join(";") + "\n");
        });
    });
    
    fs.closeSync(fp);
    var q = "insert into searches (user_id, search_filename, search_path, search_options, search_results, search_date, SpokiSchedActive, results) values( ? , ?, ?, ?, ?, ?, ?, ?)"
    try{
        await db.query(q, [user_id, fileName, `${filePath}/${fileName}`, searchOptions, cnt, (new Date(dtNow).toISOString().split('T').join(" ").replace("Z", "")).slice(0, 19), spoki_active, JSON.stringify(results)])
        const response = {
            fileName: fileName,
            fileNamePath: `${filePath}/${fileName}`,
            searchCnt: cnt
        }
        if (typeof callback == "function") callback(response);
    }
    catch(err){
        console.log(err)
    }
  
  }

export default doSearch