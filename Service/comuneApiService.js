import { PrismaClient } from "@prisma/client";

export class comuneApiService {
   constructor() {
      this.prisma = new PrismaClient();
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