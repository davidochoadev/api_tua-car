-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Creato il: Gen 23, 2025 alle 01:19
-- Versione del server: 8.0.41
-- Versione PHP: 8.3.15
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!40101 SET NAMES utf8mb4 */
;
--
-- Database: `tuacarDb`
--

-- --------------------------------------------------------
--
-- Struttura della tabella `commerciali_subito`
--

CREATE TABLE `commerciali_subito` (
  `id` int NOT NULL,
  `urn` varchar(255) NOT NULL,
  `subject` text NOT NULL,
  `body` text NOT NULL,
  `date_remote` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `pollution` varchar(128) DEFAULT NULL,
  `fuel` varchar(128) DEFAULT NULL,
  `vehicle_status` varchar(128) DEFAULT NULL,
  `price` int NOT NULL DEFAULT '0',
  `mileage_scalar` varchar(128) NOT NULL,
  `doors` text,
  `register_date` varchar(128) NOT NULL,
  `register_year` varchar(32) NOT NULL,
  `geo_region` varchar(128) NOT NULL,
  `geo_provincia` varchar(128) NOT NULL,
  `geo_town` varchar(128) NOT NULL,
  `url` text NOT NULL,
  `advertiser_name` varchar(128) NOT NULL,
  `advertiser_phone` varchar(128) DEFAULT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb3;
--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `commerciali_subito`
--
ALTER TABLE `commerciali_subito`
ADD PRIMARY KEY (`id`);
--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `commerciali_subito`
--
ALTER TABLE `commerciali_subito`
MODIFY `id` int NOT NULL AUTO_INCREMENT;
COMMIT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;