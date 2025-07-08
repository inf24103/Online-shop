import express from "express";
import morgan from "morgan";
import {mountRoutes} from "./routes/router.js";
import cookieParser from "cookie-parser";
import {
    createProductWarenkorbTable,
    createProduktTable, createWarenkorbTable,
    deleteProductTable,
    deleteWarenkorbProduktTable,
    deleteWarenkorbTable
} from "./datenbank/produkt_verwaltung/produktDDL.js";
import {createBenutzerTable, deleteBenutzerTable} from "./datenbank/user_verwaltung/userDDL.js";
import {createEinkaufTables, deleteEinkaufTables} from "./datenbank/einkauf_verwaltung/einkaufDDL.js";
import {
    createWunschlisteTables,
    deleteWunschlisteTables
} from "./datenbank/wunschliste_verwaltung/wunschlisteDDL.js";
import {createOneTimeLoginTable, dropOneTimeLoginTable} from "./datenbank/auth/authAllMethods.js";
import {createBenutzer, updateBenutzer} from "./datenbank/user_verwaltung/userDML.js";
import {getUserById, getUserByUsername} from "./datenbank/user_verwaltung/userDRL.js";
import {createProdukt, createWarenkorb} from "./datenbank/produkt_verwaltung/produktDML.js";

const app = express()
const port = 3000

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// configure logging before each api call
morgan.token('source', function () {
    return 'Morgan:';
});
const customFormat = ':source :method :url :status :res[content-length] - :response-time ms';
app.use(morgan(customFormat));

mountRoutes(app);

// Globales abfangen unbehandelter Fehler
app.use((err, req, res, next) => {
    console.error("Server: Es ist ein unbehandelter Fehler aufgetreten:\n " + err.stack);
    return res.status(500).json({
        error: 'Ein Fehler ist aufgetreten!'
    });
});

// Docker 1. mal starten: docker compose up --build
// Docker wieder löschen: docker compose down -v

app.get("/", (req, res) => {
    return res.status(200).redirect(`http://localhost:5000/`);
})

app.listen(port, () => {
    init()
    console.log(`Backend server läuft auf http://localhost:${port}`)
})

async function init() {
    await deleteWarenkorbProduktTable();
    await deleteWarenkorbTable();
    await deleteProductTable();
    await deleteBenutzerTable()
    await deleteEinkaufTables();
    await deleteWunschlisteTables();
    await dropOneTimeLoginTable();

    await createBenutzerTable();
    await createProduktTable();
    await createWarenkorbTable();
    await createProductWarenkorbTable();
    await createEinkaufTables();
    await createWunschlisteTables();
    await createOneTimeLoginTable();

    // create admin account
    await createAdminAccount()
    //await createSeedData()
    console.log("Innit db successfully!");
}

async function createSeedData() {
    await createProdukt(
        "Nike Indy Dri-fit Cross-Back Compression",
        37.95,
        100,
        "Sportbekleidung",
        "Hersteller: Nike. Material: 72 % Polyester / 28 % Spandex. Leichter Sport-BH mit mittlerem Halt und atmungsaktivem Dri-FIT-Material – stylischer Rückenträger."
    );

    await createProdukt(
        "DECALVIBES Longline Sports Bra Sport BH Ultimate",
        47.90,
        80,
        "Sportbekleidung",
        "Hersteller: DECALVIBES. Material: 78 % Polyester / 22 % Elastan. Lang geschnittener Sport-BH mit starkem Halt – ideal für High-Impact-Workouts."
    );

    await createProdukt(
        "DECALVIBES Longline Sports Bra Sport BH Pro",
        46.50,
        85,
        "Sportbekleidung",
        "Hersteller: DECALVIBES. Material: 78 % Polyester / 22 % Elastan. Sportlicher BH mit Kompression und atmungsaktivem Stoff – eng anliegend und bequem."
    );

    await createProdukt(
        "FALKE Damen Versatility Melange Maximum Support",
        30.99,
        60,
        "Sportbekleidung",
        "Hersteller: FALKE. Material: ca. 85 % Polyester / 15 % Elastan (geschätzt). High-Support-Sport-BH für intensive Belastung – hochwertig verarbeitet mit funktionalem Material."
    );

    await createProdukt(
        "Assoluta UNO Damen Sport Oberteil",
        26.90,
        120,
        "Sportbekleidung",
        "Hersteller: Assoluta. Material: ca. 90 % Polyester / 10 % Elastan (geschätzt). Schlichtes, funktionales Sportoberteil für Damen – schnelltrocknend und atmungsaktiv."
    );

    await createProdukt(
        "Nike Training – Swoosh Dri-FIT – Sport-BH",
        43.95,
        90,
        "Sportbekleidung",
        "Hersteller: Nike. Material: 80 % Polyester / 20 % Spandex (Dri-FIT). Bequemer Sport-BH mit Dri-FIT-Technologie – mittlerer Halt für alle Sportarten."
    );

    await createProdukt(
        "ASRV Training Apparel",
        35.99,
        50,
        "Fitnesszubehör",
        "Hersteller: ASRV. Material: AeroSilver® (antibakterielles Polyester), Creora® Tech-Rib (elastischer Spandex), Tech Essential™ (Baumwolle mit SilverPlus®). Premium-Trainingskleidung mit technischem Material – stylisch, funktionell und innovativ."
    );

    await createProdukt(
        "BlenderBottle Shaker Bottle Pro",
        22.90,
        200,
        "Fitnesszubehör",
        "Hersteller: BlenderBottle. Material: Tritan® Kunststoff (BPA-frei, bruchsicher), BlenderBall® Edelstahl 316. Shaker mit BlenderBall für perfekte Mix-Ergebnisse – BPA-frei, auslaufsicher, spülmaschinenfest."
    );

    await createProdukt(
        "BlenderBottle Strada Shaker",
        34.95,
        150,
        "Fitnesszubehör",
        "Hersteller: BlenderBottle. Material: Tritan® Kunststoff (BPA-frei, stoßfest), BlenderBall® Edelstahl 316. Shaker mit Druckverschluss und Edelstahl-Design – ideal für Proteinshakes unterwegs."
    );

    await createProdukt(
        "VECH Protein-Shaker-Flasche",
        28.99,
        180,
        "Fitnesszubehör",
        "Hersteller: VECH. Material: Tritan® oder PP-Kunststoff (BPA-frei), Mixkugel (Metall oder Kunststoff). Günstiger Protein-Shaker mit Mixkugel – geeignet für Fitnessstudio und Sport."
    );

    await createProdukt(
        "Voltrix Electric Protein Shaker Bottle",
        19.45,
        100,
        "Fitnesszubehör",
        "Hersteller: Voltrix. Material: Tritan® + PP-Kunststoff, Edelstahl-Mixer, Silikondichtungen. Elektrisch betriebener Protein-Shaker – kabellos wiederaufladbar, automatisches Mixen."
    );

    await createProdukt(
        "ATX® - Power Band",
        24.90,
        150,
        "Fitnesszubehör",
        "Hersteller: ATX. Material: Latexfreier Naturkautschuk (gummi), BPA‑& phthalatfre. Extrem robuste Widerstandsbänder aus Gummi – ideal für Krafttraining, Dehnung und Reha."
    );

    await createProdukt(
        "ZenOne Sports ZenLoops Fabric Fitnessbänder",
        42.90,
        80,
        "Fitnesszubehör",
        "Hersteller: ZenOne Sports. Material: Polyester-Stoff + natürlicher Latex, extra breit & rutschfest. Stoff-Widerstandsbänder in 3 Stärken – für Po-, Bein- und Ganzkörpertraining."
    );

    await createProdukt(
        "Tikaton Stretch-Widerstandsband",
        26.90,
        120,
        "Fitnesszubehör",
        "Hersteller: Tikaton. Material: Naturkautschuk (Gummi). Elastisches Fitnessband zur Verbesserung von Flexibilität, Stabilität und Muskelkraft."
    );

    await createProdukt(
        "Rogue Fitness - Widerstandbänder",
        27.50,
        100,
        "Fitnesszubehör",
        "Hersteller: Rogue Fitness. Material: Natural Latex Rubber (Loop-Bands, z. B. Monster/Shorty). Verschiedene Fitnessgeräte für Zuhause – kompakt und vielseitig einsetzbar."
    );

    await createProdukt(
        "Fringe Sport Fitnessbänder (Set für Yoga, Pilates)",
        39.99,
        70,
        "Fitnesszubehör",
        "Hersteller: Fringe Sport. Material: Natural Rubber / Synthetic Rubber, teils latexfrei. Set aus Widerstandsbändern für Yoga, Pilates und Krafttraining."
    );

    await createProdukt(
        "Serious Steel Klimmzug- & Stretchbänder",
        38.75,
        90,
        "Fitnesszubehör",
        "Hersteller: Serious Steel. Material: latexfreier Synthetic Rubber. Stark belastbare Bänder zur Unterstützung beim Klimmzugtraining und Bodyweight-Übungen."
    );

    await createProdukt(
        "Fit Simplify long bands",
        33.40,
        110,
        "Fitnesszubehör",
        "Hersteller: Fit Simplify. Material: Natural Latex Rubber (Loop-Bands). Extra lange Bänder für Dehnübungen, Reha und funktionelles Training."
    );

    await createProdukt(
        "Persit Ombre Yoga Leggings",
        31.90,
        100,
        "Sportbekleidung",
        "Hersteller: Persit. Material: 65 % Nylon / 25 % Polyester / 10 % Spandex. Nahtlose Leggings mit Ombre-Farbverlauf – elastisch, blickdicht und perfekt für Yoga oder Fitness."
    );

    await createProdukt(
        "Lululemon Damen Mesh Leggings Yoga Leggings",
        45.50,
        75,
        "Sportbekleidung",
        "Hersteller: Lululemon. Material: 77 % Nylon / 23 % Lycra®. Leggings mit atmungsaktiven Mesh-Einsätzen – figurbetont und bequem."
    );

    await createProdukt(
        "Oasis Pure Luxe Leggings mit hoher Taille",
        37.00,
        90,
        "Sportbekleidung",
        "Hersteller: Oasis. Material: 82 % Polyester / 18 % Elastan. Weiche Leggings mit hoher Taille für Komfort und Stil beim Yoga oder Alltagstragen."
    );

    await createProdukt(
        "Nike Universe Medium Support High Waist Leggings",
        40.95,
        85,
        "Sportbekleidung",
        "Hersteller: Nike. Material: 80 % Polyester / 20 % Spandex (Dri-FIT). Leggings mit mittlerem Halt, hoher Taille und Dri-FIT-Technologie für intensives Training."
    );

    await createProdukt(
        "Zella Studio Luxe Pocket Bike Shorts",
        44.95,
        70,
        "Sportbekleidung",
        "Hersteller: Zella. Material: 85 % Nylon / 15 % Spandex. Weiche Biker-Shorts mit praktischen Taschen – ideal für Studio-Workouts."
    );

    await createProdukt(
        "Rogue Halbfinger Handschuhe",
        34.90,
        60,
        "Fitnesszubehör",
        "Hersteller: Rogue. Material Oberhand: ca. 90 % Polyester / 10 % Spandex. Material Handfläche: 100 % Polyurethan (synthetisches Leder). Atmungsaktive Trainingshandschuhe mit offener Fingerpartie – für sicheren Griff beim Krafttraining."
    );

    await createProdukt(
        "Under Armour Weightlifting Gloves",
        41.99,
        50,
        "Fitnesszubehör",
        "Hersteller: Under Armour. Material Oberhand: ca. 82 % Polyester / 18 % Spandex (Iso-Chill). Material Handfläche: 100 % Echtleder. Polsterung an den Handflächen – Schutz vor Blasen und fester Halt bei Hantelübungen."
    );

    await createProdukt(
        "REXCHI Halbfinger-Sport-Trainingshandschuhe",
        13.95,
        120,
        "Fitnesszubehör",
        "Hersteller: REXCHI. Material Oberhand: ca. 100 % Polyester-Mikrofaser. Material Handfläche: ca. 70 % Neopren / 30 % Silikon (Print). Belüftete Handschuhe mit Handgelenkstütze – speziell für Kraftsport und Bodybuilding."
    );

    await createProdukt(
        "Nike Damen Fitness Atmungsaktiv",
        39.99,
        100,
        "Sportbekleidung",
        "Hersteller: Nike. Material: 72% Polyester / 28% Spandex. Atmungsaktives Damen-Fitnessshirt aus Funktionsmaterial – schnelltrocknend und elastisch."
    );

    await createProdukt(
        "Reebok Damen-Kompressionsshirt, kurzärmelig, athletisches",
        19.95,
        80,
        "Sportbekleidung",
        "Hersteller: Reebok. Material: 80% Nylon / 20% Elastan. Kurzärmeliges Kompressionsshirt für Damen – unterstützt die Muskulatur und reduziert Muskelvibrationen."
    );

    await createProdukt(
        "Under Armor Spider Print Herren Sport T-Shirts Fitness Gym",
        49.40,
        70,
        "Sportbekleidung",
        "Hersteller: Under Armour. Material: 90% Polyester / 10% Elastan. Sportshirt mit Spider-Print – atmungsaktiv und ideal für Fitness, Laufen oder Kraftsport."
    );

    await createProdukt(
        "2XU Sport Tank Top",
        22.35,
        90,
        "Sportbekleidung",
        "Hersteller: 2XU. Material: 82% Nylon / 18% Elastan. Ärmelloses Sportshirt für Herren – ideal für Sommer-Workouts und Studioeinsätze."
    );

    await createProdukt(
        "RDX Langarm-Fitness-Kleidung, Kompressionsshirt",
        47.75,
        60,
        "Sportbekleidung",
        "Hersteller: RDX Sports. Material: 75% Polyester / 25% Elastan. Langärmliges Kompressionsshirt – optimal für intensives Training, schnelltrocknend und eng anliegend."
    );

    await createProdukt(
        "Domyos Lauf-T-Shirt für Herren",
        28.75,
        85,
        "Sportbekleidung",
        "Hersteller: Domyos. Material: 88% Polyester / 12% Elasthan. Funktionslaufshirt mit langen Ärmeln – leicht, atmungsaktiv und komfortabel bei kühlerem Wetter."
    );

    await createProdukt(
        "Puma Damen Sommer Sport Laufshorts",
        49.40,
        75,
        "Sportbekleidung",
        "Hersteller: Puma. Material: 85% Polyester / 15% Elasthan. Leichte und atmungsaktive Sportshorts für Damen – mit elastischem Bund und Innenslip."
    );

    await createProdukt(
        "KOMBAT 2-lagige Laufshorts",
        29.55,
        100,
        "Sportbekleidung",
        "Hersteller: KOMBAT. Material: 90% Polyester / 10% Elasthan. 2-in-1 Laufshorts mit Innenkompression und Außenstoff – für zusätzlichen Halt und Flexibilität."
    );

    await createProdukt(
        "ASHION Herren Laufhose Sommer Sport",
        23.89,
        95,
        "Sportbekleidung",
        "Hersteller: ASHION. Material: 88% Polyester / 12% Elasthan. Leichte Herren-Laufshorts mit atmungsaktivem Gewebe – ideal für Sommertraining im Freien, mit Reißverschlusstaschen für praktische Aufbewahrung."
    );

    await createProdukt(
        "Nike Herren Shorts",
        24.77,
        110,
        "Sportbekleidung",
        "Hersteller: Nike. Material: 80% Polyester / 20% Elasthan. Elastische Herren-Trainingsshorts mit schnelltrocknender Dri-FIT-Technologie – perfekter Sitz beim Fitness- oder Ausdauertraining."
    );

    await createProdukt(
        "X-bionic Twyce Damenshorts",
        45.35,
        50,
        "Sportbekleidung",
        "Hersteller: X-Bionic. Material: 75% Polyamid / 25% El Material: 75% Polyamid / 25% Elastan.    Hochwertige Technologie-Laufshorts für Damen – mit Belüftungssystem und kompressivem Halt."
    );

    await createProdukt(
        "PROIRON Weighted Adjustable Skipping Rope",
        35.89,
        80,
        "Fitnesszubehör",
        "Hersteller: Proirion. Material: Griffe: 70% ABS-Kunststoff, 30% Metall; Seil: PVC-ummantelter Stahl. Verstellbares Springseil mit Gewichten in den Griffen, ideal für Cardio- und HIIT-Training."
    );

    await createProdukt(
        "Velites Workout Springseil",
        24.25,
        120,
        "Fitnesszubehör",
        "Hersteller: Velites. Material: Griffe: 85% Kunststoff, 15% Gummi; Seil: Stahlkabel mit PVC-Ummantelung. Klassisches Springseil mit rutschfesten Griffen – geeignet für Fitness- und Ausdauertraining."
    );

    await createProdukt(
        "RENPHO Elektronisches Zähl-Springseil",
        30.35,
        60,
        "Fitnesszubehör",
        "Hersteller: RENPHO. Material: Griffe: ABS-Kunststoff mit Elektronik; Seil: Stahl mit Kunststoffummantelung. Springseil mit digitalem Zähler zur Erfassung von Sprüngen, Kalorien und Trainingszeit."
    );

    await createProdukt(
        "Beast Gear Jump Seil Ultra-speed Skipping Seil Stahldraht",
        31.35,
        70,
        "Fitnesszubehör",
        "Hersteller: Beast Gear. Material: Seil: 100% Stahlkabel; Griffe: Aluminium mit Kunststoffüberzug. Speed Rope mit Stahldrahtkern – ideal für CrossFit, Boxen und schnelles Intervalltraining."
    );

    await createProdukt(
        "Domyos Springseil Basic • Slim Grip",
        11.89,
        150,
        "Fitnesszubehör",
        "Hersteller: Domyos. Material: Griffe: 90% Kunststoff, 10% Gummi; Seil: PVC-beschichtetes Stahlseil. Einfaches, leichtes Springseil mit ergonomischen Slim-Griffen – perfekt für Einsteiger."
    );

    await createProdukt(
        "BARWING 90° Adjustable Weight Bench",
        264.35,
        20,
        "Trainingsgerät",
        "Hersteller: BARWING. Verstellbare Hantelbank mit 7 Rückenlehnen- und 4 Sitzpositionen. Hohe Belastbarkeit bis 800 lb, ideal für Krafttraining zu Hause."
    );

    await createProdukt(
        "ArtSport Multifunktion Hantelbank Set",
        142.99,
        30,
        "Trainingsgerät",
        "Hersteller: ArtSport. Multifunktionale Hantelbank mit Curlpult, Beincurler und Langhantelablage – besonders für Einsteiger geeignet."
    );

    await createProdukt(
        "AtlasStrength Fitness Halterbank",
        292.75,
        15,
        "Trainingsgerät",
        "Hersteller: AtlasStrength. Robuste Flachbank für Heimfitness – stabile Stahlkonstruktion, rutschfeste Standfüße, geeignet für vielfältige Übungen."
    );

    await createProdukt(
        "Bluefin Fitness Weight Hantelbank",
        356.15,
        10,
        "Trainingsgerät",
        "Hersteller: Bluefin Fitness. Faltbare und ergonomische Trainingsbank mit mehreren Positionen – platzsparend und ideal für den Heimgebrauch."
    );

    await createProdukt(
        "GAT SLIM Hantelbank",
        99.95,
        40,
        "Trainingsgerät",
        "Hersteller: GAT. Kompakte Hantelbank mit verstellbarer Rückenlehne – ideal für kleinere Trainingsräume und gezielte Workouts."
    );

    await createProdukt(
        "GORILLA SPORTS® Hantel-Set",
        358.99,
        25,
        "Trainingsgerät",
        "Hersteller: Gorilla Sports. Klassisches Hantelset mit Gewichten – ideal für Krafttraining zuhause. Inkl. Kurzhanteln und Scheiben."
    );

    await createProdukt(
        "GORILLA SPORTS® Hantelbank mit Gewichten",
        332.05,
        20,
        "Trainingsgerät",
        "Hersteller: Gorilla Sports. Hantelbank mit Langhantelablage und Gewichten – geeignet für Bankdrücken, Beincurls und mehr."
    );

    await createProdukt(
        "HOMCOM Adjustable Weight Bench",
        289.75,
        18,
        "Trainingsgerät",
        "Hersteller: HOMCOM. Vielseitige Hantelbank mit einstellbarer Neigung – kombiniert Komfort mit Funktion für effektive Home Workouts."
    );

    await createProdukt(
        "KLARFIT Kraftstation Workout Hero 3000",
        210.25,
        12,
        "Trainingsgerät",
        "Hersteller: Klarfit. Kraftstation mit Zugseilen, Bankdrücken und Curlpult – All-in-One Lösung für Heimtraining."
    );

    await createProdukt(
        "MAXXUS Schrägbank",
        378.99,
        8,
        "Trainingsgerät",
        "Hersteller: MAXXUS. Professionelle Schrägbank mit mehrfach verstellbarer Rückenlehne – für intensives Muskeltraining."
    );

    await createProdukt(
        "XDDIAS Hantelbank",
        205.35,
        22,
        "Trainingsgerät",
        "Hersteller: XDDIAS. Klappbare Hantelbank mit verstellbarer Neigung – platzsparend und schnell einsatzbereit."
    );

    await createProdukt(
        "YOLEO Klappbare Hantelbank Multifunktion",
        314.99,
        14,
        "Trainingsgerät",
        "Hersteller: YOLEO. Multifunktionale Bank mit Neigungsoptionen für Oberkörper-Workouts. Ideal für kleine Trainingsbereiche."
    );
}

async function createAdminAccount() {
    await createBenutzer("admin", "admin", "amdin", "admin", "$2b$12$i2V4lHexLcYzjcUXo30ywuFyRlznGMFNr96T0XqHqgPsF1tJjXl3y", "12345", "admin", "admin", "admin", "admin", 'admin');
    const user = await getUserByUsername("admin");
    user[0].authentifizierung = true
    await updateBenutzer(
        user[0].benutzerid,
        user[0].benutzername,
        user[0].nachname,
        user[0].vorname,
        user[0].email,
        user[0].rolle,
        user[0].kontostatus,
        user[0].plz,
        user[0].ort,
        user[0].strasse,
        user[0].hausnummer,
        user[0].telefonnr,
        user[0].authentifizierung
    );
    await createWarenkorb(user[0].benutzerid);
}