import fsPromises from 'fs/promises'
import puppeteer from 'puppeteer'
import { Cluster } from 'puppeteer-cluster'
import JSON2CSVParser from 'json2csv/lib/JSON2CSVParser.js'
import { region_index } from '../dataController.js'
import { facebookApiService } from "../../Service/facebookApiService.js";
import chalk from 'chalk';
const service = new facebookApiService();

export default class Facebook{

   constructor(debugMode=0,scrollCount, email, password, location){
      this.debugMode = debugMode
      this.scrollCount = scrollCount
      this.email = email
      this.password = password
      this.location = location
   }

   async search() {
      let tempFileName = `fb_${this.location}_result.json`;  
      console.log(chalk.yellow("🔍 Starting Search on Facebook!"));
      const browser = await puppeteer.launch({ headless: !this.debugMode });
      this.page = await browser.newPage();
      const page = this.page;
      const client = await page.target().createCDPSession();
      const context = browser.defaultBrowserContext();
      context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
      await page.goto('https://www.facebook.com/marketplace/category/cars', { waitUntil: 'networkidle2' });
      console.log(chalk.yellow("Authentication in progress..."))
      const cookieButton = await page.$x('/html/body/div[3]/div[2]/div/div/div/div/div[4]/button[1]')
      cookieButton[0]?.click()
      // wait for Facebook login form
      await page.waitForSelector('#email');
      // click Accept cookies button if it exist
      await page.evaluate(() =>document.querySelector('button[type="Submit"]')&&[...document.querySelectorAll('button[type="Submit"]')].at(-1).click());
      // fill e-mail form value and wait 1s
      await page.evaluate((val) => email.value = val, this.email);
      await new Promise(r => setTimeout(r, 10000));
      /* await page.screenshot({ path: './Screens/email.png' }); */
      // fill password form value and wait 1s
      await page.evaluate((val) => pass.value = val, this.password);
      await new Promise(r => setTimeout(r, 10000));
      /* await page.screenshot({ path: './Screens/password.png' }); */
      //send filled form and process the login
      await page.evaluate(selector => document.querySelector(selector).click(), 'input[value="Log In"],#loginbutton');
      await page.waitForNavigation({waitUntil: 'networkidle2'});
      /* await page.screenshot({ path: './Screens/login_completed.png' }); */
      console.log(chalk.bgGreen("Login Completed!"));
      //Go to marketplace with custom location to find cars;
      await page.goto(`https://www.facebook.com/marketplace/${this.location}/cars/`, { waitUntil: 'networkidle2' });
      /* await page.screenshot({ path: './Screens/on_location.png' }); */
      console.log(`Searching on ${this.location}!`);
      await page.waitForSelector('div[aria-label="Raccolta di articoli di Marketplace"]');
      /* await page.screenshot({ path: './Screens/wait_for_path.png' }); */
      const card_div_path = '/html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[5]/div/div[2]/div';
      console.log('Page downloaded');
/*       var count = parseInt(this.scrollCount);
      while( count > 0){
            console.log("Count > 0 :", count);
         await this.page.evaluate(() => {
            return new Promise((resolve, reject) => {
                  var totalHeight = 0;
                  var distance = window.innerHeight;
                  var timer = setInterval(() => {
                    var scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
            
                    if (totalHeight >= scrollHeight) {
                      clearInterval(timer);
                      resolve();
                    }
                  }, 100);
                });
              });
            await this.autoScroll();
            await page.waitForNetworkIdle({ timeout: 60000 });
            console.log(`Scroll number: ${this.scrollCount - count}`)
            count--
        } */
      const cars = await page.$x(card_div_path);
      const carData = []
      for (let car of cars) {
         // Prendiamo le informazioni dell'annuncio
         var currentCar = {}
         try{
              const urn = (await car?.$eval('a', el => el?.href)).split("/")[5];
              const available = await service.findUrnByUrn(urn);
              /* !duplicates.includes(urn) */
              if (available === null) {
              console.log(chalk.green("New Item Found!"));
              // Grabba i dati necessari
              currentCar["urn"] = (await car?.$eval('a', el => el?.href)).split("/")[5];
              currentCar["url"] = await car?.$eval('a', el => el?.href);
/*               const userData = await this.getContacts(currentCar.url, browser);
              currentCar["advertiser_name"] = userData.user_name
              currentCar["advertiser_phone"] = userData.user_id */
              currentCar["price"] = (await car?.$eval('a', el => el?.children[0]?.children[1]?.children[0]?.textContent.replaceAll("€",'').replaceAll(".", ""))).trimStart().replace(" ", "-")
              currentCar["register_year"] = await car?.$eval('a', el => el?.children[0]?.children[1]?.children[1]?.textContent.slice(0,4))
              currentCar["subject"] = await car?.$eval('a', el => el?.children[0]?.children[1]?.children[1]?.textContent.slice(4).replace(" ", ""))
              currentCar["geo_town"] = (await car?.$eval('a', el => el?.children[0]?.children[1]?.children[2]?.textContent)).trim().split(",")[0].trim()
              currentCar["geo_region"] = (await car?.$eval('a', el => el?.children[0]?.children[1]?.children[2]?.textContent)).trim().split(",")[1].trim()
              currentCar["mileage_scalar"] = (await car?.$eval('a', el => el?.children[0]?.children[1]?.children[3]?.textContent)).trim().replaceAll("km", "").replaceAll(".", "").trim()
              carData.push(currentCar);
              } else {
                console.log(chalk.bgRed("Already Present in the Database"));
              }
            }
            catch(err){
            }
        }
        await browser.close();
        try {
          await fsPromises.writeFile(`Temp/${tempFileName}`, '[]');
          await fsPromises.writeFile(`Temp/${tempFileName}`, JSON.stringify(carData));
          console.log(chalk.green("✅ Correctly created ", tempFileName));
          return {success: `✅ Correctly created ${tempFileName}, search length is: ${carData.length}`}
        } catch (err) {
          return {error: 'Error on writing tempFileName :', err }
        }
    }

    autoScroll = async () => {
      await this.page.evaluate(async () => {
          await new Promise((resolve, reject) => {
              var totalHeight = 0
              var distance = window.innerHeight
              var timer = setInterval(() => {
                  var scrollHeight = document.body.scrollHeight
                  window.scrollBy(0, distance)
                  totalHeight += distance
  
                  if(totalHeight => scrollHeight){
                      clearInterval(timer)
                      resolve()
                  }
              }, 100)
          })
      })
  }

    getContacts = async (link, browser) => {
    const page = await browser.newPage()
    await page.goto(link, { waitUntil: 'networkidle2' });
    try{
        const cookieButton = await page.$x('//*[@id="facebook"]/body/div[2]/div[1]/div/div[2]/div/div/div/div[2]/div/div[1]/div[2]/div/div[1]/div/span/span')
        cookieButton[0].click()
    }
    catch(err){
    }
    const elHandler = await page.$x('/html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div[2]/div/div[2]/div/div[1]/div[1]/div[7]/div/div[2]/div[1]/div/div/div/div/div[2]/div/div/div/div/span/span/div/div/a')
    let user_name = await page.evaluate(el => el.textContent, elHandler[0]);
    let user_id = (await page.evaluate(el => el.href, elHandler[0])).split("/")[5];
    page.close()
    return {user_id, user_name}
  }

  async clusterUserDataCollection() {
    let tempFileName = `fb_${this.location}_completed_result.json`;  
    const dataSearch = await this.getDatasFromTempResults(this.location);
    const browser = await puppeteer.launch({ headless: !this.debugMode });
    this.page = await browser.newPage();
    const page = this.page;
    const context = browser.defaultBrowserContext();
    context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
    await page.goto('https://www.facebook.com/marketplace/category/cars', { waitUntil: 'networkidle2' });
    const cookieButton = await page.$x('/html/body/div[3]/div[2]/div/div/div/div/div[4]/button[1]')
    cookieButton[0]?.click();
    await page.waitForSelector('#email');
    await page.evaluate(() =>document.querySelector('button[type="Submit"]')&&[...document.querySelectorAll('button[type="Submit"]')].at(-1).click());
    // fill e-mail form value and wait 1s
    await page.evaluate((val) => email.value = val, this.email);
    await new Promise(r => setTimeout(r, 10000));
    /* await page.screenshot({ path: './Screens/email.png' }); */
    // fill password form value and wait 1s
    await page.evaluate((val) => pass.value = val, this.password);
    await new Promise(r => setTimeout(r, 10000));
    /* await page.screenshot({ path: './Screens/password.png' }); */
    //send filled form and process the login
    await page.evaluate(selector => document.querySelector(selector).click(), 'input[value="Log In"],#loginbutton');
    await page.waitForNavigation({waitUntil: 'networkidle2'});
    for (let car of dataSearch) {
      const page = await browser.newPage();
      await page.goto(car.url, { waitUntil : 'networkidle2'});
      try{
        const cookieButton = await page.$x('//*[@id="facebook"]/body/div[2]/div[1]/div/div[2]/div/div/div/div[2]/div/div[1]/div[2]/div/div[1]/div/span/span')
        cookieButton[0].click()
      }
      catch(err){
      }
      const elHandler = await page.$x('/html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div[2]/div/div[2]/div/div[1]/div[1]/div[7]/div/div[2]/div[1]/div/div/div/div/div[2]/div/div/div/div/span/span/div/div/a')
      let user_name = await page.evaluate(el => el.textContent, elHandler[0]);
      let user_id = (await page.evaluate(el => el.href, elHandler[0])).split("/")[5];
      car.advertiser_name = user_name;
      car.advertiser_phone = user_id;
      }
    await browser.close();
    try {
      await fsPromises.writeFile(`Temp/${tempFileName}`, '[]');
      await fsPromises.writeFile(`Temp/${tempFileName}`, JSON.stringify(dataSearch));
      console.log(chalk.green("✅ Correctly created ", tempFileName));
      return {success: `✅ Correctly created ${tempFileName}, search length is: ${dataSearch.length}`}
    } catch (err) {
      return {error: 'Error on writing tempFileName :', err }
    }
  }

  async getDatasFromTempResults(location) {
    try {
      const res = await fsPromises.readFile(`Temp/fb_${location}_result.json`, { encoding: "utf-8"});
      const parsedData = JSON.parse(res);
      return parsedData;
    } catch (err) {
      return [];
    }
  }



}