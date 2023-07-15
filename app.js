import express from "express";
import cors from 'cors';
import corsOptions from "./config/corsOptions.js";
import { performSearch } from "./controllers/searchController.js";
import { performData } from "./controllers/dataController.js";
import { removeData } from "./controllers/removeController.js";
import fs from "fs";
import path from "path";


const app = express();
app.use(express.json());

app.use(cors(corsOptions));

app.get("/", (req, res) => {
    res.status(200).json({ welcome_message: "Server Express di Asta Click!" });
});

app.get("/export/export_lombardia.csv", (req, res) => {
  const filePath = path.join(process.cwd(), "Data", "export_lombardia.csv");

  // Read the file contents
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Internal Server Error" + err);
    }

    // Set the appropriate headers for CSV response
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=export_lombardia.csv");

    // Send the file contents as the response
    res.send(data);
  });
});

app.get("/export/export_liguria.csv", (req, res) => {
  const filePath = path.join(process.cwd(), "Data", "export_liguria.csv");

  // Read the file contents
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Internal Server Error" + err);
    }

    // Set the appropriate headers for CSV response
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=export_liguria.csv");

    // Send the file contents as the response
    res.send(data);
  });
});

app.get("/export/export_piemonte.csv", (req, res) => {
  const filePath = path.join(process.cwd(), "Data", "export_piemonte.csv");

  // Read the file contents
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Internal Server Error" + err);
    }

    // Set the appropriate headers for CSV response
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=export_piemonte.csv");

    // Send the file contents as the response
    res.send(data);
  });
});

app.get("/export/export_vda.csv", (req, res) => {
  const filePath = path.join(process.cwd(), "Data", "export_vda.csv");

  // Read the file contents
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Internal Server Error" + err);
    }

    // Set the appropriate headers for CSV response
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=export_vda.csv");

    // Send the file contents as the response
    res.send(data);
  });
});

app.get("/search", performSearch);
app.get("/data", performData);
app.get("/remove", removeData);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
