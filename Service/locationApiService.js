import { PrismaClient } from "@prisma/client";

export class locationApiService {
   constructor() {
      this.prisma = new PrismaClient();
    }
   
   getAllRegions() {
      return this.prisma.italy_munic.groupBy({
      by: ['regione'],
      })
   }

   getProvsByRegion(reg) {
      return this.prisma.italy_munic.groupBy({
      by: ['provincia'],
      where: {
         regione : reg,
      },
      _count: {
         comune: true,
      },
      })
   }

   async getProvByComuni(comuni) {
      return await this.prisma.italy_munic.groupBy({
          by: ['provincia'],
          where: {
              comune: {
                  in: comuni
              }
          }
      });
  }
  

   getDenominazioneBySigla(sigla) {
      return this.prisma.italy_provincies.findFirst({
         where: {
            sigla: sigla,
         }
      })
   }

   getComuniBySiglaProv(sigla) {
      return this.prisma.italy_munic.findMany({
         where: {
            provincia: sigla,
         }
      })
   }
   
   getAllComuni() {
      return this.prisma.italy_munic.findMany({
         orderBy: {
            id: "desc",
          }
      });
   }

   getComune(passedComune){
      return this.prisma.italy_munic.findFirst({
         where: {
            comune: passedComune,
         }
      });
   }

   getUserId(userMail){
      return this.prisma.users.findUnique({
         where: {
            email: userMail,
         }
      })
   }

   getUserComuni(user_id) {
      return this.prisma.users_data.findFirst({
         where: {
            user_id
         }
      })
   }
}