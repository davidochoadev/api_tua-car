import { PrismaClient } from "@prisma/client";

export class facebookApiService {
   constructor() {
      this.prisma = new PrismaClient();
    }
   getAllFacebookCars() {
      return this.prisma.cars_facebook.findMany({
         orderBy: {
            id: "desc",
          },
         select: {
            urn: true,
         }
      });
   }

   createFacebookCars(cars) {
      return this.prisma.cars_facebook.createMany({
         data: cars,
      })
   }

   createFacebookCar(urn, subject, price, mileage_scalar, register_year, geo_region, geo_info, geo_town, url) {
      let carPrice
      if (price === NaN || undefined || null) {
         carPrice = 0;
      } else {
         carPrice = parseInt(price);
      }
      return this.prisma.cars_facebook.create({
         data: {
            urn: urn,
            subject: subject,
            price: carPrice,
            mileage_scalar: mileage_scalar,
            register_year: register_year,
            geo_region: geo_region,
            geo_provincia: geo_info || "",
            geo_town: geo_town,
            url: url,
         }
      })
   }

   deleteExpiredCars(date) {
      return this.prisma.cars_facebook.deleteMany({
         where: {
            date_remote: {
               lte: date,
            }
         }
      })
   }

   findUrnByUrn(urn) {
      const res = this.prisma.cars_facebook.findUnique({
         where : {
            urn: urn,
         },
      });
      return res;
   }
}