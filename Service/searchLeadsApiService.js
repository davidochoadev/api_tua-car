import { PrismaClient } from "@prisma/client";
import { parse } from "dotenv";

export class searchLeadsApiService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  getCarsFromAutoScout(comuni, annoDa, annoA, kmDa, kmA) {
    console.log("Get From AutoScout!", comuni, annoDa, annoA, kmDa, kmA)
    const kmDaValue = parseInt(kmDa, 10);
    const kmAValue = parseInt(kmA, 10);

    return this.prisma.cars_autoscout
      .findMany({
        where: {
          geo_town: { in: comuni },
          register_year: {
            gte: annoDa,
            lte: annoA,
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

  getCarsFromSubito(comuni, annoDa, annoA, kmDa, kmA) {
    console.log(kmDa, kmA);
    const kmDaValue = parseInt(kmDa, 10);
    const kmAValue = parseInt(kmA, 10);

    return this.prisma.cars_subito
      .findMany({
        where: {
          geo_town: { in: comuni },
          register_year: {
            gte: annoDa,
            lte: annoA,
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

  getCarsFromFacebook(comuni, annoDa, annoA, kmDa, kmA) {
    const kmDaValue = parseInt(kmDa, 10);
    const kmAValue = parseInt(kmA, 10);

    return this.prisma.cars_facebook
      .findMany({
        where: {
          geo_town: { in: comuni },
          register_year: {
            gte: annoDa,
            lte: annoA,
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

  async createSearch(userMail, annoDa, annoA, kmDa, kmA, comuni, platform) {
    try {
      const findUserOnLeads = await this.prisma.users.findUnique({
        where: {
          email: userMail,
        },
      });
      if (findUserOnLeads) {
        // User Registered on Leads
        const findUserOnCMR = await this.prisma.UserCRM.findUnique({
          where: {
            userMail: userMail,
          },
        });
        if (findUserOnCMR) {
          // User Registered on Table UserCMR
          const newSearch = await this.prisma.Search.create({
            data: {
              annoDa: annoDa,
              annoA: annoA,
              kmDa: kmDa,
              kmA: kmA,
              platform: platform,
              user: {
                connect: { userMail: userMail }
              },
              comuni : JSON.stringify(comuni),
            }
          })
          return newSearch;
        } else {
          // User Not Registered on UserCMR
          return await this.prisma.userCRM.create({
            data: {
              userMail: userMail,
            },
          });
        }
      } else {
        // User Not Registered on Leads
        return {
          err: "User Not Found on leads platform, visit this link to register an account and wait for confirm registration: https://leads.tua-car.it/#/register",
        };
      }
    } catch (error) {
      console.log(error)
      return { err: "Error on prisma!" , error};
    }
  }

  async createLeads(leadsFromPlatforms, platform, searchId) {
    console.log("Creating Leads!", leadsFromPlatforms.length);
    for ( const lead of leadsFromPlatforms) {
      const findLead = await this.prisma.lead.findFirst({
        where: {
          urn: lead.urn,
        }
      });
      if (!findLead) {
        await this.prisma.lead.create({
          data : {
            urn : lead.urn,
            subject : lead.subject,
            body : lead.body,
            date_remote : lead.date_remote,
            pollution : lead.pollution,
            fuel: lead.fuel,
            vehicle_status: lead.vehicle_status,
            price: parseInt(lead.price),
            mileage_scalar: parseInt(lead.mileage_scalar),
            doors: lead.doors,
            register_date: lead.register_date,
            register_year: parseInt(lead.register_year),
            geo_region: lead.geo_region,
            geo_provincia: lead.geo_provincia,
            geo_town: lead.geo_town,
            url: lead.url,
            advertiser_name: lead.advertiser_name,
            advertiser_phone: lead.advertiser_phone,
            platform : platform,
            searches: {
              create : [
                {
                  search :{
                    connect : {
                      id: searchId,
                    }
                  }
                }
              ]
            }
          }
        });
      } else {
        await this.prisma.lead.update({
          where: {
            id: findLead.id,
            urn: findLead.urn,
          },
          data: {
            searches: {
              create : [
                {
                  search :{
                    connect : {
                      id: searchId,
                    }
                  }
                }
              ]
            },
          },
        });
      }
    }
  }

  async createLeads2(leadsFromPlatforms, platform, searchId) {
    console.log("Creating Leads!", leadsFromPlatforms.length);
  
    const createPromises = [];
    const updatePromises = [];
  
    for (const lead of leadsFromPlatforms) {
      console.log("First For of")
      const findLeadPromise = this.prisma.lead.findFirst({
        where: {
          urn: lead.urn,
        },
      });
  
      findLeadPromise.then((findLead) => {
        if (!findLead) {
          console.log("createPromise");
          createPromises.push(
            this.prisma.lead.create({
              data: {
                urn: lead.urn,
                subject: lead.subject,
                body: lead.body,
                date_remote: lead.date_remote,
                pollution: lead.pollution,
                fuel: lead.fuel,
                vehicle_status: lead.vehicle_status,
                price: parseInt(lead.price),
                mileage_scalar: parseInt(lead.mileage_scalar),
                doors: lead.doors,
                register_date: lead.register_date,
                register_year: parseInt(lead.register_year),
                geo_region: lead.geo_region,
                geo_provincia: lead.geo_provincia,
                geo_town: lead.geo_town,
                url: lead.url,
                advertiser_name: lead.advertiser_name,
                advertiser_phone: lead.advertiser_phone,
                platform: platform,
                searches: {
                  create: [
                    {
                      search: {
                        connect: {
                          id: searchId,
                        },
                      },
                    },
                  ],
                },
              },
            })
          );
        } else {
          console.log("updatePromise");
          updatePromises.push(
            this.prisma.lead.update({
              where: {
                id: findLead.id,
              },
              data: {
                searches: {
                  create: [
                    {
                      search: {
                        connect: {
                          id: searchId,
                        },
                      },
                    },
                  ],
                },
              },
            })
          );
        }
      });
    }
  
    // Wait for all create and update operations to complete
    await Promise.all(createPromises);
    await Promise.all(updatePromises);
  }
  

  async getSearchList(userMail, pageNum, pageSize) {
    const skip = (pageNum - 1) * pageSize; 
    const totalCount = await this.prisma.search.count({
      where: { userMail },
    });

    const searchList = await this.prisma.search.findMany({
      where: userMail,
      orderBy: {
        createdAt: "desc",
      },
      skip: skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalCount / pageSize);
    return {
      totalPages: totalPages,
      searchList: searchList,
    };
  }

  async getLeadsList( searchId, pageNum, pageSize ) {
    const skip = (pageNum - 1) * pageSize;
    const totalCount = await this.prisma.LeadsOnSearch.count({
      where: {
        searchId : searchId,
      }
    })
    const searchList = await this.prisma.LeadsOnSearch.findMany({
      where : {
        searchId: searchId,
      },
      include : {
        lead : true,
      },
      skip: skip,
      take: pageSize,
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    return {
      totalPages: totalPages,
      leadsList: searchList,
    };
  }
}
