# VITA Stavební úřad – mockup

Vizuální a funkční mockup desktopové aplikace **VITA Stavební úřad** sloužící jako
podklad pro zapracování nové funkcionality (zejména integrace **dotčených orgánů**).
Jde o statické HTML stránky určené k hostování na **GitHub Pages**.

## Struktura adresářů

```
vita-su-mockup/
├── index.html                     # úvodní obrazovka (prázdný seznam zpráv)
├── pages/
│   └── zahajeni-rizeni.html       # detail řízení – formulář (záměr, DO, termíny…)
├── assets/
│   ├── css/
│   │   └── vita.css               # sdílené styly (titulek, menu, toolbar, formulář, modály)
│   └── js/
│       └── vita.js                # sdílená logika (hodiny, toast, zavírání oken klávesou Esc)
├── img/                           # rezerva pro loga / ikony
├── .nojekyll                      # vypne Jekyll na GitHub Pages
└── README.md
```

### Logika rozdělení
- **Společný „chrome"** (titulkový pruh, menu, toolbar, stavový řádek) i všechny komponenty
  (combo boxy, gridy, modální okna) jsou nastylované v jednom `assets/css/vita.css`.
  Změna vzhledu se tak dělá na jednom místě a promítne se do všech stránek.
- **Sdílená drobná logika** (hodiny ve stavovém řádku, toast hlášky, Esc) je v `assets/js/vita.js`.
- **Logika konkrétní obrazovky** (data dotčených orgánů, záložky záměru) zůstává v `<script>`
  uvnitř dané stránky v `pages/` – každá obrazovka je tak samostatná a snadno rozšiřitelná.

## Konvence
- Nová obrazovka = nový soubor v `pages/` (např. `ucastnici.html`, `stanoviska.html`).
- Odkazy uvnitř webu jsou **relativní** (`../assets/...`, `../index.html`), takže web funguje
  jako samostatný repozitář i jako podsložka jiného repozitáře a otevře se i z disku (file://).
- Vnější odkazy (např. tlačítko *Zobrazit BPP (DSŘ)* → prototyp ISSŘ) jsou absolutní URL.

## Spuštění lokálně
Stačí otevřít `index.html` v prohlížeči. Z úvodní obrazovky se přes toolbar **Nový / Oprav / Hledej**
dostanete na detail řízení; křížkem v záhlaví panelu zpět na seznam.

## Publikace na GitHub Pages
1. Obsah složky nahrát do repozitáře (kořen repa = tato složka).
2. *Settings → Pages → Build and deployment → Source: Deploy from a branch*,
   větev `main`, složka `/ (root)`.
3. Web poběží na `https://<uživatel>.github.io/<repozitář>/`.

> Alternativně lze celou složku vložit jako podsložku do stávajícího repozitáře
> (např. `ISSR/vita/`) – díky relativním cestám bude fungovat beze změny.
