import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import fs from 'fs';

const LOGIN_URL = 'http://localhost:3000/api/auth/signin'; // Login-Seite
const REPORTS_DIR = './lighthouse-reports';
const VISITED_URLS = new Set();

// Verzeichnis für Lighthouse-Reports erstellen
if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR);
}

// Warte auf den manuellen Login und erkenne Dashboard
async function waitForManualLogin(browser) {
    console.log('🔑 Öffne Login-Seite. Melde dich bitte manuell an...');
    const page = await browser.newPage();
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    // Prüfe auf Sicherheitswarnung
    try {
        await page.waitForSelector('button', { visible: true, timeout: 5000 });
        await page.click('button'); // Sicherheitswarnung umgehen
        console.log('🔄 Sicherheitswarnung behoben, fahre fort...');
    } catch (error) {
        console.log('✅ Keine Sicherheitswarnung gefunden, fahre fort...');
    }

    console.log('🔍 Warte auf die Dashboard-Seite...');

    while (true) {
        const pages = await browser.pages();
        for (const p of pages) {
            const url = await p.url();
            console.log(`🌐 Erkannte URL: ${url}`); // Debugging

            if (url.startsWith('http://localhost:3000') && url !== LOGIN_URL) {
                console.log('✅ Dashboard-Seite erkannt. Du kannst jetzt manuell navigieren.');
                return;
            }
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Lighthouse-Test für jede Seite (Login-Seite wird ignoriert)
async function runLighthouse(url, browser) {
    if (VISITED_URLS.has(url) || url === LOGIN_URL) {
        console.log(`⏩ Überspringe: ${url}`);
        return;
    }

    console.log(`🔍 Teste Seite: ${url}`);
    VISITED_URLS.add(url);

    const port = new URL(browser.wsEndpoint()).port;
    const result = await lighthouse(url, {
        port,
        output: 'html',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    });

    const filePath = `${REPORTS_DIR}/${url.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    fs.writeFileSync(filePath, result.report);
    console.log(`✅ Lighthouse Report gespeichert: ${filePath}`);
}

// Überwache Navigation & teste jede neue Seite (außer Login)
async function monitorNavigation(browser) {
    console.log('🔄 Navigiere manuell durch die Seiten. Lighthouse startet automatisch.');

    browser.on('targetchanged', async (target) => {
        try {
            const page = await target.page();
            if (!page) return;

            const url = await page.url();
            if (url.startsWith('http://localhost:3000') && url !== LOGIN_URL) {
                console.log(`🌐 Neue Seite erkannt: ${url}`);
                await runLighthouse(url, browser);
            }
        } catch (error) {
            console.log('⚠️ Fehler beim Überwachen der Navigation:', error.message);
        }
    });

    // Erkennung von Navigationen innerhalb derselben Seite (SPA-Support)
    browser.on('targetcreated', async (target) => {
        try {
            const page = await target.page();
            if (!page) return;

            const url = await page.url();
            if (url.startsWith('http://localhost:3000') && url !== LOGIN_URL) {
                console.log(`🔄 Neue Seite geöffnet: ${url}`);
                await runLighthouse(url, browser);
            }
        } catch (error) {
            console.log('⚠️ Fehler beim Überwachen neuer Seiten:', error.message);
        }
    });
}

// Starte das Skript
(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
        ]
    });

    const page = await browser.newPage();

    // Setze einen realistischen User-Agent
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
    );

    // Verstecke Puppeteer als Bot
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // Blockiere Fingerprinting
    await page.evaluateOnNewDocument(() => {
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ? Promise.resolve({ state: 'denied' }) : originalQuery(parameters)
        );
    });

    // 1️⃣ Warte auf den Login & Dashboard
    await waitForManualLogin(browser);

    // 2️⃣ Überwache Navigation & analysiere jede neue Seite
    await monitorNavigation(browser);
})();
