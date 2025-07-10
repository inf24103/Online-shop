import { execSync } from "child_process";
import os from "os";

function run(command, options = {}) {
    try {
        console.log(`\n> ${command}`);
        execSync(command, { stdio: "inherit", ...options });
    } catch (error) {
        console.error(`❌ Fehler bei Befehl: ${command}`);
        process.exit(1);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log("🔧 Plattform:", os.platform());

// 1. Stoppe & lösche alles
console.log("Beende und entferne alle Container & Volumes...");
run("docker compose down -v");

// 2. Baue alles neu
console.log("Baue Container ohne Cache neu...");
run("docker compose build --no-cache");

// 3. Starte nur die Datenbank
console.log("Starte nur die Datenbank...");
run("docker compose up -d db");

// 4. Warte auf Datenbankinitialisierung
console.log("Warte 2 Sekunden, damit die Datenbank initialisieren kann...");
await sleep(2000);

// 5. Starte Backend und Frontend
console.log("🚀 Starte Backend und Frontend...");
run("docker compose up backend frontend");

console.log("\nAlle Container wurden erfolgreich gestartet!");
