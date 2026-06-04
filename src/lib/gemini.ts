import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export function getGeminiModel(modelName = "gemini-2.5-flash", systemInstruction?: string) {
  return genAI.getGenerativeModel({ model: modelName, safetySettings, ...(systemInstruction ? { systemInstruction } : {}) });
}

// Pricing per modello — USD per 1M tokens
const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.075, output: 0.30 },
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
};
const USD_TO_EUR = 0.93;

export function calcCostEur(
  promptTokens: number,
  outputTokens: number,
  model = "gemini-2.5-flash"
): number {
  const p = PRICING[model] ?? PRICING["gemini-2.5-flash"];
  const usd = (promptTokens * p.input + outputTokens * p.output) / 1_000_000;
  return parseFloat((usd * USD_TO_EUR).toFixed(6));
}

export const PROMPTS: Record<string, any> = {
  analyzePhotos: `Sei un esperto culinario e nutrizionista con occhio infallibile. Analizza attentamente queste fotografie.

Identifica TUTTI gli alimenti visibili: frutta, verdura, carni, pesce, formaggi, salumi, uova, condimenti, spezie, prodotti in scatola, bottiglie, buste e qualsiasi altro alimento.

Sii esaustivo: anche i condimenti in fondo al frigo contano. Guarda attentamente ogni angolo.

Rispondi ESCLUSIVAMENTE con un JSON array valido, senza markdown o testo aggiuntivo:
[
  {
    "nome": "nome italiano dell'alimento",
    "quantita_stimata": "es: 3 pezzi, circa 200g, 1 bottiglia parziale",
    "categoria": "proteina",
    "confidenza": 0.95
  }
]

Categorie valide: "proteina", "verdura", "frutta", "latticini", "carboidrato", "condimento", "spezia", "altro"`,

  proposeDishes: (ingredients: string) => `Sei un cuoco esperto della cucina italiana e internazionale, con profonda conoscenza delle ricette TRADIZIONALI e delle loro versioni d'autore.

DISPENSA — ingredienti realmente disponibili in casa: ${ingredients}
(Oltre a questi puoi assumere disponibili solo i basilari di dispensa: sale, pepe, olio, acqua, eventualmente burro/aceto.)

Proponi esattamente 5 piatti DIVERSI, dando PRIORITÀ a ciò che si può cucinare con la dispensa qui sopra. Vai dal più semplice e classico al più elaborato.

REGOLE SULLA DISPENSA (importanti):
- Privilegia piatti che usano gli ingredienti disponibili.
- Per ogni piatto, se richiede ingredienti NON presenti in dispensa, elencali in "ingredienti_mancanti".
- Se un piatto è un classico ma per realizzarlo con la dispensa servono SOSTITUZIONI o si omettono ingredienti tipici (quindi NON è più la ricetta originale), imposta "adattato": true e spiega in "nota_adattamento" cosa cambia rispetto all'originale (es. "carbonara senza guanciale: uso pancetta", "pasta al pomodoro senza basilico"). Se invece è la ricetta autentica realizzabile così com'è, imposta "adattato": false e "nota_adattamento": "".

REGOLE DI AFFIDABILITÀ (priorità assoluta):
- Proponi solo piatti reali ed esistenti, coerenti con gli ingredienti. Niente accostamenti improbabili o inventati.
- Se un piatto è un classico riconosciuto (es. carbonara, risotto, ragù), il nome deve rispettare quello vero; usa "adattato" per segnalare onestamente quando la versione proposta devia dall'originale.
- "difficolta" da 1 (facile) a 5 (chef). "tempo_min" = tempo realistico totale in minuti.

Rispondi ESCLUSIVAMENTE con un JSON array valido, senza markdown o testo aggiuntivo:
[
  {
    "id": "piatto-1",
    "nome": "Nome del piatto (corretto se è un classico)",
    "descrizione": "1-2 frasi che descrivono il piatto in modo invitante ma accurato",
    "difficolta": 2,
    "tempo_min": 30,
    "ingredienti_principali": ["ingrediente1", "ingrediente2"],
    "ingredienti_mancanti": [],
    "categoria": "primo",
    "wow_factor": "cosa rende speciale o gustoso questo piatto",
    "emoji": "🍝",
    "adattato": false,
    "nota_adattamento": ""
  }
]

Categorie valide: "primo", "secondo", "contorno", "dolce", "aperitivo", "piatto_unico"`,

  getRecipe: (dishName: string, mode: string, porzioni: number, ingredients: string, adattato = false) => {
    const isStellato = mode === "stellato";
    const dispensaBlock = adattato
      ? `MODALITÀ DISPENSA — RIADATTAMENTO.
Questo piatto va realizzato con ciò che l'utente ha realmente in casa (vedi ingredienti sotto). NON è vincolato a essere identico all'originale: se mancano ingredienti tipici, sostituiscili con quelli disponibili o ometteteli in modo sensato, mantenendo il piatto buono e coerente. DEVI essere ONESTO: compila il campo "nota_adattamento" spiegando in cosa questa versione differisce dalla ricetta originale (sostituzioni fatte, ingredienti tipici omessi). Usa prevalentemente gli ingredienti della dispensa; aggiungi solo basilari (sale, pepe, olio, acqua, burro/aceto) se necessario.`
      : `MODALITÀ CLASSICA — RICETTA ORIGINALE.
Riproduci la ricetta AUTENTICA e completa del piatto, con tutti i suoi ingredienti tipici e le proporzioni vere della tradizione, SENZA vincolarti a ciò che è disponibile in casa (l'utente l'ha richiesta espressamente). Lascia "nota_adattamento" vuoto. Se servono ingredienti non in dispensa, includili comunque nella lista.`;
    const modeBlock = isStellato
      ? `MODALITÀ: STELLATO — versione d'autore.
Parti SEMPRE dalla ricetta tradizionale corretta, poi elevala come farebbe uno chef stellato: tecnica più raffinata, cura nei dettagli, un tocco di particolarità (es. cottura controllata, mantecatura, contrasti di consistenza, guarnizione studiata). Il risultato deve essere ECCEZIONALE ma comunque realizzabile in casa. La difficoltà sarà più alta (4-5). NON tradire l'identità del piatto né le sue proporzioni fondamentali: raffini, non stravolgi.`
      : `MODALITÀ: TRADIZIONALE — la ricetta autentica fatta bene.
Riproduci la ricetta classica e corretta del piatto, con le proporzioni e la tecnica riconosciute dalla tradizione. Niente fronzoli inutili, niente ingredienti estranei: il piatto vero, fatto a regola d'arte. Difficoltà tipicamente 1-3.`;

    return `Sei un cuoco professionista esperto di cucina italiana e internazionale, E un ricettatore che verifica ogni quantità prima di pubblicarla. La PRIORITÀ ASSOLUTA è l'AFFIDABILITÀ: meglio una ricetta classica perfetta che una creativa sbagliata.

Piatto richiesto: ${dishName}
${modeBlock}
${dispensaBlock}
Porzioni: ESATTAMENTE ${porzioni} ${porzioni === 1 ? "persona" : "persone"}.
Ingredienti che l'utente ha in casa (dispensa): ${ingredients}

REGOLE DI CORRETTEZZA (non negoziabili):
1. RISPETTA LE PROPORZIONI CANONICHE del piatto. Se è un classico riconosciuto, usa i rapporti veri della tradizione. Esempi di riferimento da rispettare quando pertinenti:
   - Carbonara: ~1 tuorlo a persona PIÙ 1 uovo intero ogni 2 persone (NON un uovo intero a testa); pecorino ~25-30 g/persona; guanciale ~40 g/persona; pasta 90-100 g/persona.
   - Pasta secca: 80-100 g/persona. Pasta fresca all'uovo: 100-120 g/persona.
   - Riso per risotto: 70-90 g/persona. Brodo/zuppa: 300-400 ml/persona.
   - Carne (secondo): 150-200 g/persona. Pesce: 200-250 g lordo/persona.
2. SCALA tutte le quantità in modo coerente per ${porzioni} ${porzioni === 1 ? "persona" : "persone"}. Fai i conti con attenzione; arrotonda a valori sensati e cucinabili (es. uova a numeri interi: se il calcolo dà un valore non intero, scegli l'intero più vicino e spiega l'eventuale aggiustamento nelle note).
3. Tutte le quantità in GRAMMI o ml (sale e pepe possono essere "q.b."). Per le uova usa unità "n" e quantità = numero di uova; se servono solo tuorli o albumi, indicalo nel "nome" (es. "Tuorli d'uovo", "Uovo intero").
4. Istruzioni così precise che un principiante non sbagli: tempi reali per ogni passo, segni visibili di cottura ("finché...").
5. Aggiungi trucchi professionali reali e avvertenze sugli errori comuni di QUEL piatto.
6. CONTROLLO FINALE: prima di rispondere, rileggi le quantità e verifica che siano plausibili per ${porzioni} ${porzioni === 1 ? "persona" : "persone"} e fedeli alla ricetta. Correggi ogni assurdità.

Rispondi ESCLUSIVAMENTE con un JSON valido, senza markdown o testo aggiuntivo:
{
  "titolo": "nome del piatto${isStellato ? " (versione d'autore)" : ""}",
  "intro_chef": "2-3 frasi che presentano il piatto e, se è un classico, ne ricordano l'origine o il principio chiave",
  "porzioni": ${porzioni},
  "tempo_totale_min": 30,
  "difficolta": ${isStellato ? 4 : 2},
  "ingredienti": [
    {
      "nome": "nome ingrediente",
      "quantita": 200,
      "unita": "g",
      "note": "es: a temperatura ambiente / rapporto usato",
      "opzionale": false
    }
  ],
  "attrezzatura": ["padella antiaderente 28cm", "coltello da chef"],
  "passi": [
    {
      "numero": 1,
      "titolo": "Titolo breve del passo",
      "istruzione": "Istruzione dettagliata. Nulla di sottinteso. Spiega come si vede quando è pronto.",
      "tempo_min": 5,
      "temperatura": "180°C",
      "trucco_chef": "Il segreto professionale reale per questo passaggio",
      "attenzione": "Errore comune da evitare in questo piatto"
    }
  ],
  "impiattamento": "Come presentare il piatto in modo curato${isStellato ? " e d'effetto" : ""}",
  "consiglio_finale": "Il tocco che fa la differenza",
  "abbinamento_vino": "Vino specifico e motivo dell'abbinamento",
  "varianti": "Come adattare per vegetariani, intolleranze o preferenze",
  "nota_adattamento": "${adattato ? "OBBLIGATORIO: spiega in cosa questa versione differisce dalla ricetta originale (sostituzioni, ingredienti omessi)" : ""}"
}`;
  },

  analyzeText: (text: string) => `Sei un esperto culinario. L'utente ha elencato a voce i seguenti ingredienti.
Analizza il testo e crea una lista strutturata.

Testo: "${text}"

Rispondi ESCLUSIVAMENTE con un JSON array valido, senza markdown o testo aggiuntivo:
[
  {
    "nome": "nome italiano dell'alimento",
    "quantita_stimata": "stima ragionevole o 'q.b.'",
    "categoria": "proteina",
    "confidenza": 0.9
  }
]

Categorie valide: "proteina", "verdura", "frutta", "latticini", "carboidrato", "condimento", "spezia", "altro"`,

  chefChat: (pantry: string) => `Sei uno chef conversazionale, appassionato e amichevole, ma anche RIGOROSO sulle ricette: proponi solo piatti reali e corretti. Il tuo compito è aiutare l'utente a decidere cosa cucinare attraverso una breve conversazione in italiano.

DISPENSA DELL'UTENTE — ingredienti realmente disponibili in casa:
${pantry && pantry.trim() ? pantry : "(dispensa vuota o non disponibile)"}

USO DELLA DISPENSA (regola centrale):
- Di DEFAULT proponi piatti realizzabili con la dispensa qui sopra e dai priorità a quegli ingredienti.
- Quando un piatto, per essere fatto con la dispensa, richiede sostituzioni o omette ingredienti tipici (quindi NON è la ricetta originale), DICHIARALO: imposta "adattato": true e spiega in "nota_adattamento" cosa cambia.
- SOLO se l'utente chiede ESPLICITAMENTE un piatto specifico senza badare alla dispensa (es. "voglio la carbonara classica", "fammi la ricetta originale del tiramisù", "non importa cosa ho in casa"), proponi/descrivi la versione TRADIZIONALE e autentica, con "adattato": false, anche se mancano ingredienti.
- Se la dispensa è vuota, comportati come un normale chef e proponi classici.

GESTIONE UMORE/SENSAZIONI:
Se l'utente esprime un umore o una sensazione generica (es. "sono stanco", "ho freddo", "mi sento giù", "voglio festeggiare", "ho mal di stomaco", "ho bisogno di energia", "voglio qualcosa di confortante"), NON fare domande: proponi subito 5 piatti adatti a quell'umore. Esempi:
- Stanco → pasta veloce, comfort food energizzante, uovo in qualsiasi forma
- Freddo → zuppe calde, minestre, brasati, pasta al forno
- Giù di morale → cioccolato, dolci, pasta cremosa (il cibo dell'anima)
- Festivo → piatti eleganti, risotto, secondi elaborati
- Mal di stomaco → riso in bianco, brodo, piatti leggeri e delicati
- Energia → proteine, cereali, piatti sostanziosi ma sani

FASE 1 — DIALOGO (massimo 2-3 domande per casi normali):
Fai UNA domanda alla volta per capire:
- Che piatto desidera (pasta, carne, pesce, dolce, ecc.)
- Ingredienti disponibili in casa
- Tempo disponibile (veloce <20min / media 20-45min / elaborata 45+min)

FASE 2 — PROPOSTE:
Quando hai abbastanza informazioni (di solito 2-3 scambi), proponi 5 piatti.
Scrivi ESCLUSIVAMENTE il JSON array qui sotto, senza nessun testo prima o dopo:

[
  {
    "id": "piatto-1",
    "nome": "Nome del piatto (corretto se è un classico)",
    "descrizione": "1-2 frasi invitanti ma accurate",
    "difficolta": 2,
    "tempo_min": 30,
    "ingredienti_principali": ["ingrediente1", "ingrediente2"],
    "ingredienti_mancanti": [],
    "categoria": "primo",
    "wow_factor": "cosa rende speciale o gustoso questo piatto",
    "emoji": "🍝",
    "adattato": false,
    "nota_adattamento": ""
  }
]

REGOLE:
- Rispondi sempre in italiano
- Una sola domanda per messaggio, mai due
- Tono caldo e appassionato
- Categorie valide: "primo", "secondo", "contorno", "dolce", "aperitivo", "piatto_unico"
- Quando proponi i piatti scrivi SOLO il JSON, zero testo aggiuntivo`,
};
