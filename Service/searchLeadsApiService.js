import { PrismaClient } from "@prisma/client";
import mysql from "mysql";
import fs from "fs";

export class searchLeadsApiService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  getCars(comuni, annoDa, annoA, kmDa, kmA, platformOptions) {
    const kmDaValue = parseInt(kmDa, 10);
    const kmAValue = parseInt(kmA, 10);

    const now = new Date();
    const startTime = new Date(now.getTime() - 24 * 3600000); 

    return this.prisma[platformOptions].findMany({
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

  getRecentCars(comuni, annoDa, annoA, kmDa, kmA,userMail,platformOptions, ore) {
    const kmDaValue = parseInt(kmDa, 10);
    const kmAValue = parseInt(kmA, 10);
    if (ore < 1 || ore > 24) {
      return Promise.reject("Opzione orario non valida");
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - ore * 3600000); // Converti in millisecondi
    return this.prisma[platformOptions].findMany({
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

  getUserId(userMail){
    return this.prisma.users.findFirst({
      where: {
        email: userMail
      }
    })
  };

  async getSearchList(userId, pageNum, pageSize){
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

    const [searchList, totalCount] = await Promise.all([queryPromise, countPromise]);

    const totalPages = Math.ceil(totalCount / pageSize);
/*     fs.appendFileSync('debug.log', `searchList: ${JSON.stringify(searchList)}\n`);
    fs.appendFileSync('debug.log', `totalCount: ${totalCount}\n`);
    fs.appendFileSync('debug.log', `totalPages: ${totalPages}\n`); */
    return {
      totalPages: totalPages,
      searchList: searchList,
    };
  }

  async getLeadsByIds(leadsIds, platform, pageNum, pageSize) {
    const skip = (pageNum - 1) * pageSize;
    const totalCount = await this.prisma[platform].count({
      where: { 
        id: {
          in: leadsIds,
        },
      },
    });

    const leads = await this.prisma[platform].findMany({
      where: {
        id: {
          in: leadsIds,
        },
      },
      orderBy: {
        date_remote: "desc",
      },
      skip: skip,
      take: pageSize,
    });

    const totalPages = Math.ceil(totalCount / pageSize );
    return {
      totalCount: totalCount,
      totalPages: totalPages,
      leadsList: leads,
    }
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
// USED ON OLDER PRISMA.SCHEMA DEPRECATED FUNCTIONS
/*   async createSearch(userMail, annoDa, annoA, kmDa, kmA, comuni, platform) {
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
      console.log("First For of");
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
  } */
}
