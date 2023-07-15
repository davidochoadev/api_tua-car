import fsPromises from 'fs/promises'
import puppeteer from 'puppeteer'
import { Cluster } from 'puppeteer-cluster'
import JSON2CSVParser from 'json2csv/lib/JSON2CSVParser.js'
import { region_index } from '../dataController.js'
import chalk from 'chalk';


export default class Facebook{

   constructor(debugMode=0){
       this.debugMode = debugMode
   }

   async search() {
      console.log(chalk.yellow("🔍 Starting Search on Facebook!"));
      const browser = await puppeteer.launch({ headless: !this.debugMode });
      this.page = await browser.newPage();
      const page = this.page
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
      // fill in and submit the form
      await page.evaluate((val) => email.value = val, this.email);
      await page.evaluate((val) => pass.value = val, this.password);
      await page.evaluate(selector => document.querySelector(selector).click(), 'input[value="Log In"],#loginbutton');
      await page.waitForNavigation({waitUntil: 'networkidle2'});
      await browser.close()
      return {success: "Login a buon fine!"};
    }

}