export const SCRAPER_CONFIG = {
  // Configurazioni generali
  SCRAPING_DELAY: 1000,
  MAX_PAGES: 5,
  DELETE_AFTER_DAYS: 90,

  // Configurazioni specifiche per AutoScout
  AUTOSCOUT: {
    BASE_URL: 'https://www.autoscout24.it',
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    TIMEOUT: 10000
  },

  // Configurazioni specifiche per Subito
  SUBITO: {
    // ... altre configurazioni specifiche per Subito se necessarie
  }
}; 