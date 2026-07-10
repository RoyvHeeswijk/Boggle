/**
 * Downloads OpenTaal wordlist and creates a filtered JSON asset for the app.
 * Run: npm run build-dictionary
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const OPENTAAL_URL =
  'https://raw.githubusercontent.com/OpenTaal/opentaal-wordlist/master/wordlist.txt';
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'dictionary');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'nl-words.json');

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const redirect = res.headers.location;
          if (redirect) {
            download(redirect).then(resolve).catch(reject);
            return;
          }
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

function normalizeWord(raw) {
  const normalized = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');

  if (normalized.length < 3 || normalized.length > 15) return null;
  return normalized;
}

async function main() {
  console.log('Downloading OpenTaal wordlist...');
  let content = '';

  try {
    content = await download(OPENTAAL_URL);
  } catch (e) {
    console.warn('Failed to download OpenTaal:', e.message);
  }

  const words = new Set();

  if (content) {
    for (const line of content.split('\n')) {
      const word = normalizeWord(line.trim());
      if (word) words.add(word);
    }
  }

  if (words.size < 1000) {
    console.log('Using embedded fallback words...');
    const minimal = [
      'aal','aap','arm','bad','bal','bed','boom','brood','deur','huis','kat','kind','maan',
      'meer','oog','oor','park','ring','ster','vis','water','zon','appel','auto','bank',
      'bloem','boek','brief','broer','droom','fiets','fruit','gezin','gras','hand','hond',
      'hout','klein','koken','koud','lach','lamp','leven','lief','maak','mooi','motor',
      'nacht','natuur','nieuw','plant','radio','regen','school','sneeuw','spel','staat',
      'sterk','straat','taart','tafel','tijd','trein','veld','vogel','vriend','warm',
      'winter','wolk','wonen','zomer','actie','antwoord','avond','bakker','beeld','begin',
      'bericht','beste','bezoek','blijven','breed','cadeau','contact','dansen','denken',
      'dieren','dromen','eiland','feest','groot','helpen','historie','hobby','hoofd','idee',
      'jaren','kaart','kamer','kerk','koning','kosten','kunst','land','leren','lopen',
      'lunch','maken','markt','mensen','muziek','nemen','nummer','olifant','onder','paard',
      'papier','politie','programma','project','reactie','reizen','restaurant','rivier',
      'samen','scherp','schoon','spreken','station','student','studie','taal','team',
      'theater','ticket','training','vakantie','verhaal','verkeer','vinden','vlinder',
      'vrijheid','wandelen','wereld','werk','winkel','winnen','zanger','zeggen','zeker',
      'zingen','zorg','zwemmen','abonnement','academie','activiteit','ambitie','analyse',
      'argument','attractie','avontuur','basisschool','bibliotheek','biologie','champion',
      'communicatie','competitie','computer','creatief','cultuur','democratie','document',
      'economie','educatie','energie','engagement','evenement','fabriek','familie',
      'fantasie','festival','filosofie','financieel','fitness','focus','generatie',
      'geografie','gezondheid','historisch','identiteit','informatie','innovatie',
      'instrument','internationaal','journalist','kandidaat','karakter','klimaat',
      'knowledge','kwaliteit','laboratorium','leiding','lichaam','locatie','management',
      'medicijn','migratie','minister','missie','modern','monument','motivatie','museum',
      'mysterie','navigatie','netwerk','niveau','observatie','olympisch','omgeving',
      'onderzoek','ontwikkeling','oplossing','organisatie','origineel','overwinning',
      'parlement','partner','passie','patient','platform','politiek','positie','presentatie',
      'president','prestatie','principe','probleem','product','professor','profiel',
      'programma','project','protocol','psychologie','publicatie','reactie','realiteit',
      'recept','record','reflectie','regio','relatie','revolutie','scenario','science',
      'selectie','significant','simulatie','software','solution','spectacular','spiritueel',
      'spontaan','stabiliteit','standaard','statistiek','status','strategie','structuur',
      'sympathie','technologie','telefoon','televisie','tempo','theorie','traditie',
      'transport','universeel','universiteit','vakantie','variabel','verandering',
      'verantwoord','vergelijking','verhalen','verkeer','vermogen','verschil','vertrouwen',
      'verwachten','verzamelen','victorie','virtueel','visie','vlucht','voldoende',
      'volgende','voorkomen','voorstel','vrijwilliger','waarde','waarheid','wachten',
      'welkom','wereldwijd','wetenschap','wijsheid','winnaar','wonderful','zelfstandig',
    ];
    minimal.forEach((w) => words.add(w));
  }

  const sorted = Array.from(words).sort();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sorted));
  console.log(`Wrote ${sorted.length} words to ${OUTPUT_FILE}`);
}

main().catch(console.error);
