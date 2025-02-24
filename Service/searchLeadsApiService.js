import { PrismaClient } from "@prisma/client";
import mysql from "mysql";
import fs from "fs";

//? DA CONTROLLARE TUTTE
export class searchLeadsApiService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  getCars(comuni, annoDa, annoA, kmDa, kmA, platformOptions) {
    const kmDaValue = parseInt(kmDa, 10);
    const kmAValue = parseInt(kmA, 10);

    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 3600000);

    return this.prisma[platformOptions]
      .findMany({
        where: {
          geo_town: { in: comuni },
          register_year: {
            gte: annoDa,
            lte: annoA,
          },
          date_remote: {
            gte: startTime,
          },
        },
        orderBy: {
          date_remote: "desc",
        },
      })
      .then((cars) => {
        // Filtriamo ulteriormente i veicoli in base al campo "mileage_scalar"
        return cars.filter((car) => {
          const mileageScalar = parseInt(car.mileage_scalar, 10);
          return mileageScalar >= kmDaValue && mileageScalar <= kmAValue;
        });
      });
  }

  getRecentCars(
    comuni,
    annoDa,
    annoA,
    kmDa,
    kmA,
    userMail,
    platformOptions,
    ore
  ) {
    const kmDaValue = parseInt(kmDa, 10);
    const kmAValue = parseInt(kmA, 10);
    if (ore < 1 || ore > 24) {
      return Promise.reject("Opzione orario non valida");
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - ore * 3600000); // Converti in millisecondi
    return this.prisma[platformOptions]
      .findMany({
        where: {
          geo_town: { in: comuni },
          register_year: {
            gte: annoDa,
            lte: annoA,
          },
          date_remote: {
            gte: startTime,
          },
        },
        orderBy: {
          date_remote: "desc",
        },
      })
      .then((cars) => {
        // Filtriamo ulteriormente i veicoli in base al campo "mileage_scalar"
        return cars.filter((car) => {
          const mileageScalar = parseInt(car.mileage_scalar, 10);
          return mileageScalar >= kmDaValue && mileageScalar <= kmAValue;
        });
      });
  }

  getUserId(userMail) {
    return this.prisma.users.findFirst({
      where: {
        email: userMail,
      },
    });
  }

  async getSearchList(userId, pageNum, pageSize) {
    const skip = (pageNum - 1) * pageSize;
    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PSW,
      database: process.env.DB_NAME,
    });

    const queryPromise = new Promise((resolve, reject) => {
      connection.query(
        `SELECT * FROM searches 
        WHERE user_id = ? 
        ORDER BY search_date DESC
        LIMIT ? OFFSET ?`,
        [userId, pageSize, skip],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
          connection.end();
        }
      );
    });

    const countPromise = new Promise((resolve, reject) => {
      connection.query(
        `SELECT COUNT(*) as count FROM searches 
        WHERE user_id = ?`,
        [userId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count);
          }
        }
      );
    });

    const [searchList, totalCount] = await Promise.all([
      queryPromise,
      countPromise,
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);
    /*     fs.appendFileSync('debug.log', `searchList: ${JSON.stringify(searchList)}\n`);
    fs.appendFileSync('debug.log', `totalCount: ${totalCount}\n`);
    fs.appendFileSync('debug.log', `totalPages: ${totalPages}\n`); */
    return {
      totalPages: totalPages,
      searchList: searchList,
    };
  }

  async getLastSearchOfTheUser(userId) {
    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PSW,
      database: process.env.DB_NAME,
    });

    const queryPromise = new Promise((resolve, reject) => {
      //get last search of the user
      connection.query(
        `SELECT * FROM searches 
        WHERE user_id = ? 
        ORDER BY search_date DESC
        LIMIT 1`,
        [userId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
          connection.end();
        }
      );
    });

    return { results: await queryPromise };
  }

  async getBySearchId(searchId) {
    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PSW,
      database: process.env.DB_NAME,
    });

    const queryPromise = new Promise((resolve, reject) => {
      connection.query(
        `SELECT * FROM searches WHERE search_id = ?`,
        [searchId], // Converte searchId in intero
        (error, results) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            reject(
              new Error(`Nessun risultato trovato per search_id: ${searchId}`)
            );
          } else {
            resolve(results);
          }
          connection.end();
        }
      );
    });

    const resultSearchId = await queryPromise;
    return { resultSearchId };
  }

  async getLeads(leads) {
    const results = await this.prisma.$transaction([
      this.prisma.cars_subito.findMany({
        where: {
          id: {
            in: leads,
          },
        },
        orderBy: {
          date_remote: "desc",
        },
      }),
      this.prisma.cars_autoscout.findMany({
        where: {
          id: {
            in: leads,
          },
        },
        orderBy: {
          date_remote: "desc",
        },
      }),
      this.prisma.cars_facebook.findMany({
        where: {
          id: {
            in: leads,
          },
        },
        orderBy: {
          date_remote: "desc",
        },
      }),
    ]);

    return results.flat();
  }

  async getLeadsByIds(leadsIds, platform, pageNum, pageSize) {
    const skip = (pageNum - 1) * pageSize;
    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PSW,
      database: process.env.DB_NAME,
    });

    // Query per il conteggio totale
    const countPromise = new Promise((resolve, reject) => {
      connection.query(
        `SELECT COUNT(*) as count FROM ${platform} WHERE id IN (?)`,
        [leadsIds],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0].count);
          }
        }
      );
    });

    // Query per ottenere i leads con paginazione
    const leadsPromise = new Promise((resolve, reject) => {
      connection.query(
        `SELECT * FROM ${platform} 
         WHERE id IN (?) 
         ORDER BY date_remote DESC 
         LIMIT ? OFFSET ?`,
        [leadsIds, pageSize, skip],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
          connection.end();
        }
      );
    });

    const [totalCount, leads] = await Promise.all([countPromise, leadsPromise]);
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      totalCount: totalCount,
      totalPages: totalPages,
      leadsList: leads,
    };
  }

  async getUserInformations(userMail) {
    const connection = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PSW,
      database: process.env.DB_NAME,
    });

    try {
      // Query per ottenere user_id
      const userIdPromise = new Promise((resolve, reject) => {
        connection.query(
          "SELECT id FROM users WHERE email = ?",
          [userMail],
          (error, results) => {
            if (error) reject(error);
            else if (results.length === 0)
              reject(new Error("Utente non trovato"));
            else resolve(results[0]);
          }
        );
      });

      const user = await userIdPromise;

      // Query per ottenere informazioni utente
      const userInfoPromise = new Promise((resolve, reject) => {
        connection.query(
          "SELECT name, spoki_api FROM users_data WHERE user_id = ?",
          [user.id],
          (error, results) => {
            if (error) reject(error);
            else if (results.length === 0)
              reject(new Error("Dati utente non trovati"));
            else resolve(results[0]);
          }
        );
      });

      const userInfo = await userInfoPromise;
      connection.end();

      return {
        user_id: user.id,
        name: userInfo.name,
        spoki_active: userInfo.spoki_api ? true : false,
      };
    } catch (error) {
      connection.end();
      throw error;
    }
  }

  // * CREA UNA RICERCA PROGRAMMATA
  async createScheduledSearch(payload) {
    const connection = mysql.createConnection({
      host: "141.95.54.84",
      user: "luigi_tuacar",
      password: "Tuacar.2023",
      database: "tuacarDb",
    });

    try {
      await new Promise((resolve, reject) => {
        connection.query(
          `INSERT INTO scheduled_tasks (user_id, schedule_active, schedule_cron_style, schedule_start, schedule_repeat_h, schedule_cc, schedule_content, created_at, last_run, next_run) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            payload.user_id,
            payload.schedule_active || 1,
            payload.schedule_cron_style || "",
            payload.schedule_start,
            payload.schedule_repeat_h,
            payload.schedule_cc || "[]",
            JSON.stringify(payload.schedule_content),
            payload.created_at,
            payload.last_run,
            payload.next_run,
          ],
          (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          }
        );
      });

      connection.end();
      return {
        success: true,
        results: "Ricerca programmata creata con successo",
      };
    } catch (error) {
      console.error("Errore durante createScheduledSearch:", error);
      connection.end();
      return {
        success: false,
        error: error.message || error,
        payload: payload,
      };
    }
  }
  //*
  async searchUrlsInTables(urls, tables) {
    const connection = mysql.createConnection({
      host: "141.95.54.84",
      user: "luigi_tuacar",
      password: "Tuacar.2023",
      database: "tuacarDb",
    });

    try {
      const placeholders = urls.map(() => "?").join(",");

      const unionQuery = tables
        .map(
          (table) => `
        SELECT *, '${table}' as source_table 
        FROM ${table} 
        WHERE url IN (${placeholders})
      `
        )
        .join(" UNION ALL ");

      const queryParams = [];
      tables.forEach(() => {
        queryParams.push(...urls);
      });

      const results = await new Promise((resolve, reject) => {
        connection.query(unionQuery, queryParams, (error, results) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(results || []);
        });
      });

      return results;
    } catch (error) {
      console.error("Errore durante la ricerca:", error);
      throw error;
    }
  }
}
