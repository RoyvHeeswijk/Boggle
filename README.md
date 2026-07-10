# Boggle Duel

Realtime 1-tegen-1 Boggle voor twee iPhones. Volledig offline speelbaar via Apple Multipeer Connectivity.

## Features

- Host / Join lobby met instellingen (4×4 / 5×5, speeltijd, Nederlands)
- Realtime multiplayer via Multipeer Connectivity (Bluetooth + P2P WiFi)
- Nederlandse woordenlijst (OpenTaal, 350k+ woorden, offline)
- Swipe-selectie op het bord met directe woordvalidatie
- Unieke woorden scoren dubbel; dubbele woorden 0 punten
- Automatische opslag van elke wedstrijd
- Profiel, statistieken, head-to-head, geschiedenis, achievements, ELO

## Vereisten

- Node.js 20+
- Expo account (gratis) voor EAS Build
- Twee fysieke iPhones (Multipeer werkt niet in de simulator)

## Installatie

```bash
npm install
npm run build-dictionary   # Download OpenTaal woordenlijst (eenmalig)
```

## Ontwikkeling

### iOS dev-build (zonder Mac)

```bash
# Eerste keer: login bij Expo
npx eas login

# Maak development build in de cloud
npm run build:ios

# Installeer de build op je iPhone via de QR-code/link van EAS
# Start daarna de dev server:
npm start
```

### Mock transport (ontwikkeling zonder 2 telefoons)

In development mode staat mock transport standaard aan (Instellingen → Dev: Mock transport).
Hiermee kun je de volledige flow testen op één apparaat.

## Projectstructuur

```
app/                  # Expo Router schermen
src/core/board/       # Bordgenerator + solver
src/core/dictionary/  # Woordenlijst (trie)
src/core/game/        # Game engine + scoring
src/core/elo/         # ELO-rating
src/core/achievements/# Achievement-systeem
src/transport/        # Multipeer + mock transport
src/data/             # SQLite + Drizzle ORM
src/state/            # Zustand stores
src/ui/               # Theme + componenten
assets/dictionary/    # nl-words.json (OpenTaal)
scripts/              # build-dictionary.js
```

## Woordenlijst

De woordenlijst is afkomstig van [Stichting OpenTaal](https://opentaal.org) (BSD / CC BY 3.0).
Bronvermelding staat in Instellingen → Woordenlijst.

## Tech stack

- Expo 57 + React Native + TypeScript
- expo-router, Reanimated, Gesture Handler
- expo-nearby-connections (Multipeer Connectivity)
- expo-sqlite + Drizzle ORM
- Zustand
