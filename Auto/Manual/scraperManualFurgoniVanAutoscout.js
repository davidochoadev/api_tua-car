import chalk from "chalk";
import axios from "axios";
import * as cheerio from "cheerio";
import mysql from "mysql2";
import dotenv from "dotenv";
import { ReadableStream } from "web-streams-polyfill";

global.ReadableStream = ReadableStream;
dotenv.config();

// ? COSTANTI SCRIPT
const SCRAPING_DELAY = 1000;
const MAX_PAGES = 5;
const DELETE_AFTER_DAYS = 90;

export default async function scraperManualFurgoniVanAutoscout(number_of_pages) {
  if(number_of_pages > MAX_PAGES) {
    number_of_pages = MAX_PAGES;
  }

  console.log(
    chalk.bgGreen(" 🏁 Starting Scraper per Furgoni e Van su AutoScout24 🏁 ")
  );
  const connection = await mysql.createConnection({
    host: "141.95.54.84",
    user: "luigi_tuacar",
    password: "Tuacar.2023",
    database: "tuacarDb",
  });

  // * 1. Elimina i record vecchi (90 giorni)
  try {
    const deleteIntervalDate = new Date();
    deleteIntervalDate.setDate(
      deleteIntervalDate.getDate() - DELETE_AFTER_DAYS
    );
    const formattedDate = deleteIntervalDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const deleteQuery = `DELETE FROM furgoni_van_autoscout WHERE date_remote < ?`;
    const [results] = await connection
      .promise()
      .query(deleteQuery, [formattedDate]);
    console.log(
      chalk.green(`🗑️ Eliminati ${results.affectedRows} record vecchi`)
    );
  } catch (error) {
    console.error(
      chalk.red("Errore durante l'eliminazione dei record vecchi:", error)
    );
  }
  // * 2. Funzione per ottenere la locazione di un posto tramite cap
  async function getLocation(cap) {
    try {
      // Prima proviamo con il CAP esatto
      let [results] = await connection.promise().query(
        `SELECT c.comune, c.regione, p.sigla, p.provincia 
           FROM italy_cities c, italy_provincies p 
           WHERE c.cap = ? AND p.sigla = c.provincia 
           LIMIT 1`,
        [cap]
      );

      // Se non troviamo risultati, proviamo con i primi 3 numeri del CAP
      if (!results || results.length === 0) {
        const limcap = cap?.substring(0, 3);
        [results] = await connection.promise().query(
          `SELECT c.comune, c.regione, p.sigla, p.provincia 
             FROM italy_cities c 
             JOIN italy_provincies p ON p.sigla = c.provincia 
             WHERE c.cap LIKE ? 
             LIMIT 1`,
          [limcap + "%"]
        );
      }

      if (!results || results.length === 0) {
        console.log(chalk.yellow(`Nessun risultato trovato per il CAP ${cap}`));
        return null;
      }

      return {
        geo_region: results[0].regione,
        geo_provincia: results[0].provincia,
        geo_town: results[0].comune,
      };
    } catch (error) {
      console.error(
        chalk.red(
          `Errore nel recupero della località per il CAP ${cap}:`,
          error
        )
      );
      return null;
    }
  }

  const annunci = [];
  const axiosInstance = axios.create({
    timeout: 10000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  // * 3. GRAB ELEMENTI PER N PAGINE
  for (let page = 1; page <= pages; page++) {
    let url = "";
    if (page === 1) {
      url = `https://www.autoscout24.it/lst?atype=C&body=13&cy=I&damaged_listing=exclude&desc=1&powertype=kwt&sort=age&source=detailsearch&ustate=N%2CU`;
    } else {
      url = `https://www.autoscout24.it/lst?atype=C&body=13&cy=I&damaged_listing=exclude&desc=1&powertype=kwt&sort=age&source=detailsearch&ustate=N%2CU&page=${page}`;
    }

    console.log(chalk.blue(` 📄 Elaborazione pagina ${page}/${pages}...`));

    try {
      const { data } = await axiosInstance.get(url);
      const $ = cheerio.load(data);
      const listItems = $("article.cldt-summary-full-item");

      const annunciPage = [];
      for (const item of listItems) {
        const titleElement = $(item).find("a.ListItem_title__ndA4s");
        const href = "https://www.autoscout24.it" + titleElement.attr("href");
        if (!href || !titleElement.text().trim()) {
          continue;
        }

        const link = href;
        const urn = $(item).attr("id") || "unknown";
        const subject = $(item)
          .find("a.ListItem_title__ndA4s > h2 ")
          .text()
          .trim();
        const tableDetails = $(item).find(
          "div.VehicleDetailTable_container__XhfV1"
        );
        const mileage =
          tableDetails
            .find("span[data-testid='VehicleDetails-mileage_road']")
            .text()
            .trim()
            .replace(/[^\d]/g, "")
            .replace(/\./g, "") || "1";
        const register_date =
          tableDetails
            .find("span[data-testid='VehicleDetails-calendar']")
            .text()
            .trim() || "01/1900";
        const register_year = register_date.split("/")[1] || "1900";
        const price =
          parseInt(
            $(item)
              .find("p[data-testid='regular-price']")
              .text()
              .trim()
              .replace(/[^\d]/g, "")
          ) || 1;

        // * 4. GRAB DETTAGLI ANNUNCIO
        try {
          const { data: detailData } = await axiosInstance.get(link);
          const $detail = cheerio.load(detailData);
          const scriptData = $detail("#__NEXT_DATA__").text();
          const jsonData = JSON.parse(scriptData);
          const item = jsonData.props.pageProps.listingDetails;

          const cap = item.location.zip;
          const location = await getLocation(cap);

          const annuncio = {
            urn: item.id,
            subject: `${item.vehicle.make} ${
              item.vehicle.model
            } ${item.vehicle.modelVersionInput?.replace(
              item.vehicle.model,
              ""
            )}`.replace(/\s+/g, " "),
            body: "",
            pollution: item.vehicle.environmentEuDirective?.formatted || null,
            fuel: item.vehicle.fuelCategory?.formatted || null,
            vehicle_status: item.vehicle.legalCategories?.[0] || null,
            price: item.prices.public.priceRaw || 1,
            mileage_scalar: item.vehicle.mileageInKmRaw || 1,
            doors: item.vehicle.numberOfDoors || null,
            register_date: item.vehicle.firstRegistrationDate || "01/1900",
            register_year: item.vehicle.firstRegistrationDate?.slice(-4) || "1900",
            geo_region: location?.geo_region || null,
            geo_provincia: location?.geo_provincia || null,
            geo_town: item.location.city
              ? ucwords(item.location.city.toLowerCase().split("-")[0].trim())
              : null,
            url: item.webPage,
            advertiser_name: item.seller.contactName || "",
            advertiser_phone:
              item.seller.phones?.[0]?.callTo?.replace("+39", "") || null,
          };

          annunciPage.push(annuncio);
        } catch (error) {
          console.error(
            chalk.yellow(
              `Warning: Impossibile recuperare i dettagli per ${link}: ${error.message}`
            )
          );
        }
      }

      annunci.push(...annunciPage);

      // Delay tra le pagine
      await new Promise((resolve) =>
        setTimeout(resolve, SCRAPING_DELAY * (1 + Math.random()))
      );
    } catch (error) {
      console.error(
        chalk.red(
          `Errore durante il fetch della pagina ${page}:`,
          error.message
        )
      );
      continue;
    }
  }

  console.log(chalk.green(`Trovati ${annunci.length} annunci totali`));

  // * 6. Salviamo gli annunci nel database
    if (annunci.length > 0) {
    try {
      for (const annuncio of [...annunci].reverse()) {
        await new Promise((resolve, reject) => {
          connection.query(
            `INSERT INTO furgoni_van_autoscout (
                  urn, subject, body, date_remote, pollution, fuel, vehicle_status, 
                  price, mileage_scalar, doors, register_date, register_year,
                  geo_region, geo_provincia, geo_town, url, advertiser_name, advertiser_phone
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              annuncio.urn,
              annuncio.subject,
              annuncio.body,
              new Date(
                new Date().toLocaleString("en-US", { timeZone: "Europe/Rome" })
              )
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
              annuncio.pollution,
              annuncio.fuel,
              annuncio.vehicle_status,
              annuncio.price,
              annuncio.mileage_scalar,
              annuncio.doors,
              annuncio.register_date,
              annuncio.register_year,
              annuncio.geo_region,
              annuncio.geo_provincia,
              annuncio.geo_town,
              annuncio.url,
              annuncio.advertiser_name,
              annuncio.advertiser_phone,
            ],
            (error, results) => {
              if (error) reject(error);
              else resolve(results);
            }
          );
        });
      }
      console.log(chalk.green(` ✅ Dati salvati nel database con successo! `));

      // * Aggiorniamo last_run in bot_settings
      const currentTimestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      await connection
        .promise()
        .query(
          "UPDATE bot_settings SET last_run = ? WHERE nome_piattaforma = 'furgoni_van_autoscout'",
          [currentTimestamp]
        );
      console.log(chalk.green(` ⏱️ Aggiornato timestamp ultimo scraping: ${currentTimestamp}` )
      );
    } catch (error) {
      console.error(
        chalk.red("Errore durante il salvataggio nel database:", error)
      );
    }
  } else {
    return {
      success: true,
      message: "Nessun annuncio trovato su autoscout24.it per furgoni e van",
      numero_di_pagine: number_of_pages,
      numero_di_annunci_trovati: 0
    }
  }

  // * 7. Chiudiamo la connessione al database
  try {
    const conn = await connection;
    await conn.end();
  } catch (error) {
    console.error(
      chalk.red("Errore durante la chiusura della connessione:", error)
    );
  }

  return {
    success: true,
    message: "Ricerca manuale effettuata con successo su autoscout24.it per furgoni e van, sono stati inseriti " + annunci.length + " annunci",
    numero_di_pagine: number_of_pages,
    numero_di_annunci_trovati: annunci.length
  }
}

// Funzione helper per capitalizzare le parole
function ucwords(str) {
  return str.replace(/\b\w/g, (l) => l.toUpperCase());
}
