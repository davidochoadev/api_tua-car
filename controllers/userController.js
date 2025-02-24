import "dotenv/config";
import { userApiService } from "../Service/userApiService.js";
import bcrypt from "bcryptjs";

const user = new userApiService();

//* MODIFICA IL VALORE isNewAgency
export const updateIsNewAgency = async (req, res) => {
  const { user_id, isNewAgency } = req.body;
  console.log(user_id, isNewAgency);
  if (user_id === undefined || isNewAgency === undefined) {
    res.status(400).json({
      error: "⚠️ Missing 'user_id' or 'isNewAgency' parameter",
    });
  }
  try {
    const result = await user.updateIsNewAgency(user_id, isNewAgency);
    res.status(200).json({
      result,
    });
  } catch (err) {
    res.status(400).json({
      error: "Errore durante la modifica del valore isNewAgency",
      error_message: err.message,
    });
  }
};

//* EFFETTUA LA MODIFICA DELLA PASSWORD
export const userUpdatePassword = async (req, res) => {
  try {
    const { userMail, currentPassword, newPassword, confirmNewPassword } =
      req.body;

    // Verifica che tutti i campi necessari siano presenti
    if (!userMail || !currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "Tutti i campi sono obbligatori",
      });
    }

   // Trova l'utente nel database
   const data = await user.getUser(userMail);
   console.log(data);
   if (!data?.user?.password) {
      return res.status(404).json({
      success: false,
      message: "Utente non trovato o password non impostata",
      });
   }

    // Verifica che la nuova password e la conferma corrispondano
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "La nuova password e la conferma non corrispondono",
      });
    }

    // Verifica la password corrente
    console.log(data.user.password);
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      data.user.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Password corrente non valida",
      });
    }

    // Cripta la nuova password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Aggiorna la password nel database
    await user.updateUserPassword(data.user.id, hashedPassword);

    return res.status(200).json({
      success: true,
      message: "Password aggiornata con successo",
    });
  } catch (error) {
    console.error("Errore durante l'aggiornamento della password:", error);
    return res.status(500).json({
      success: false,
      message: "Errore interno del server",
    });
  }
};

// * OTTIENI LE INFORMAZIONI DELL'UTENTE PER FILLARE IL FORM
export const userUpdateData = async (req, res) => {
  const { userMail } = req.query;
  if (!userMail) {
    res.status(400).json({
      error:
        "⚠️ Missing 'userMail' parameter within the query parameters. It's not possible to perform the search in the database without specifying the usermail of the user.",
    });
  }
  try {
    const data = await user.getUser(userMail);
    res.status(200).json({
      user_id: data.user.id,
      user_name: data.userInformations.name,
      user_ragione_sociale: data.userInformations.company,
      user_phone: data.userInformations.phone,
      user_address: data.userInformations.address,
    });
  } catch (err) {
    res.status(400).json({
      error: "Utente non trovato o non valido!",
    });
  }
};

//* EFFETTUA LA MODIFICA DELLE INFORMAZIONI DELL'UTENTE
export const userUpdate = async (req, res) => {
  const { user_id, user_name, user_ragione_sociale, user_phone, user_address } =
    req.body;
  if (
    !user_id ||
    !user_name ||
    !user_ragione_sociale ||
    !user_phone ||
    !user_address
  ) {
    res.status(400).json({
      error:
        "⚠️ Uno o più parametri mancanti nel body della richiesta. Assicurati di includere tutti i campi richiesti.",
    });
  }
  try {
    const data = await user.updateUser(
      user_id,
      user_name,
      user_ragione_sociale,
      user_phone,
      user_address
    );
    res.status(200).json({
      success: true,
      message: "Utente aggiornato con successo!",
      data: data,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: "Errore durante l'aggiornamento dell'utente!",
      error_message: err.message,
    });
  }
};

export const userOnDb = async (req, res) => {
  const { userMail } = req.query;
  if (!userMail) {
    res.status(400).json({
      error:
        "⚠️ Missing 'userMail' parameter within the query parameters. It's not possible to perform the search in the database without specifying the usermail of the user.",
    });
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
        user_uuID: data.userInformations.uuID,
      },
    });
  } catch (err) {
    res.status(400).json({
      error: "Utente non trovato o non valido!",
    });
  }
};

// * VERIFICA SE L'UTENTE HA UNA TASK PROGRAMMATA
export const userHasScheduledTask = async (req, res) => {
  const { userMail } = req.query;

  if (!userMail) {
    return res.status(400).json({
      error: "⚠️ Parametro 'userMail' mancante",
    });
  }

  try {
    const userId = await user.getUserId(userMail);
    const result = await user.userScheduledTask(userId.id);

    if (!result) {
      return res.status(404).json({
        error: "L'utente non ha una task programmata",
      });
    }

    res.status(200).json({
      result,
    });
  } catch (err) {
    res.status(400).json({
      error: "Errore durante la verifica della task programmata",
      error_message: err.message,
    });
  }
};
// * DISABILITA LA TASK PROGRAMMATA
export const disableScheduledTask = async (req, res) => {
  const { task_id } = req.query;
  if (!task_id) {
    res.status(400).json({
      error: "⚠️ Missing 'task_id' parameter",
    });
  }

  try {
    const result = await user.disableScheduledTask(task_id);
    console.log("result is: ", result);
    res.status(200).json({
      success: true,
      message: "Task disabilitata con successo!",
      result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Errore durante il disabilitare la task programmata!",
      error_message: err.message,
    });
  }
};

export const userSpokiData = async (req, res) => {
  const { userMail } = req.query;
  if (!userMail) {
    res.status(400).json({
      error:
        "⚠️ Missing 'userMail' parameter within the query parameters. It's not possible to perform the search in the database without specifying the usermail of the user.",
    });
  }

  try {
    const data = await user.getUserSpoki(userMail);
    res.status(200).json({
      user_data: {
        user_id_on_user_data_entity: data.userInformations.id,
        user_search_configuration: data.userInformations.user_config,
        user_spoki_api: data.userInformations.spoki_api,
        user_spoki_enabled: data.userInformations.IsSpokiEnabled,
        user_secret: data.userInformations.Secret,
        user_uuID: data.userInformations.uuID,
      },
    });
  } catch (err) {
    res.status(400).json({
      error: "Utente non trovato o non valido!",
    });
  }
};
