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

   getDenominazioneBySigla(sigla) {
      return this.prisma.italy_provincies.findFirst({
         where: {
            sigla: sigla,
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
}