import chalk from "chalk";
import axios from "axios";
import * as cheerio from "cheerio";
import mysql from "mysql2";
import fs from "fs/promises";
import dotenv from "dotenv";
import { ReadableStream } from "web-streams-polyfill";

global.ReadableStream = ReadableStream;
dotenv.config();

// Aggiungere una costante per il delay e il numero di pagine
const SCRAPING_DELAY = 1000;
const MAX_PAGES = 5;
const DELETE_AFTER_DAYS = 90;

export default async function scraperMoto() {
  console.log(chalk.bgGreen(" 🏁 Starting Scraper per Moto su Subito.it 🏁 "));
  const connection = await mysql.createConnection({
    host: "141.95.54.84",
    user: "luigi_tuacar",
    password: "Tuacar.2023",
    database: "tuacarDb",
  });

  // ! RECUPERO 'is_automatic' e 'nome_piattaforma' dalla tabella 'bot_status'
  let isAutomatic;
  let nomePiattaforma;
  let pages;
  try {
    const [results] = await connection.promise().query("SELECT is_automatic, nome_piattaforma, pages FROM bot_settings WHERE nome_piattaforma = 'moto_subito'");
    isAutomatic = results[0].is_automatic;
    nomePiattaforma = results[0].nome_piattaforma;
    pages = results[0].pages > MAX_PAGES ? MAX_PAGES : results[0].pages;
  } catch (error) {
    console.error(chalk.red("Errore nel recupero dell'ultimo URN:", error));
  }

  if (isAutomatic === 0) {
    console.log(chalk.bgRed(` ⛔ Lo scraping è stato disattivato, non eseguiamo lo scraping per la piattaforma ${nomePiattaforma} ⛔ `));
    try {
      const conn = await connection;
      await conn.end();
    } catch (error) {
      console.error(
        chalk.red("Errore durante la chiusura della connessione:", error)
      );
    }
    return;
  }

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

    const deleteQuery = `DELETE FROM moto_subito WHERE date_remote < ?`;
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

  // * 2. Funzione per ottenere il numero di telefono
  async function getPhone(urn_fetch) {
    try {
      const urn = `${urn_fetch}`;
      if (!urn) {
        return null;
      }
      const { data } = await axiosInstance.get(
        `https://www.subito.it/hades/v1/contacts/ads/${urn_fetch}`,
        {
          headers: {
            Accept: "application/json",
            Referer: "https://www.subito.it/",
          },
        }
      );

      const phone = data.phone_number || null;
      return phone;
    } catch (error) {
      console.error(
        chalk.yellow(
          `❌ Errore nel recupero del numero di telefono: ${error.message}`
        )
      );
      console.log(chalk.yellow(`⚠️ Ritorno numero null`));
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
      url = `https://www.subito.it/annunci-italia/vendita/moto-e-scooter/?cvs=1&advt=0%2C2`;
    } else {
      url = `https://www.subito.it/annunci-italia/vendita/moto-e-scooter/?o=${page}&cvs=1&advt=0%2C2`;
    }

    console.log(chalk.blue(`Elaborazione pagina ${page}/${pages}...`));

    try {
      const { data } = await axiosInstance.get(url);
      const $ = cheerio.load(data);
      const listItems = $("div.SmallCard-module_card__3hfzu.items__item");
      let stopScraping = false;

      const annunciPage = [];
      for (const item of listItems) {
        const titleElement = $(item).find("a.SmallCard-module_link__hOkzY");
        const href = titleElement.attr("href");
        if (!href || !titleElement.text().trim()) {
          continue;
        }

        const link = href;
        const geo_town =
          $(item).find("span.index-module_town__2H3jy").text().trim() ||
          "Avezzano";
        const subject =
          $(item)
            .find(
              "h2.index-module_sbt-text-atom__ifYVU.index-module_token-h6__syels.size-normal.index-module_weight-semibold__p5-q6.ItemTitle-module_item-title__VuKDo.SmallCard-module_item-title__1y5U3"
            )
            .text()
            .trim() || "Moto su Subito.it";
        const price =
          parseInt(
            $(item)
              .find(
                "p.index-module_price__N7M2x.SmallCard-module_price__yERv7.index-module_small__4SyUf"
              )
              .text()
              .trim()
              .replace(/[^\d]/g, "")
          ) || 1;

        const mileage_scalar =
          $(item)
            .find(
              "div.index-module_container__uSw-h.index-module_inline__cRSy4.index-module_grid-columns-3__OK1i4 > p:nth-child(3)"
            )
            .text()
            .trim()
            .replace(/[^\d]/g, "")
            .replace(/Km/g, "")
            .replace(/\s+/g, "") || "1";
        const vehicle_status =
          $(item)
            .find(
              "div.index-module_container__uSw-h.index-module_inline__cRSy4.index-module_grid-columns-3__OK1i4 > p:nth-child(1)"
            )
            .text()
            .trim() || "Usato";
        const register_date =
          $(item)
            .find(
              "div.index-module_container__uSw-h.index-module_inline__cRSy4.index-module_grid-columns-3__OK1i4 > p:nth-child(2)"
            )
            .text()
            .trim() || "01/1900";
        const register_year = register_date.split("/")[1] || "1900";
      // * 4. GRAB DETTAGLI ANNUNCIO
        try {
          const { data: detailData } = await axiosInstance.get(link);
          const $detail = cheerio.load(detailData);
          const urn = $detail("script#__NEXT_DATA__")
            .text()
            .match(/(id:ad:\d+:list:\d+)/)[1];
      // * 5. Controllo se l'annuncio è già presente nel database
           try {
               const [results] = await connection
                 .promise()
                 .query("SELECT id FROM moto_subito WHERE urn = ?", [urn]);
                 
               if (results.length > 0) {
                 continue;
               }
             } catch (error) {
               console.error(chalk.red(`Errore nel controllo URN nel database: ${error.message}`));
             }

          const annuncio = {
            urn: urn,
            subject: subject,
            body: "",
            pollution: null,
            fuel: "Benzina",
            vehicle_status: vehicle_status,
            price: price,
            mileage_scalar: mileage_scalar,
            doors: null,
            register_date: $detail(
              "ul.feature-list_feature-list__jdU2M li:has(span:contains('Immatricolazione')) span:nth-child(2)"
            )
              .text()
              .trim() || "01/1900",
            register_year:
              $detail(
                "ul.feature-list_feature-list__jdU2M li:has(span:contains('Immatricolazione')) span:nth-child(2)"
              )
                .text()
                .trim()
                .split("/")
                .pop() || "1900",
            geo_region:
              $detail(
                "ol.index-module_container__rA-Ps > li:nth-child(3) > a > span"
              )
                .text()
                .trim() || "Abbruzzo",
            geo_provincia:
              $detail(
                "ol.index-module_container__rA-Ps > li:nth-child(4) > a > span"
              )
                .text()
                .trim()
                .replace(" (Prov)", "") || "Abbruzzo",
            geo_town: geo_town,
            url: link,
            advertiser_name:
              $detail("h6.UserName_name__ZmLy8").first().text().trim() ||
              "Subito.it",
            advertiser_phone: await getPhone(urn),
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
            `INSERT INTO moto_subito (
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
    } catch (error) {
      console.error(
        chalk.red("Errore durante il salvataggio nel database:", error)
      );
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

  // * 8. Salviamo gli annunci in un file JSON
  try {
    await fs.writeFile(
      "log/annunci-moto_subito.json",
      JSON.stringify(annunci, null, 2)
    );
    console.log(chalk.green(" ✅ File JSON creato con successo! "));
  } catch (error) {
    console.error(chalk.red("Errore durante il salvataggio del file:", error));
  }

  return true;
}

scraperMoto();
