import { PrismaClient } from "@prisma/client";
import { parse } from "dotenv";

// ? DA CONTROLLARE TUTTE 
export class userApiService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUser(userMail) {
     // Validazione dei dati in ingresso
     if (!userMail || typeof userMail !== 'string') {
       return {error: 'Indirizzo email non valido'};
     }
 
     const userData = await this.prisma.users.findFirst({
       where: {
         email: userMail,
       },
       select: {
         id: true,
         email: true,
         username: true,
         status: true,
         verified: true,
         resettable: true,
         roles_mask: true,
         registered: true,
         last_login: true,
       },
     });
 
     if (!userData) {
       return { error :'Utente non trovato' };
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
        email: userMail
      },
      select: {
         id: true,
      },
    });
 }

 async userScheduledTask(userId) {
   return await this.prisma.scheduled_tasks.findFirst({
      where: {
         user_id: userId,
         schedule_active: 1,
      },
   })
 }

  async getUserInformations(userMail){
    const user_id = await this.prisma.users.findFirst({
      where: {
        email: userMail
      }
    });
    const userInformations = await this.prisma.users_data.findFirst({
      where: {
        user_id: user_id.id
      }
    });
    return {
      user_id: user_id.id,
      name: userInformations.name,
      spoki_active: userInformations.spoki_api ? true : false,
    }
  }
  async getUserSpoki(userMail) {
    if (!userMail || typeof userMail !== 'string') {
      return {error: 'Indirizzo email non valido'};
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
      return { error :'Utente non trovato' };
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
}

