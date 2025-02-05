import chalk from "chalk";
import axios from "axios";
import * as cheerio from "cheerio";
import mysql from "mysql2";
import fs from "fs/promises";
import dotenv from "dotenv";
import { ReadableStream } from 'web-streams-polyfill';
import { SCRAPER_CONFIG } from "../config/scraperConfig.js";

global.ReadableStream = ReadableStream;
dotenv.config();

// Aggiungere una costante per il delay e il numero di pagine
const SCRAPING_DELAY = SCRAPER_CONFIG.SCRAPING_DELAY;
const MAX_PAGES = SCRAPER_CONFIG.MAX_PAGES;
const DELETE_AFTER_DAYS = SCRAPER_CONFIG.DELETE_AFTER_DAYS;

export default async function scraperManualMoto(number_of_pages) {
  //* SETTAGGIO DEL NUMERO DELLE PAGINE SE SUPERIORE A MAX_PAGES, LO SETTA A MAX_PAGES
  if (number_of_pages > MAX_PAGES) {
    number_of_pages = MAX_PAGES;
  }
  console.log(chalk.bgGreen(" 🏁 Starting Scraper per Moto.it/moto-usate 🏁 "));
  const connection = await mysql.createConnection({
    host: "141.95.54.84",
    user: "luigi_tuacar", 
    password: "Tuacar.2023",
    database: "tuacarDb",
  });

  let lastUrn;
  try {
    const [results] = await connection
      .promise()
      .query("SELECT urn FROM moto_motoit ORDER BY id DESC LIMIT 1");
    lastUrn = results[0]?.urn;
    console.log(chalk.blue(`Ultimo URN nel database: ${lastUrn}`));
  } catch (error) {
    console.error(chalk.red("Errore nel recupero dell'ultimo URN:", error));
  }

  // Elimina i record vecchi (90 giorni)
  try {
    const deleteIntervalDate = new Date();
    deleteIntervalDate.setDate(
      deleteIntervalDate.getDate() - DELETE_AFTER_DAYS
    );
    const formattedDate = deleteIntervalDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const deleteQuery = `DELETE FROM moto_motoit WHERE date_remote < ?`;
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

  // Funzione per ottenere il numero di telefono
  async function getPhone(handler) {
    try {
      if (!handler) return null;
      const response = await axiosInstance.get(
        `https://www.moto.it${handler}`,
        {
          retry: 3,
          retryDelay: 1000,
        }
      );
      const phone = response.data?.phone;
      return phone ? phone.replace("+39", "") : null;
    } catch (error) {
      console.error(
        chalk.yellow(`Warning: Errore recupero telefono: ${error.message}`)
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

  for (let page = 1; page <= number_of_pages; page++) {
    let url = "";
    if (page === 1) {
      url = `https://www.moto.it/moto-usate/ricerca?offer=S&brand=&brandacc=&model=&modelname=&version=&cat=&categoryacc=&condition_expl=&region=&province=&zipcode=&price_f=&price_t=&place=&place_rad=&longitude=&latitude=&disp_f=&disp_t=&pow_f=&pow_t=&weig_s=&weig_t=&electric=&emis_s=&strokes_s=&gear_s=&seat_s=&seat_t=&km_s=&km_t=&year_s=&year_t=&circuit=&crashed=&special=&photo=&tradein=&person=P&newtype=&abs=&unpw=&sort=1_1&sortdir=&kw=&adref=&docs=&work=&rest=&pres=&asi=`;
    } else {
      url = `https://www.moto.it/moto-usate/ricerca/${page}?offer=S&brand=&brandacc=&model=&modelname=&version=&cat=&categoryacc=&condition_expl=&region=&province=&zipcode=&price_f=&price_t=&place=&place_rad=&longitude=&latitude=&disp_f=&disp_t=&pow_f=&pow_t=&weig_s=&weig_t=&electric=&emis_s=&strokes_s=&gear_s=&seat_s=&seat_t=&km_s=&km_t=&year_s=&year_t=&circuit=&crashed=&special=&photo=&tradein=&person=P&newtype=&abs=&unpw=&sort=1_1&sortdir=&kw=&adref=&docs=&work=&rest=&pres=&asi=`;
    }

    console.log(chalk.blue(`Elaborazione pagina ${page}/20...`));

    try {
      const { data } = await axiosInstance.get(url);
      const $ = cheerio.load(data);
      const listItems = $("ul.ad-list.list > li");
      let stopScraping = false;

      const annunciPage = [];
      for (const item of listItems) {
        const titleElement = $(item).find(
          "div.app-ad-list-item > div.app-top > div.app-infos > h2.app-titles > a.app-linked-title"
        );
        const href = titleElement.attr("href");
        if (!href || !titleElement.text().trim()) {
          continue;
        }
        const currentUrn = href.split("/").pop();

        // Se troviamo lastUrn, ci fermiamo SENZA processare questo elemento
        if (currentUrn === lastUrn) {
          stopScraping = true;
          break;
        }

        const link = "https://www.moto.it" + href;
        const geo_town =
          $(item)
            .find("ul.app-specs > li:nth-child(1)")
            .text()
            .trim()
            .replace(/\s*\([^)]*\)/g, "") || "Avezzano";

        try {
          const { data: detailData } = await axiosInstance.get(link);
          const $detail = cheerio.load(detailData);

          const annuncio = {
            urn: currentUrn,
            subject: titleElement.text().trim().replace(/\s+/g, " "),
            body: "",
            pollution:
              $detail(
                "table.datagrid > tbody > tr:has(th:contains('Norma antinquinamento')) > td"
              )
                .text()
                .trim() || null,
            fuel:
              $detail(
                "table.datagrid > tbody > tr:last-child > td:nth-child(2)"
              )
                .text()
                .trim() === "Si"
                ? "Elettrica"
                : "Benzina",
            vehicle_status: "Usato",
            price:
              parseInt(
                $detail(
                  "aside.ucrecap > ul > li:nth-child(1) > div > span.value"
                )
                  .text()
                  .trim()
                  .replace(/\./g, "")
              ) || 1,
            mileage_scalar:
              $detail("aside.ucrecap > ul > li:nth-child(3) > div > span.value")
                .text()
                .trim()
                .replace(/\./g, "") || "1",
            doors: null,
            register_date:
              "01/" +
              ($detail(
                "aside.ucrecap > ul > li:nth-child(2) > div > span.value"
              )
                .text()
                .trim() || "1900"),
            register_year:
              $detail("aside.ucrecap > ul > li:nth-child(2) > div > span.value")
                .text()
                .trim() || "1900",
            geo_region:
              $detail("aside.ucrecap > ul > li:nth-child(4) > div > span.key")
                .text()
                .trim() || "Abbruzzo",
            geo_provincia:
              $detail("aside.ucrecap > ul > li:nth-child(4) > div > span.value")
                .text()
                .trim() || "L'Aquila",
            geo_town: geo_town,
            url: link,
            advertiser_name:
              $detail("div.app-row > strong:contains('Referente:')")
                .parent()
                .text()
                .trim()
                .replace("Referente:", "")
                .trim() || "Moto.it",
            advertiser_phone: await getPhone(
              $detail("div.uccalluser").attr("data-handler")
            ),
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

      if (stopScraping) {
        console.log(
          chalk.red(" ⛔ Stop scraping dopo aver raggiunto l'ultimo URN.")
        );
        break;
      }

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

  // Salviamo gli annunci nel database
  if (annunci.length > 0) {
    try {
      for (const annuncio of [...annunci].reverse()) {
        await new Promise((resolve, reject) => {
          connection.query(
            `INSERT INTO moto_motoit (
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
        .replace('T', ' ');
        
      await connection.promise().query(
        "UPDATE bot_settings SET last_run = ? WHERE nome_piattaforma = 'moto_motoit'",
        [currentTimestamp]
      );
      console.log(chalk.green(` ⏱️ Aggiornato timestamp ultimo scraping: ${currentTimestamp}`));
    } catch (error) {
      console.error(
        chalk.red("Errore durante il salvataggio nel database:", error)
      );
    }
  } else {
    return {
      success: true,
      message: "Nessun annuncio trovato su moto.it",
      numero_di_pagine: number_of_pages,
      numero_di_annunci_trovati: 0,
    }
  }

  // Chiudiamo la connessione al database
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
    message: "Ricerca manuale effettuata con successo su moto.it, sono stati inseriti " + annunci.length + " annunci",
    numero_di_pagine: number_of_pages,
    numero_di_annunci_trovati: annunci.length,
  };
}