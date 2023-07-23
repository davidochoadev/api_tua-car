import fsPromises from 'fs/promises'
import puppeteer from 'puppeteer'
import { Cluster } from 'puppeteer-cluster'
import JSON2CSVParser from 'json2csv/lib/JSON2CSVParser.js'
import { region_index } from '../dataController.js'
import { facebookApiService } from "../../Service/facebookApiService.js";
import chalk from 'chalk';
const service = new facebookApiService();

export default class FbLogin{

   constructor( debugMode=0, email, password ){
      this.debugMode = debugMode
      this.email = email
      this.password = password
   }

   async firstLogin() {
      console.log(chalk.yellow("🔍 Starting First Login on Facebook!"));
      const browser = await puppeteer.launch({ headless: 1,
         args: [
           "--disable-setuid-sandbox",
           "--no-sandbox",
           "--single-process",
           "--no-zygote",
         ],
        });
      this.page = await browser.newPage();
      const page = this.page;
      const client = await page.target().createCDPSession();
      const context = browser.defaultBrowserContext();
      await page.setViewport({ width: 800, height: 1000 });
      context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
      //Go to marketplace with custom location to find cars;
      await page.goto('https://www.facebook.com/marketplace/category/cars', { waitUntil: 'networkidle2' });
      console.log(chalk.yellow("Authentication in progress..."))
      const cookieButton = await page.$x('/html/body/div[3]/div[2]/div/div/div/div/div[4]/button[1]')
      cookieButton[0]?.click()
      // wait for Facebook login form
      await page.waitForSelector('#email');
      // click Accept cookies button if it exist
      await page.evaluate(() =>document.querySelector('button[type="Submit"]')&&[...document.querySelectorAll('button[type="Submit"]')].at(-1).click());
      // fill e-mail form value and wait 1s
       console.log("Writing email");
      await page.evaluate((val) => email.value = val, this.email);
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: './Screens/email.png' });
      // fill password form value and wait 1s
       console.log("Writing password");
      await page.evaluate((val) => pass.value = val, this.password);
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: './Screens/psw.png' });
      //send filled form and process the login
      await page.evaluate(selector => document.querySelector(selector).click(), 'input[value="Log In"],#loginbutton');
      await page.waitForNavigation({waitUntil: 'networkidle2'});
      await page.screenshot({ path: './Screens/login_complete.png' });
      console.log(chalk.bgGreen("Login Completed!"));
      await browser.close();
      return {ok : "tutto bin!"};
   }

   async test(arrayOfLinks) {
      console.log(chalk.yellow("🔍 Starting Search of the adv on Facebook!"));
      const browser = await puppeteer.launch({ headless: 1,
         args: [
           "--disable-setuid-sandbox",
           "--no-sandbox",
           "--single-process",
           "--no-zygote",
         ],
        });
      this.page = await browser.newPage();
      const page = this.page;
      const client = await page.target().createCDPSession();
      const context = browser.defaultBrowserContext();
      await page.setViewport({ width: 800, height: 1000 });
      context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
      //Go to marketplace with custom location to find cars;
      await page.goto('https://www.facebook.com/marketplace/category/cars', { waitUntil: 'networkidle2' });
      console.log(chalk.yellow("Authentication in progress..."))
      const cookieButton = await page.$x('/html/body/div[3]/div[2]/div/div/div/div/div[4]/button[1]')
      cookieButton[0]?.click()
      // wait for Facebook login form
      await page.waitForSelector('#email');
      // click Accept cookies button if it exist
      await page.evaluate(() =>document.querySelector('button[type="Submit"]')&&[...document.querySelectorAll('button[type="Submit"]')].at(-1).click());
      // fill e-mail form value and wait 1s
       console.log("Writing email");
      await page.evaluate((val) => email.value = val, this.email);
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: './Screens/email.png' });
      // fill password form value and wait 1s
       console.log("Writing password");
      await page.evaluate((val) => pass.value = val, this.password);
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: './Screens/psw.png' });
      //send filled form and process the login
      await page.evaluate(selector => document.querySelector(selector).click(), 'input[value="Log In"],#loginbutton');
      await page.waitForNavigation({waitUntil: 'networkidle2'});
      await page.screenshot({ path: './Screens/login_complete.png' });
      console.log(chalk.bgGreen("Login Completed!"));
      for (let element of arrayOfLinks) {
         try {
            await new Promise(r => setTimeout(r, 1000));
            const advPage = await browser.newPage();
            await advPage.setViewport({ width: 800, height: 1000 });
            await this.advPageInspect(advPage, element);
         } catch (err) {
            try {
              await new Promise(r => setTimeout(r, 1000));
              const advPage = await browser.newPage();
              await this.advPageInspect(advPage, element);
            } catch (err) {
              console.log("Failed to evaluate data:", err);
            }
          }
      }
      await browser.close();
      return {ok : "tutto bin!"};
   }

   async advPageInspect(advPage, element) {
      const messagges = await this.getCurrentMessagges();
      console.log(chalk.bgGreen("Open New Browser Page to get User Data..."));
      console.log(chalk.bgCyan("Get Random Messagge:", messagges));
      await advPage.goto(element.url, { waitUntil: 'networkidle2', timeout: 60000 });
      await advPage.screenshot({ path: `./Screens/${element.urn}.png` });
      try {
         console.log("click coockie button");
         const userCookieButton = await advPage.$x('//*[@id="facebook"]/body/div[2]/div[1]/div/div[2]/div/div/div/div[2]/div/div[1]/div[2]/div/div[1]/div/span/span');
         userCookieButton[0].click();
      } catch (err) {
      }
      try {
         console.log("getting send msg")
         const textArea = advPage.$x('/html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div[2]/div/div[2]/div/div[1]/div[1]/div[2]/div/div[1]/div[2]/div/label/textarea');
         //const sendMsgButton = await advPage.$x('/html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div[2]/div/div[2]/div/div[1]/div[1]/div[2]/div/div[1]/div[3]/div/div/span/div/div/span/div');
         //sendMsgButton[0].click();
         //console.log("getting Click")
         await new Promise(r => setTimeout(r, 1000));
         await advPage.screenshot({ path: `./Screens/ok_msg_${element.urn}.png` });
      } catch (err) {
      }
      if (!advPage.isClosed()) {
         console.log(chalk.bgYellow("Closing URL of Announcement..."));
         await advPage.close();
       }
   }

   async getCurrentMessagges() {
      const date = new Date();
      const currentHour = date.getHours();
      let timeOfDay;  
      let response;     
      if (currentHour >= 5 && currentHour < 12) {
        timeOfDay = "mattina";
      } else if (currentHour >= 12 && currentHour < 18) {
        timeOfDay = "pomeriggio";
      } else if (currentHour >= 18 && currentHour < 22) {
        timeOfDay = "sera";
      } else {
        timeOfDay = "notte";
      }

      response = await this.getResponseBasedOnTimeOfDay(timeOfDay);

      return response;
   }

   async getResponseBasedOnTimeOfDay(timeOfDay) {
      let arrayOfResponse;
    
      switch (timeOfDay) {
        case "mattina":
          arrayOfResponse = [
            "Buongiorno! Mi scuso per la mia curiosità, ma è ancora disponibile?",
            "Ciao, spero di non disturbarti troppo presto. Potresti confermarmi se l'annuncio è ancora valido?",
            "Buongiorno! Sarei interessato a saperne di più sull'annuncio che ha inserito.",
            "Salve, ho notato l'annuncio che ha inserito e volevo verificare se fosse ancora disponibile.",
            "Buongiorno! L'annuncio sembra essere quella che sto cercando. È ancora disponibile?",
          ];
          break;
        case "pomeriggio":
          arrayOfResponse = [
            "Buon pomeriggio! Volevo gentilmente chiedere se l'annuncio fosse ancora disponibile.",
            "Salve, spero che la giornata stia procedendo bene. L'annuncio è ancora valido?",
            "Buon pomeriggio! Sono interessato all'auto, ma vorrei sapere se è ancora disponibile.",
            "Ciao, ho visto l'annuncio e sarei interessato. Vi è ancora disponibilità?",
            "Buon pomeriggio! Vorrei saperne di più sull'annuncio, è ancora disponibile?",
          ];
          break;
        case "sera":
          arrayOfResponse = [
            "Buonasera! Perdonami il disturbo a quest'ora tarda. L'annuncio è ancora valido?",
            "Salve, prima di tutto spero che tu stia trascorrendo una buona serata. Mi piacerebbe sapere se l'annuncio è ancora valido.",
            "Buonasera! Sono molto interessato all'annuncio che ha postato. Potrebbe dirmi se è ancora disponibile?",
            "Ciao, ho notato l'annuncio e vorrei verificare se vi è ancora disponibilità.",
            "Buonasera! Sarei interessato all'annuncio, ma vorrei confermare che sia ancora disponibile.",
          ];
          break;
        default:
          arrayOfResponse = [
            "Notte! Perdona il disturbo. Capisco se non puoi rispondere ora. Vorrei solo confermare se l'annuncio è ancora disponibile.",
            "Salve, ti scrivo a quest'ora tarda, ma vorrei sapere se l'annuncio è ancora valido.",
            "Buonanotte! Se non ti disturbo troppo, potresti gentilmente dirmi se è ancora disponibile?",
            "Ciao, ho visto l'annuncio e mi chiedevo se fosse ancora disponibile.",
            "Buona notte! Sono molto interessato all'annuncio, perdona l'orario. Potresti confermare che è ancora disponibile?",
          ];
      }
    
      // Restituisci una delle risposte casualmente
      const randomResponse = arrayOfResponse[Math.floor(Math.random() * arrayOfResponse.length)];
      return randomResponse;
    }
}