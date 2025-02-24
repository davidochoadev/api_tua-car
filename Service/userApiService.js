import { PrismaClient } from "@prisma/client";
import { parse } from "dotenv";
import mysql from "mysql2";

// ? DA CONTROLLARE TUTTE
export class userApiService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUser(userMail) {
    // Validazione dei dati in ingresso
    if (!userMail || typeof userMail !== "string") {
      return { error: "Indirizzo email non valido" };
    }

    const userData = await this.prisma.users.findFirst({
      where: {
        email: userMail,
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        status: true,
        verified: true,
        resettable: true,
        roles_mask: true,
        registered: true,
        last_login: true,
      },
    });

    if (!userData) {
      return { error: "Utente non trovato" };
    }

    const userInfo = await this.prisma.users_data.findFirst({
      where: {
        user_id: userData.id,
      },
    });

    return {
      user: userData,
      userInformations: userInfo,
    };
  }

  async getUserId(userMail) {
    return this.prisma.users.findFirst({
      where: {
        email: userMail,
      },
      select: {
        id: true,
      },
    });
  }

  // * VERIFICA SE L'UTENTE HA UNA TASK PROGRAMMATA
  async userScheduledTask(userId) {
    return await this.prisma.scheduled_tasks.findFirst({
      where: {
        user_id: userId,
        schedule_active: 1,
      },
    });
  }

  // * DISABILITA LA TASK PROGRAMMATA
  async disableScheduledTask(taskId) {
    console.log("taskId is: ", taskId);
    try {
      return await this.prisma.scheduled_tasks.update({
        where: {
          task_id: parseInt(taskId),
      },
        data: {
          schedule_active: 0,
        },
      });
    } catch (error) {
      throw new Error(`Errore durante il disabilitare la task: ${error.message}`);
    }
  }

  async getUserInformations(userMail) {
    const user_id = await this.prisma.users.findFirst({
      where: {
        email: userMail,
      },
    });
    const userInformations = await this.prisma.users_data.findFirst({
      where: {
        user_id: user_id.id,
      },
    });
    return {
      user_id: user_id.id,
      name: userInformations.name,
      spoki_active: userInformations.spoki_api ? true : false,
    };
  }
  async getUserSpoki(userMail) {
    if (!userMail || typeof userMail !== "string") {
      return { error: "Indirizzo email non valido" };
    }

    const userData = await this.prisma.users.findFirst({
      where: {
        email: userMail,
      },
      select: {
        id: true,
      },
    });

    if (!userData) {
      return { error: "Utente non trovato" };
    }

    const userInfo = await this.prisma.users_data.findFirst({
      where: {
        user_id: userData.id,
      },
    });

    return {
      userInformations: userInfo,
    };
  }

  //* MODIFICA I DATI DELL'UTENTE
  async updateUser(
    user_id,
    user_name,
    user_ragione_sociale,
    user_phone,
    user_address
  ) {
    let connection;
    try {
      connection = await mysql.createConnection({
        host: "141.95.54.84",
        user: "luigi_tuacar",
        password: "Tuacar.2023",
        database: "tuacarDb",
      });

      const query = `
        UPDATE users_data 
        SET 
          name = ?,
          company = ?,
          phone = ?,
          address = ?
        WHERE user_id = ?
      `;

      const [result] = await connection
        .promise()
        .query(query, [
          user_name,
          user_ragione_sociale,
          user_phone,
          user_address,
          user_id,
        ]);

      return {
        dati_cambiati: {
          user_id,
          user_name,
          user_ragione_sociale,
          user_phone,
          user_address,
        },
        results: result,
      };
    } catch (error) {
      throw new Error(`Errore durante l'aggiornamento: ${error.message}`);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  //* MODIFICA LA PASSWORD DELL'UTENTE
  async updateUserPassword(user_id, new_password) {
    let connection;
    try {
      connection = await mysql.createConnection({
        host: "141.95.54.84",
        user: "luigi_tuacar",
        password: "Tuacar.2023",
        database: "tuacarDb",
      });

      const query = `
        UPDATE users 
        SET 
          password = ?
        WHERE id = ?
      `;

      const [result] = await connection
        .promise()
        .query(query, [
          new_password,
          user_id,
        ]);

      return result;
    } catch (error) {
      throw new Error(`Errore durante l'aggiornamento della password: ${error.message}`);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }
}
