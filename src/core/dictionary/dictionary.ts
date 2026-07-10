import { Trie, normalizeWord, isValidDictionaryWord } from './trie';

export interface Dictionary {
  has(word: string): boolean;
  hasPrefix(prefix: string): boolean;
  size: number;
}

class TrieDictionary implements Dictionary {
  constructor(private trie: Trie, public size: number) {}

  has(word: string): boolean {
    const normalized = normalizeWord(word);
    if (!normalized) return false;
    return this.trie.has(normalized);
  }

  hasPrefix(prefix: string): boolean {
    const normalized = prefix.toLowerCase().replace(/[^a-z]/g, '');
    if (!normalized) return true;
    return this.trie.hasPrefix(normalized);
  }
}

let cachedDictionary: Dictionary | null = null;

export async function loadDictionary(): Promise<Dictionary> {
  if (cachedDictionary) return cachedDictionary;

  try {
    const words: string[] = require('../../../assets/dictionary/nl-words.json');
    const filtered = words.filter(isValidDictionaryWord);
    cachedDictionary = new TrieDictionary(Trie.fromWords(filtered), filtered.length);
    return cachedDictionary;
  } catch {
    // Fallback embedded common Dutch words for development
    const fallback = getFallbackWords();
    cachedDictionary = new TrieDictionary(Trie.fromWords(fallback), fallback.length);
    return cachedDictionary;
  }
}

function getFallbackWords(): string[] {
  return [
    'aal', 'aap', 'arm', 'bad', 'bal', 'bed', 'been', 'boek', 'boom', 'brood',
    'deur', 'dier', 'doen', 'eend', 'eet', 'geen', 'glas', 'goed', 'hand', 'huis',
    'jaar', 'kast', 'kat', 'kind', 'koe', 'lang', 'leer', 'lees', 'maan', 'maat',
    'meer', 'melk', 'muis', 'naam', 'neus', 'noor', 'oog', 'oor', 'paar', 'park',
    'peer', 'pen', 'pijn', 'poet', 'raam', 'ring', 'rood', 'room', 'schoen', 'slap',
    'snel', 'soep', 'sta', 'stad', 'steen', 'ster', 'stoel', 'taart', 'tafel', 'tand',
    'tijd', 'tong', 'tuin', 'vis', 'vloer', 'vogel', 'voet', 'vrouw', 'water', 'wolk',
    'woord', 'zee', 'zon', 'zoon', 'zus', 'actie', 'appel', 'auto', 'bank', 'beer',
    'blauw', 'bloem', 'boer', 'brief', 'brug', 'deze', 'ding', 'drink', 'duim', 'eigen',
    'fiets', 'fruit', 'groot', 'groen', 'haar', 'help', 'hond', 'hout', 'klein', 'kleren',
    'koken', 'koud', 'krijg', 'lach', 'lamp', 'leven', 'lief', 'ligg', 'maak', 'mooi',
    'morgen', 'motor', 'nacht', 'natuur', 'neer', 'nieuw', 'noot', 'olie', 'ouder', 'papa',
    'peper', 'plant', 'pluim', 'poort', 'prettig', 'radio', 'regen', 'rijk', 'salade', 'school',
    'slang', 'sneeuw', 'spel', 'spoor', 'staat', 'stap', 'sterk', 'stoep', 'straat', 'stroom',
    'taal', 'taken', 'teken', 'terug', 'thee', 'titel', 'toen', 'trein', 'trui', 'vallen',
    'vandaag', 'veld', 'verf', 'vijf', 'vijver', 'vinden', 'vlak', 'vlieg', 'vriend', 'warm',
    'weten', 'wind', 'winter', 'wolk', 'wonen', 'zacht', 'zaken', 'zelf', 'zilver', 'zitten',
    'aardbei', 'abrikoos', 'achter', 'alleen', 'antwoord', 'apotheek', 'avond', 'bakker', 'bedrag', 'beeld',
    'begin', 'belang', 'bericht', 'beste', 'bezoek', 'bibliotheek', 'blijven', 'bloed', 'boeken', 'breed',
    'brengen', 'broer', 'buurt', 'centrum', 'cijfer', 'contact', 'daar', 'dansen', 'datum', 'denken',
    'derde', 'dieren', 'dinsdag', 'direct', 'doctor', 'dollar', 'dromen', 'duidelijk', 'eenvoud', 'eiland',
    'energie', 'engels', 'ervaring', 'europa', 'feest', 'feestdag', 'figuur', 'film', 'foto', 'fris',
    'gebruik', 'geheim', 'gek', 'geluk', 'gemak', 'genoeg', 'gezicht', 'gezond', 'gras', 'grond',
    'halen', 'herfst', 'historie', 'hobby', 'holland', 'hoofd', 'hoogte', 'hopen', 'hotel', 'huidig',
    'idee', 'iemand', 'iets', 'ijs', 'industrie', 'inhoud', 'inschrijven', 'interessant', 'jagen', 'jaren',
    'jonge', 'jullie', 'kaart', 'kamer', 'kans', 'kantoor', 'kapitein', 'kennis', 'kerk', 'kerstmis',
    'kies', 'kijk', 'kilo', 'klimaat', 'klink', 'knie', 'koning', 'kosten', 'kraan', 'kritiek',
    'kruis', 'kunst', 'kussen', 'laatste', 'lachen', 'ladder', 'land', 'lange', 'laten', 'leden',
    'leerling', 'leggen', 'leiden', 'leren', 'les', 'letter', 'lezen', 'lichaam', 'lid', 'liever',
    'liggen', 'links', 'locatie', 'lopen', 'lucht', 'lunch', 'machine', 'maken', 'manier', 'markt',
    'medisch', 'melodie', 'mening', 'mensen', 'merk', 'meteen', 'meter', 'meubel', 'middag', 'midden',
    'mijl', 'milieu', 'minuut', 'misschien', 'model', 'moment', 'mond', 'muziek', 'naast', 'namen',
    'natie', 'natuurlijk', 'nodig', 'nummer', 'object', 'oceaan', 'officieel', 'olifant', 'onder', 'onderwijs',
    'ongeveer', 'online', 'ontbijt', 'ontdekken', 'onze', 'oogst', 'oosten', 'open', 'operatie', 'orde',
    'organiseren', 'oud', 'overal', 'paard', 'pad', 'pagina', 'pakket', 'paleis', 'pan', 'papier',
    'parfum', 'partij', 'paspoort', 'pauze', 'periode', 'persoon', 'piano', 'pizza', 'plaat', 'plaats',
    'plan', 'plastic', 'plat', 'plein', 'plezier', 'plus', 'politie', 'populair', 'portret', 'positie',
    'post', 'pot', 'praten', 'present', 'prijs', 'prins', 'probleem', 'product', 'programma', 'project',
    'provincie', 'publiek', 'punten', 'raad', 'race', 'reactie', 'rechts', 'reden', 'regel', 'reizen',
    'rekening', 'relatie', 'repareren', 'restaurant', 'resultaat', 'richting', 'rijden', 'risico', 'rivier', 'rok',
    'rond', 'route', 'ruimte', 'salaris', 'salon', 'samen', 'sanitair', 'schaap', 'schaduw', 'schepen',
    'scherp', 'schilder', 'schip', 'schoon', 'schrijven', 'seconde', 'sectie', 'serie', 'service', 'sessie',
    'sfeer', 'shop', 'situatie', 'sluiten', 'smakelijk', 'smile', 'snelweg', 'sociaal', 'software', 'soldaat',
    'sommige', 'soms', 'spannend', 'sparen', 'speciaal', 'spelen', 'spreken', 'springen', 'stadion', 'stand',
    'stappen', 'start', 'station', 'steeds', 'stelen', 'stellen', 'stijl', 'stil', 'stof', 'stok',
    'storing', 'strijd', 'structuur', 'student', 'studie', 'stuk', 'sturen', 'stuur', 'suiker', 'systeem',
    'taak', 'tafels', 'talen', 'tanden', 'tank', 'team', 'techniek', 'telefoon', 'televisie', 'tempo',
    'tennis', 'terras', 'terrein', 'test', 'theater', 'theorie', 'ticket', 'tijger', 'toekomst', 'toestel',
    'tomaten', 'toneel', 'totaal', 'traan', 'traditie', 'training', 'transport', 'trappen', 'trots', 'trouw',
    'tweede', 'typisch', 'uitnodigen', 'uitzicht', 'universiteit', 'uur', 'vakantie', 'vanaf', 'varken', 'veel',
    'veilig', 'verhaal', 'verkeer', 'verkopen', 'verlangen', 'verlaten', 'verliezen', 'vermogen', 'verschil', 'verstand',
    'vertrouwen', 'vervoer', 'verwachten', 'verzamelen', 'vest', 'video', 'villa', 'vincent', 'viool', 'visie',
    'vlinder', 'vlucht', 'voldoende', 'volgen', 'volgende', 'volk', 'vooral', 'voordat', 'voorkomen', 'voorstel',
    'vorm', 'vraag', 'vrij', 'vrijdag', 'vrijheid', 'vroeg', 'vrouwen', 'vuur', 'waarde', 'waarom',
    'wachten', 'wagen', 'wandelen', 'wanneer', 'wapen', 'waren', 'warmte', 'was', 'wassen', 'waterfiets',
    'website', 'week', 'weer', 'wegen', 'wekelijks', 'welkom', 'welke', 'wens', 'wereld', 'werk',
    'westen', 'weten', 'whisky', 'wiel', 'wijn', 'wijs', 'wijk', 'wild', 'winkel', 'winnen',
    'winter', 'wissel', 'woensdag', 'woestijn', 'wolf', 'wonen', 'woon', 'worden', 'worst', 'zadel',
    'zak', 'zanger', 'zaterdag', 'zebra', 'zeggen', 'zeil', 'zeker', 'zeldzaam', 'zelfde', 'zenuw',
    'zero', 'zetten', 'ziekenhuis', 'ziel', 'zijde', 'zingen', 'zink', 'zomer', 'zondag', 'zorg',
    'zuiden', 'zuivel', 'zwaar', 'zware', 'zwart', 'zweet', 'zwemmen', 'abonnement', 'absoluut', 'academie',
    'acceptatie', 'account', 'activiteit', 'administratie', 'advies', 'afbeelding', 'afdeling', 'afspraak', 'afstand', 'agenda',
    'album', 'algemeen', 'ambitie', 'analyse', 'angst', 'annuleren', 'antwoord', 'apparaat', 'archief', 'argument',
    'armband', 'artistiek', 'attractie', 'automatisch', 'avontuur', 'balans', 'basisschool', 'behandeling', 'belasting', 'beloning',
    'benadering', 'bescherming', 'beslissing', 'bespreking', 'bestelling', 'betaling', 'bevestigen', 'beweging', 'bewolking', 'bezoeker',
    'bijzonder', 'biologie', 'blad', 'bliksem', 'bloeddruk', 'boekhandel', 'boodschap', 'brand', 'budget', 'buurman',
    'cadeau', 'calculator', 'campagne', 'capaciteit', 'carriere', 'champion', 'chocolade', 'circulatie', 'collectie', 'combinatie',
    'comfort', 'commissie', 'communicatie', 'competitie', 'computer', 'concept', 'concert', 'conditie', 'conflict', 'constructie',
    'consult', 'container', 'context', 'contract', 'controle', 'conversatie', 'correctie', 'creatief', 'crisis', 'cultuur',
    'curriculum', 'dagblad', 'dagelijks', 'debat', 'decennium', 'decoratie', 'definitie', 'democratie', 'departement', 'design',
    'detail', 'detective', 'diagnose', 'dialect', 'dienst', 'digitaal', 'discipline', 'discussie', 'document', 'dominee',
    'donatie', 'donderdag', 'dossier', 'dramatisch', 'droom', 'economie', 'educatie', 'effect', 'efficient', 'eigenaar',
    'elektriciteit', 'element', 'emotie', 'energiebron', 'engagement', 'entree', 'equivalent', 'essentieel', 'etappe', 'evaluatie',
    'evenement', 'evolutie', 'exact', 'examen', 'exclusief', 'expert', 'explosie', 'expressie', 'extreem', 'fabriek',
    'faculteit', 'familie', 'fantasie', 'fascinerend', 'festival', 'filosofie', 'financieel', 'fitness', 'fluit', 'focus',
    'formulier', 'fotografie', 'fragment', 'frequentie', 'functioneren', 'fundament', 'galerie', 'garage', 'generatie', 'geografie',
    'gerecht', 'geschenk', 'gesture', 'gevolg', 'gevolgd', 'gevolgen', 'gezellig', 'gezondheid', 'gids', 'gitaar',
    'global', 'godsdienst', 'goud', 'governance', 'gratis', 'grens', 'grijze', 'groente', 'groep', 'grot',
    'guitar', 'gymnasium', 'habitat', 'handel', 'handeling', 'handicap', 'handtekening', 'harmonie', 'haven', 'helaas',
    'helder', 'hemel', 'herinnering', 'hero', 'herschrijven', 'hertog', 'historisch', 'hoek', 'holiday', 'horizon',
    'horloge', 'houding', 'huishouden', 'huur', 'huwelijk', 'identiteit', 'illustratie', 'impact', 'impuls', 'incident',
    'individu', 'informatie', 'ingredient', 'initiatief', 'innovatie', 'inspectie', 'inspiratie', 'installatie', 'instelling', 'instrument',
    'integratie', 'intelligent', 'intensief', 'interieur', 'internationaal', 'interpretatie', 'introductie', 'investering', 'invloed', 'inzicht',
    'isolatie', 'journalist', 'jubileum', 'jury', 'justitie', 'juwelen', 'kalender', 'kandidaat', 'kapitaal', 'karakter',
    'karton', 'katholiek', 'keizer', 'kenmerk', 'keramiek', 'kerst', 'keuken', 'keuze', 'kinderen', 'kleding',
    'klacht', 'klant', 'kleding', 'kleur', 'klimaat', 'kliniek', 'klok', 'knop', 'koers', 'kolonie',
    'komst', 'koninklijk', 'koor', 'koper', 'koppel', 'korting', 'kostuum', 'kracht', 'kring', 'kristal',
    'kritisch', 'kroon', 'kwaliteit', 'kwartier', 'laboratorium', 'lading', 'lakens', 'landing', 'landschap', 'lasers',
    'lectuur', 'leger', 'legioen', 'leiding', 'lekkernij', 'leverancier', 'levering', 'lexicon', 'licentie', 'lidmaatschap',
    'limiet', 'linie', 'literatuur', 'logica', 'logistiek', 'lokatie', 'loyaliteit', 'luxe', 'magazine', 'magie',
    'magnetisch', 'majesteit', 'management', 'mand', 'manifest', 'manuscript', 'marathon', 'marmer', 'massa', 'mathematica',
    'maximum', 'mechanisme', 'medicijn', 'meditatie', 'meester', 'memorie', 'menu', 'merkwaardig', 'mes', 'meteorologie',
    'methode', 'migratie', 'militair', 'mineralen', 'minimum', 'minister', 'ministerie', 'missie', 'mix', 'mobiel',
    'modern', 'module', 'monument', 'morele', 'motivatie', 'motorfiets', 'museum', 'mysterie', 'mythe', 'nabij',
    'nadeel', 'narratief', 'nationaal', 'navigatie', 'neerslag', 'negatief', 'netwerk', 'neutraal', 'niche', 'niveau',
    'nobel', 'nominaal', 'normaal', 'notaris', 'notitie', 'novel', 'nuttig', 'observatie', 'oefening', 'officer',
    'olympisch', 'omgeving', 'omstandigheid', 'onderdeel', 'onderneming', 'onderzoek', 'oneindig', 'ontspanning', 'ontwikkeling', 'oogmerk',
    'opbrengst', 'opdracht', 'opening', 'oplossing', 'opmerking', 'opname', 'oppakken', 'optie', 'opvatting', 'organisatie',
    'origineel', 'overeenkomst', 'overheid', 'overleg', 'overlevende', 'overtuiging', 'overwinning', 'pakket', 'paleis', 'parade',
    'paragraaf', 'parallel', 'parlement', 'partner', 'passagier', 'passie', 'patent', 'patient', 'patroon', 'paviljoen',
    'pedagogie', 'penning', 'pension', 'percentage', 'permanent', 'permit', 'perspectief', 'petroleum', 'pilot', 'pionier',
    'piramide', 'plaatselijk', 'planning', 'platform', 'plechtig', 'plugin', 'poema', 'poetisch', 'politiek', 'populatie',
    'portaal', 'portfolio', 'positief', 'potentieel', 'praktijk', 'precies', 'prefect', 'premie', 'presentatie', 'president',
    'prestatie', 'primaire', 'principe', 'prioriteit', 'privilege', 'procedure', 'proces', 'producent', 'professioneel', 'professor',
    'profiel', 'progressie', 'projectie', 'promotie', 'propositie', 'protocol', 'provinciaal', 'psychologie', 'publicatie', 'publiek',
    'kwalificatie', 'kwart', 'kwartier', 'kwetsbaar', 'radar', 'radical', 'radiologie', 'ramp', 'random', 'range',
    'ranking', 'ratio', 'reactie', 'realiteit', 'recept', 'reclame', 'record', 'recreatie', 'redactie', 'referentie',
    'reflectie', 'reform', 'regio', 'registratie', 'rehabilitatie', 'relevant', 'remedie', 'renovatie', 'reparatie', 'repertorium',
    'reporter', 'representatie', 'reproductie', 'republic', 'research', 'reservatie', 'residentie', 'resolutie', 'respect', 'restauratie',
    'revolutie', 'richtlijn', 'rijkdom', 'ritme', 'robot', 'romantisch', 'routine', 'rugby', 'ruim', 'salaris',
    'sanctie', 'satelliet', 'scenario', 'schaal', 'schedule', 'science', 'sculptuur', 'secretaris', 'sectie', 'segment',
    'selectie', 'seminar', 'senior', 'sensatie', 'sensor', 'separatie', 'sequence', 'serieus', 'servies', 'sessie',
    'signaal', 'significant', 'simulatie', 'situatie', 'skelet', 'smaak', 'snapshot', 'sociale', 'software', 'solide',
    'solution', 'sorteren', 'soul', 'source', 'sovereign', 'spannend', 'spectrum', 'speculation', 'spiegel', 'spiritueel',
    'sponsor', 'spontaan', 'sport', 'spotlight', 'spreiding', 'spring', 'stabiliteit', 'stadium', 'standaard', 'statistiek',
    'status', 'stimulus', 'stimulus', 'stimulus', 'stimulus', 'stimulus', 'stimulus', 'stimulus', 'stimulus', 'stimulus',
  ].filter((w, i, arr) => arr.indexOf(w) === i && w.length >= 3);
}

export { normalizeWord, isValidDictionaryWord };
