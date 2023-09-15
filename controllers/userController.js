import "dotenv/config";
import { userApiService } from "../Service/userApiService.js";

const user = new userApiService();

export const userOnDb = async (req,res) => {
   const { userMail } = req.query;
   if(!userMail){
      res.status(400).json({
         error: "⚠️ Missing 'userMail' parameter within the query parameters. It's not possible to perform the search in the database without specifying the usermail of the user.",
      })
   }
   console.log(userMail);
   try {
      const data = await user.getUser(userMail);
      res.status(200).json({
         user_id: data.user.id,
         user_email: data.user.email,
         user_phone: data.userInformations.phone,
         user_username: data.user.username,
         user_name: data.userInformations.name,
         user_company: data.userInformations.company,
         user_vat_number: data.userInformations.vat_number,
         user_ssn_number: data.userInformations.ssn_number,
         user_address: data.userInformations.address,
         user_zipcode: data.userInformations.zip,
         user_city: data.userInformations.city,
         user_state: data.userInformations.state,
         user_region: data.userInformations.region,
         user_location: data.userInformations.location,
         user_status: data.user.status ? true : false,
         user_verified: data.user.verified ? true : false,
         user_resettable: data.user.resettable ? true : false,
         user_role: data.user.roles_mask,
         user_registered_date: new Date(data.user.registered),
         user_last_login: new Date(data.user.last_login),
         user_data: {
            user_id_on_user_data_entity: data.userInformations.id,
            user_search_configuration: data.userInformations.user_config,
            user_spoki_api: data.userInformations.spoki_api,
            user_spoki_enabled: data.userInformations.IsSpokiEnabled,
            user_secret: data.userInformations.user_secret,
            user_uuID: data.userInformations.uuID
         }
      });
   }catch(err) {
      res.status(400).json({
         error: "Utente non trovato o non valido!",
      })
   }
}