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

/*    async search() {
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
       console.log("Writing email");
      await page.evaluate((val) => email.value = val, this.email);
      await new Promise(r => setTimeout(r, 2000));
      // fill password form value and wait 1s
       console.log("Writing password");
      await page.evaluate((val) => pass.value = val, this.password);
      await new Promise(r => setTimeout(r, 2000));
      //send filled form and process the login
      await page.evaluate(selector => document.querySelector(selector).click(), 'input[value="Log In"],#loginbutton');
      await page.waitForNavigation({waitUntil: 'networkidle2'});
      console.log(chalk.bgGreen("Login Completed!"));
      //Go to marketplace with custom location to find cars;
      await page.goto(`https://www.facebook.com/marketplace/${this.location}/cars/`, { waitUntil: 'networkidle2' });
      console.log(`Searching on ${this.location}!`);
      await page.waitForSelector('div[aria-label="Raccolta di articoli di Marketplace"]');
      const card_div_path = '/html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[5]/div/div[2]/div';
      console.log('Page downloaded');
      const cars = await page.$x(card_div_path);
      const carData = []
      for (let car of cars) {
         // Prendiamo le informazioni dell'annuncio
         var currentCar = {}
         try{
              const urn = (await car?.$eval('a', el => el?.href)).split("/")[5];
              const available = await service.findUrnByUrn(urn);
              if (available === null) {
              console.log(chalk.green("New Item Found!"));
              // Grabba i dati necessari
              currentCar["urn"] = (await car?.$eval('a', el => el?.href)).split("/")[5];
              currentCar["url"] = await car?.$eval('a', el => el?.href);
              //const userData = await this.getContacts(currentCar.url, browser);
              //currentCar["advertiser_name"] = userData.user_name
              //currentCar["advertiser_phone"] = userData.user_id
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
    } */

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
    console.log(chalk.bgCyan("Starting UserData Collection from results!"));
    let tempFileName = `fb_${this.location}_completed_result.json`;  
    const dataSearch = await this.getDatasFromTempResults(this.location);
    const browser = await puppeteer.launch({ headless: !this.debugMode
     });
    this.page = await browser.newPage();
    const page = this.page;
    await page.setExtraHTTPHeaders({
    'X-Requested-With': 'XMLHttpRequest'
  });
    const client = await page.target().createCDPSession();
    const context = browser.defaultBrowserContext();
    context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
    await page.goto('https://www.facebook.com/marketplace/category/cars', { waitUntil: 'networkidle2' });
    const cookieButton = await page.$x('/html/body/div[3]/div[2]/div/div/div/div/div[4]/button[1]')
    cookieButton[0]?.click();
    await page.waitForSelector('#email');
    await page.evaluate(() =>document.querySelector('button[type="Submit"]')&&[...document.querySelectorAll('button[type="Submit"]')].at(-1).click());
    // fill e-mail form value and wait 1s
    console.log("Writing email");
    await page.evaluate((val) => email.value = val, this.email);
    await new Promise(r => setTimeout(r, 2000));
    /* await page.screenshot({ path: './Screens/email.png' }); */
    // fill password form value and wait 1s
    console.log("Writing password");
    await page.evaluate((val) => pass.value = val, this.password);
    await new Promise(r => setTimeout(r, 2000));
    /* await page.screenshot({ path: './Screens/password.png' }); */
    //send filled form and process the login
    await page.evaluate(selector => document.querySelector(selector).click(), 'input[value="Log In"],#loginbutton');
    console.log(chalk.bgGreen("Login Success!"));
    await page.waitForNavigation({waitUntil: 'networkidle2'});
    for (let car of dataSearch) {
      try {
        await new Promise(r => setTimeout(r, 1000));
        const userPage = await browser.newPage();
        await this.extractUserData(userPage, car);
      } catch (err) {
        try {
          await new Promise(r => setTimeout(r, 1000));
          const userPage = await browser.newPage();
          await this.extractUserData(userPage, car);
        } catch (err) {
          console.log("Failed to evaluate data:", err);
        }
      }
    }    
    await browser.close();
    try {
      console.log(chalk.yellow("Starting creation of result complete json!"));
      await fsPromises.writeFile(`Temp/${tempFileName}`, '[]');
      await fsPromises.writeFile(`Temp/${tempFileName}`, JSON.stringify(dataSearch));
      console.log(chalk.green(`✅ Correctly created ${tempFileName}, search length is: ${dataSearch.length}`));
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

  async extractUserData(userPage, car) {
    console.log(chalk.bgGreen("Open New Browser Page to get User Data..."));
    await userPage.goto(car.url, { waitUntil: 'networkidle2', timeout: 60000 });
    try {
      const userCookieButton = await userPage.$x('//*[@id="facebook"]/body/div[2]/div[1]/div/div[2]/div/div/div/div[2]/div/div[1]/div[2]/div/div[1]/div/span/span');
      userCookieButton[0].click();
    } catch (err) {
    }
    try {
      const elHandler = await userPage.$x('/html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div/div/div/div[2]/div/div[2]/div/div[1]/div[1]/div[7]/div/div[2]/div[1]/div/div/div/div/div[2]/div/div/div/div/span/span/div/div/a');
      let user_name = await userPage.evaluate(el => el.textContent, elHandler[0]);
      let user_id = (await userPage.evaluate(el => el.href, elHandler[0])).split("/")[5];
      car.advertiser_name = user_name;
      car.advertiser_phone = user_id;
    } catch (err) {
      console.log(chalk.bgRed("⚠️ User Not Available, Maybe the URL was removed!"));
      car.advertiser_name = "Non Disponibile";
      car.advertiser_phone = "Non Disponibile";
    }
    if (!userPage.isClosed()) {
      console.log(chalk.bgYellow("Closing URL of Announcement..."));
      await userPage.close();
    }
  }
  
  async search() {
    let tempFileName = `fb_${this.location}_result.json`;  
    console.log(chalk.yellow("🔍 Starting Search on Facebook!"));
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
    await page.setViewport({ width: 1600, height: 1000 });
    context.overridePermissions("https://www.facebook.com", ["geolocation", "notifications"]);
    //Go to marketplace with custom location to find cars;
    await this.login(page);
    await page.goto(`https://www.facebook.com/marketplace/${this.location}/cars/`, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: './Screens/first_page_after_login_marketplace.png' });
/*     const cookieButton = await page.$x('/html/body/div[2]/div[1]/div/div[2]/div/div/div/div[2]/div/div[2]/div[1]/div')
    cookieButton[0]?.click(); */
    /* await page.screenshot({ path: './Screens/on_location.png' }); */
    console.log(`Searching on ${this.location}!`);
    await page.waitForSelector('div[aria-label="Raccolta di articoli di Marketplace"]');
    await page.screenshot({ path: './Screens/wait_for_selector.png' });
    /* await page.screenshot({ path: './Screens/wait_for_path.png' }); */
    const card_div_path = '/html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[5]/div/div[2]/div';
    console.log('Page downloaded');
    //const positionBtn = await page.$x('/html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[5]/div[1]/div');
/*     const elementHandle = positionBtn[0];
    const elementText = await page.evaluate(el => el.textContent, elementHandle);
    console.log(elementText); */
    //positionBtn[0]?.click();
    //await new Promise(r => setTimeout(r, 1000));
    //const range = await page.$x('/html/body/div[1]/div/div[1]/div/div[4]/div/div/div[1]/div/div[2]/div/div/div/div[3]/div/div[1]/div[3]/div/div/label/div/div[1]/div/div');
    //range[0]?.click();
    /* await page.keyboard.type('500', {delay: 500}); */
    //await page.keyboard.type('500', {delay: 500});
    //await new Promise(r => setTimeout(r, 1000));
    //await page.screenshot({ path: './Screens/test_5.png' });
    //const viewport = await page.viewport();
    //const centerX = viewport.width / 2;
    //const centerY = 820;
    // Esegui un clic del mouse su 500km
    //await page.mouse.click(centerX, centerY);
    //const submitPositionBtn = await page.$x('/html/body/div[1]/div/div[1]/div/div[4]/div/div/div[1]/div/div[2]/div/div/div/div[4]/div/div[2]/div/div/div/div/div');
    //submitPositionBtn[0]?.click();
    await new Promise(r => setTimeout(r, 1000));
    const card_div_path2 = '/html/body/div[1]/div/div[1]/div/div[3]/div/div/div/div[1]/div[1]/div[2]/div/div/div[6]/div/div[2]/div';
    await page.screenshot({ path: './Screens/position_before_scroll.png' });
    var count = 0/* parseInt(this.scrollCount) */;
    while( count > 0){
/*        await this.page.evaluate(() => {
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
            }); */
          await this.autoScroll();
/*           await page.waitForNetworkIdle({ timeout: 60000 }); */
          console.log(`Scroll number: ${this.scrollCount - count}`)
          count--
      }
    const cars = await page.$x(card_div_path);
    await page.screenshot({ path: './Screens/position_after_scroll.png' });
    console.log(cars);
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
            //const userData = await this.getContacts(currentCar.url, browser);
            //currentCar["advertiser_name"] = userData.user_name
            //currentCar["advertiser_phone"] = userData.user_id
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

  async login(page) {
    console.log(chalk.bgYellow("👤 Trying to login"));
    await page.goto("https://www.facebook.com/login", { waitUntil: 'networkidle2' });
    await page.screenshot({ path: `./Screens/first_login_page.png` });
    console.log(chalk.yellow("Authentication in progress..."))
    await new Promise(r => setTimeout(r, 500));
    const cookieButton = await page.$x('/html/body/div[3]/div[2]/div/div/div/div/div[4]/button[2]')
    cookieButton[0]?.click();
    await page.waitForSelector('#email');
    await new Promise(r => setTimeout(r, 500));
    // fill e-mail form value and wait 1s
    console.log("Writing email");
    await page.evaluate((val) => email.value = val, this.email);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: './Screens/type_of_email.png' });
    // fill password form value and wait 1s
    console.log("Writing password");
    await page.evaluate((val) => pass.value = val, this.password);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: './Screens/type_of_psw.png' });
    await page.evaluate(selector => document.querySelector(selector).click(), 'input[value="Log In"],#loginbutton');
    await page.waitForNavigation({waitUntil: 'networkidle2'});
    await page.screenshot({ path: './Screens/login_complete_page.png' });
    console.log(chalk.bgGreen("Login Completed!"));

/*       if (!page.isClosed()) {
       console.log(chalk.bgMagenta("❌ Closing URL of Login..."));
       await page.close();
       return { login : "Login Complete!"}
    } */
 }
  
}


// x1i10hfl xjbqb8w x6umtig x1b1mbwd xaqea5y xav7gou x1ypdohk xe8uvvx xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd x16tdsg8 x1hl2dhg xggy1nq x1o1ewxj x3x9cwd x1e5q0jg x13rtm0m x87ps6o x1lku1pv x1a2a7pz x9f619 x3nfvp2 xdt5ytf xl56j7k x1n2onr6 xh8yej3