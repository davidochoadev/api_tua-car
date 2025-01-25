import scraperManualMoto from "../Auto/Manual/scraperManualMoto.js";
import scraperManualMotoSubito from "../Auto/Manual/scraperManualMotoSubito.js";
import scraperManualCaravanCamperSubito from "../Auto/Manual/scraperManualCaravanCamperSubito.js";
import scraperManualVeicoliCommercialiSubito from "../Auto/Manual/scraperManualVeicoliCommercialiSubito.js";
import scraperManualFurgoniVanAutoscout from "../Auto/Manual/scraperManualFurgoniVanAutoscout.js";
import mysql from "mysql2";

export class botApiService {
  // * RICERCA MANUALE SU MOTO.IT
  async ricercaManualeMotoIt(platform, number_of_pages) {
    try {
      if (platform !== "platform-04") {
        throw new Error("Platform non supportata");
      }

      if (!number_of_pages || number_of_pages < 1) {
        throw new Error("Numero di pagine non valido");
      }

      const risultato = await scraperManualMoto(number_of_pages);
      return risultato;
    } catch (error) {
      console.error("Errore durante la ricerca manuale:", error.message);
      return {
        success: false,
        message: error.message,
        numero_di_pagine: 0,
        numero_di_annunci_trovati: 0,
      };
    }
  }

  // * RICERCA MANUALE MOTO SU SUBITO.IT
  async ricercaManualeMotoSubito(platform, number_of_pages) {
   try {
      if (platform !== "platform-05") {
        throw new Error("Platform non supportata");
      }

      if (!number_of_pages || number_of_pages < 1) {
        throw new Error("Numero di pagine non valido");
      }

      const risultato = await scraperManualMotoSubito(number_of_pages);
      return risultato;
    } catch (error) {
      console.error("Errore durante la ricerca manuale:", error.message);
      return {
        success: false,
        message: error.message,
        numero_di_pagine: 0,
        numero_di_annunci_trovati: 0,
      };
    }
  }

  // * RICERCA MANUALE CARAVAN E CAMPER SU SUBITO.IT
  async ricercaManualeCaravanCamperSubito(platform, number_of_pages) {
    try {
      if (platform !== "platform-06") {
        throw new Error("Platform non supportata");
      }

      if (!number_of_pages || number_of_pages < 1) {
        throw new Error("Numero di pagine non valido");
      }

      const risultato = await scraperManualCaravanCamperSubito(number_of_pages);
      return risultato;
    } catch (error) {
      console.error("Errore durante la ricerca manuale:", error.message);
      return {
        success: false,
        message: error.message,
        numero_di_pagine: 0,
        numero_di_annunci_trovati: 0,
      };
    }
  }

  // * RICERCA MANUALE VEICOLI COMMERCIALI SU SUBITO.IT
  async ricercaManualeVeicoliCommercialiSubito(platform, number_of_pages) {
    try {
      if (platform !== "platform-07") {
        throw new Error("Platform non supportata");
      }

      if (!number_of_pages || number_of_pages < 1) {
        throw new Error("Numero di pagine non valido");
      }

      const risultato = await scraperManualVeicoliCommercialiSubito(number_of_pages);
      return risultato;
    } catch (error) {
      console.error("Errore durante la ricerca manuale:", error.message);
      return {
        success: false,
        message: error.message,
        numero_di_pagine: 0,
        numero_di_annunci_trovati: 0,
      };
    }
  }

  // * RICERCA MANUALE FURGONI E VAN SU AUTO SCUOT
  async ricercaManualeFurgoniVanAutoscout(platform, number_of_pages) {
    try {
      if (platform !== "platform-08") {
        throw new Error("Platform non supportata");
      }

      if (!number_of_pages || number_of_pages < 1) {
        throw new Error("Numero di pagine non valido");
      }

      const risultato = await scraperManualFurgoniVanAutoscout(number_of_pages);
      return risultato;
    } catch (error) {
      console.error("Errore durante la ricerca manuale:", error.message);
      return {
        success: false,
        message: error.message,
        numero_di_pagine: 0,
        numero_di_annunci_trovati: 0,
      };
    }
  }

  // * UPDATE LAST EXECUTION
  async updateLastExecution(platform) {
    let connection;
    try {
      if (!platform) {
        throw new Error("Platform non specificata");
      }

      connection = await mysql.createConnection({
        host: "141.95.54.84",
        user: "luigi_tuacar",
        password: "Tuacar.2023",
        database: "tuacarDb",
      });

      const [results] = await connection
        .promise()
        .query(
          "UPDATE bot_settings SET last_run = NOW() WHERE platform_number = ?",
          [platform]
        );

      if (results.affectedRows === 0) {
        throw new Error(
          `Nessuna piattaforma trovata con il numero: ${platform}`
        );
      }

      return {
        success: true,
        message: "Modifica al last_run effettuata con successo",
        affectedRows: results.affectedRows,
      };
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error.message);
      return {
        success: false,
        message: error.message,
      };
    } finally {
      try {
        const conn = await connection;
        await conn.end();
      } catch (error) {
        console.error(
          chalk.red("Errore durante la chiusura della connessione:", error)
        );
      }
    }
  }

  // * UPDATE STATUS RICERCA AUTOMATICA
  async updateStatusRicercaAutomatica(platform, status) {
   let connection;
   try {
    if (!platform) {
      throw new Error("Platform non specificata");
    }
    if (status !== 1 && status !== 0) {
      throw new Error("Status non specificato");
    }

    connection = await mysql.createConnection({
      host: "141.95.54.84",
      user: "luigi_tuacar",
      password: "Tuacar.2023",
      database: "tuacarDb",
    });

    const [results] = await connection.promise().query(
      "UPDATE bot_settings SET is_automatic = ? WHERE platform_number = ?",
      [status, platform]
    );

    if (results.affectedRows === 0) {
      throw new Error(`Nessuna piattaforma trovata con il numero: ${platform}`);
    }

    return {
      success: true,
      message: "Status aggiornato con successo",
      platform: platform,
      status: status,
      affectedRows: results.affectedRows,
    };
   } catch (error) {
    console.error("Errore durante l'aggiornamento:", error.message);
    return {
        success: false,
        message: error.message,
      };
    } finally {
      try {
        const conn = await connection;
        await conn.end();
      } catch (error) {
        console.error("Errore durante la chiusura della connessione:", error);
      }
    }
  }

  // * UPDATE STATUS PAGINE DA ANALIZZARE PER IL BOT
  async updateStatusPagineDaAnalizzare(platform, pages) {
    let connection;
    try {
      if (!platform) {
        throw new Error("Platform non specificata");
      }
      if (!pages) {
        throw new Error("Numero di pagine non specificato");
      }
      connection = await mysql.createConnection({
        host: "141.95.54.84",
        user: "luigi_tuacar",
        password: "Tuacar.2023",
        database: "tuacarDb",
      });

      const [results] = await connection.promise().query(
        "UPDATE bot_settings SET pages = ? WHERE platform_number = ?",
        [pages, platform]
      );

      if (results.affectedRows === 0) {
        throw new Error(`Nessuna piattaforma trovata con il numero: ${platform}`);
      }

      return {
        success: true,
        message: "Numero di pagine aggiornato con successo",
        platform: platform,
        pages: pages,
        affectedRows: results.affectedRows,
      };
    } catch (error) {
      console.error("Errore durante l'aggiornamento:", error.message);
      return {
        success: false,
        message: error.message,
      };
    } finally {
      try {
        const conn = await connection;
        await conn.end();
      } catch (error) {
        console.error("Errore durante la chiusura della connessione:", error);
      }
    }
  }
}
