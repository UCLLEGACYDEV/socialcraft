export interface BatchDayTemplate {
  day: number;
  week: number;
  theme: string;
  hook: string;
  pillar: "tips" | "mindset" | "case_study" | "viral" | "framework";
  pillarLabel: string;
  headline: string;
  slides: {
    headline: string;
    subtext: string;
    visualPrompt: string;
  }[];
  universalCaption: string;
  hashtags: string[];
}

export interface NichePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  targetAudience: string;
  defaultHashtags: string[];
  days: BatchDayTemplate[];
}

export const BATCH_NICHE_PRESETS: NichePreset[] = [
  {
    id: "b2b_sales",
    name: "💼 B2B, Coaching & Agenturen",
    icon: "💼",
    description: "High-Ticket Sales, Systeme, Kundengewinnung & Skalierung",
    targetAudience: "Selbstständige, Gründer, Coaches & Agenturinhaber",
    defaultHashtags: ["#b2b #business #sales #agentur #unternehmertum"],
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const week = Math.floor(i / 7) + 1;
      const pillars = ["tips", "mindset", "case_study", "viral", "framework"] as const;
      const pillar = pillars[i % pillars.length];
      const pillarLabels = {
        tips: "💡 Praxis-Tipp",
        mindset: "🧠 Mindset",
        case_study: "📈 Case Study",
        viral: "⚡ Viral Hook",
        framework: "🛠️ Framework",
      };

      const topics = [
        "Warum Kaltakquise 2026 anders funktioniert",
        "Das 3-Stufen-System für planbare Anfragen",
        "Wie du Einwände im Erstgespräch auflöst",
        "Der größte Fehler bei High-Ticket Angeboten",
        "Vom Freelancer zur 6-stelligen Agentur",
        "Warum Systeme Motivation immer schlagen",
        "Die perfekte Closing-Frage",
        "Lead-Generierung ohne Werbebudget",
        "Preise verdoppeln ohne Kunden zu verlieren",
        "Die 80/20 Regel im B2B Vertrieb",
        "Automatisiere dein Onboarding",
        "Warum deine Landingpage nicht konvertiert",
        "Kundenbindung: Vom Einmalkäufer zum Stammkunden",
        "Das perfekte Erstgesprächs-Skript",
        "Wie du Expertenstatus auf Social Media aufbaust",
        "Die 5 KPIs, die jeder Agenturinhaber tracken muss",
        "Warum mehr Leads dein Problem nicht lösen",
        "Skalieren ohne 80-Stunden-Woche",
        "Die Psychologie von Kaufentscheidungen",
        "Positionierung schlägt Reichweite",
        "Kündigungen minimieren durch Churn-Prävention",
        "Wie du Mitarbeiter zu A-Playern machst",
        "Dein Sales-Funnel in 4 Schritten",
        "Warum Discounting deine Marke zerstört",
        "Das Geheimnis hinter 90% Abschlussquote",
        "Outbound vs. Inbound: Was 2026 gewinnt",
        "Dein Jahresplan in 90-Tage Sprints",
        "Case Study: Von 0 auf 50k Monatsumsatz",
        "Die Kunst des Follow-ups",
        "Dein 30-Tage Wachstums-Blueprint",
      ];

      const topic = topics[i] || `B2B Wachstumsstrategie Tag ${day}`;

      return {
        day,
        week,
        theme: topic,
        hook: `Die meisten scheitern nicht am Angebot – sondern an diesem Detail: ${topic}.`,
        pillar,
        pillarLabel: pillarLabels[pillar],
        headline: topic,
        slides: [
          {
            headline: topic,
            subtext: "Der entscheidende Unterschied zwischen Stagnation und planbarem Wachstum.",
            visualPrompt: `Minimalist modern 3D abstract obsidian structure with violet rim light, dark studio background, cinematic lighting — ${topic}`,
          },
          {
            headline: "Der Schlüssel zur Umsetzung",
            subtext: "Baue ein wiederholbares System, das unabhängig von deiner Tagesform funktioniert.",
            visualPrompt: `Geometric metallic mechanisms in motion, neon violet glow, deep shadows, ultra-detailed render — Slide 2`,
          },
          {
            headline: "Dein nächster Schritt",
            subtext: "Speichere diesen Beitrag ab und wende diesen Hebel heute noch in deinem Business an.",
            visualPrompt: `Sleek monolith with glowing core, luxury dark violet gradient, sharp reflections — Call to action`,
          },
        ],
        universalCaption: `Erfolg im B2B-Business ist kein Zufall, sondern das Ergebnis wiederholbarer Systeme.\n\n${topic}:\n🔹 Fokus auf messbare Ergebnisse\n🔹 Klare Prozesse statt Bauchgefühl\n🔹 Konsequente Umsetzung Tag für Tag\n\n💬 Wie setzt du das aktuell um? Schreibe es in die Kommentare.\n\n📌 Speichere dir diesen Post für deine nächste Strategie-Session ab! 🚀`,
        hashtags: ["#b2b", "#business", "#growth", "#sales", "#socialcraft"],
      };
    }),
  },

  {
    id: "fitness_health",
    name: "🏋️ Fitness, Gesundheit & Ernährung",
    icon: "🏋️",
    description: "Muskelaufbau, Fettabbau, Routinen, Transformation & Ernährung",
    targetAudience: "Vielbeschäftigte Menschen, Sportler & Gesundheitsbewusste",
    defaultHashtags: ["#fitness #gesundheit #muskelaufbau #fettabbau #mindset"],
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const week = Math.floor(i / 7) + 1;
      const pillars = ["tips", "mindset", "case_study", "viral", "framework"] as const;
      const pillar = pillars[i % pillars.length];
      const pillarLabels = {
        tips: "🥗 Ernährungs-Tipp",
        mindset: "🔥 Motivation",
        case_study: "🏆 Transformation",
        viral: "⚡ Mythos",
        framework: "🏋️ Trainings-Plan",
      };

      const topics = [
        "Warum Cardio allein kein Bauchfett verbrennt",
        "Die 3 besten Proteinquellen für den Alltag",
        "Wie du Heißhunger in 5 Minuten stoppst",
        "Der größte Fehler beim Muskelaufbau",
        "Schlaf & Regeneration: Der unterschätzte Hebel",
        "Progressive Overload einfach erklärt",
        "Warum Diäten ohne Kaloriendefizit scheitern",
        "Meal Prep für Vielbeschäftigte in 30 Min",
        "Kreatin: Mythen vs. Fakten",
        "Die optimale Pausenzeit zwischen Sätzen",
        "Wie du trotz stressigem Job in Form bleibst",
        "Warum Muskelkater kein Maßstab für Erfolg ist",
        "Die besten Übungen für einen starken Rücken",
        "Wasserhaushalt & Leistungsfähigkeit",
        "Alkohol & Muskelaufbau: Die Wahrheit",
        "Wie du Plateaus beim Abnehmen durchbrichst",
        "Gelenkschonendes Training ab 30",
        "Die 80/20 Regel für gesunde Ernährung",
        "Warum Konstanz wichtiger ist als Perfektion",
        "Der richtige Umgang mit Cheat Meals",
        "Morgenroutine für maximalen Fokus & Energie",
        "Supplemente: Was wirklich wirkt und was Geldverschwendung ist",
        "Krafttraining vs. HIIT: Was verbrennt mehr?",
        "Wie du deinen Stoffwechsel nachhaltig anregst",
        "Mobility-Übungen gegen Verspannungen",
        "Die Psychologie hinter gesunden Gewohnheiten",
        "Case Study: 10kg Fettabbau ohne Hungern",
        "Warum mehr Training nicht immer mehr bringt",
        "Darmgesundheit & Energielevel",
        "Dein 30-Tage Transformations-Blueprint",
      ];

      const topic = topics[i] || `Fitness & Health Tag ${day}`;

      return {
        day,
        week,
        theme: topic,
        hook: `Stoppe diesen Fehler: ${topic} hält dich von deinen Zielen ab.`,
        pillar,
        pillarLabel: pillarLabels[pillar],
        headline: topic,
        slides: [
          {
            headline: topic,
            subtext: "Einfache Prinzipien, die wissenschaftlich belegt sind und nachhaltig funktionieren.",
            visualPrompt: `Athletic dynamic aesthetic 3D sculptured form with neon emerald and violet light, clean dark background — ${topic}`,
          },
          {
            headline: "Die Lösung für deinen Alltag",
            subtext: "Fokussiere dich auf die 20% der Gewohnheiten, die 80% deiner Ergebnisse bringen.",
            visualPrompt: `Clean glowing health metrics and energetic 3D pulse wave, dark obsidian lighting — Slide 2`,
          },
          {
            headline: "Starte heute",
            subtext: "Speichere dir diesen Guide ab und setze den Tipp bei deinem nächsten Workout um.",
            visualPrompt: `Modern victory aesthetic, subtle glowing triumph symbol, dark cinematic studio — Call to action`,
          },
        ],
        universalCaption: `Ein gesunder Körper und maximale Energie entstehen durch tägliche Micro-Habits.\n\n${topic}:\n🔹 Klare Routinen etablieren\n🔹 Auf Regeneration & Schlaf achten\n🔹 Kontinuität schlägt Intensität\n\n💬 Was ist deine größte Hürde aktuell? Schreib es in die Kommentare.\n\n📌 Speichere dir diesen Beitrag für dein nächstes Training ab! 🚀`,
        hashtags: ["#fitness", "#gesundheit", "#lifestyle", "#training", "#socialcraft"],
      };
    }),
  },

  {
    id: "finance_crypto",
    name: "💰 Finanzen, Krypto & Vermögensaufbau",
    icon: "💰",
    description: "Investieren, Cashflow, Krypto, Aktien & Finanz-Mindset",
    targetAudience: "Investoren, Sparer & finanzinteressierte Einsteiger",
    defaultHashtags: ["#finanzen #investieren #krypto #aktien #vermögensaufbau"],
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const week = Math.floor(i / 7) + 1;
      const pillars = ["tips", "mindset", "case_study", "viral", "framework"] as const;
      const pillar = pillars[i % pillars.length];
      const pillarLabels = {
        tips: "💡 Investment-Tipp",
        mindset: "🧠 Money Mindset",
        case_study: "📊 Analyse",
        viral: "⚡ Markt-Fakt",
        framework: "📈 Strategie",
      };

      const topics = [
        "Der Zinseszinseffekt: Das 8. Weltwunder",
        "Warum Sparbuch-Geld real an Wert verliert",
        "Die 50-30-20 Budget-Regel im Praxistest",
        "ETFs vs. Einzelaktien: Was für dich passt",
        "Krypto Grundlagen: Bitcoin Halving erklärt",
        "Wie du emotionale Fehlinvestitionen vermeidest",
        "Die 3 Säulen passiven Einkommens",
        "Notgroschen: Wie viel Cash du wirklich brauchst",
        "Diversifikation: So schützt du dein Depot",
        "Warum Timing the Market fast immer scheitert",
        "Dollar-Cost-Averaging (DCA) Sparplan-Power",
        "Inflation verstehen und dein Vermögen sichern",
        "Die häufigsten Fehler von Krypto-Anfängern",
        "Immobilien als Kapitalanlage: Vor- und Nachteile",
        "Steueroptimierung für Privatanleger",
        "Wie Millionäre ihr Geld wirklich verteilen",
        "Die Psychologie von Bullen- und Bärenmärkten",
        "Dividenden-Strategie: Rendite ohne Verkauf",
        "Warum Konsumschulden dich arm halten",
        "Web3 & Blockchain: Was 2026 wichtig wird",
        "Risk-Reward-Ratio: Chancen vs. Risiken kalkulieren",
        "Cashflow-Quadranten nach Robert Kiyosaki",
        "Automatisierter Vermögensaufbau mit Daueraufträgen",
        "Warum Gold und Sachwerte als Hedge dienen",
        "Finanzielle Freiheit: Wie viel Kapital du brauchst",
        "Die 4 Phasen eines Marktzyklus",
        "Case Study: 500€ monatlich investiert über 15 Jahre",
        "Der Unterschied zwischen Vermögenswerten und Verbindlichkeiten",
        "Smart Contract Sicherheit & Wallet-Schutz",
        "Dein 30-Tage Finanz-Blueprint",
      ];

      const topic = topics[i] || `Finanzstrategie Tag ${day}`;

      return {
        day,
        week,
        theme: topic,
        hook: `Warum die meisten Menschen arm bleiben: ${topic}.`,
        pillar,
        pillarLabel: pillarLabels[pillar],
        headline: topic,
        slides: [
          {
            headline: topic,
            subtext: "Lerne, wie Geld wirklich funktioniert und lass dein Kapital für dich arbeiten.",
            visualPrompt: `Futuristic golden and obsidian digital coin sphere, dark luxury aesthetic, sharp reflections, violet neon backlight — ${topic}`,
          },
          {
            headline: "Das System dahinter",
            subtext: "Vermögensaufbau ist keine Magie, sondern Mathematik und langfristige Disziplin.",
            visualPrompt: `3D financial chart graph climbing into infinity, glowing trendline, dark glassmorphism — Slide 2`,
          },
          {
            headline: "Sichere deine Zukunft",
            subtext: "Speichere diesen Beitrag ab und starte noch heute mit deinem automatisierten Sparplan.",
            visualPrompt: `Minimalist vault monolith with glowing cyber core, luxury dark violet studio — Call to action`,
          },
        ],
        universalCaption: `Vermögen wird nicht im Casino aufgebaut, sondern durch kluge Entscheidungen und Zeit.\n\n${topic}:\n🔹 Langfristig denken statt kurzfristig zocken\n🔹 Automatisierte Sparraten etablieren\n🔹 Emotionen aus Investment-Entscheidungen heraushalten\n\n💬 Wie investierst du aktuell? Teile deine Meinung in den Kommentaren.\n\n📌 Speichere dir diesen Post für deine Finanzplanung ab! 🚀`,
        hashtags: ["#finanzen", "#investieren", "#krypto", "#geld", "#socialcraft"],
      };
    }),
  },

  {
    id: "mindset_productivity",
    name: "🧠 Mindset, Produktivität & Karriere",
    icon: "🧠",
    description: "Fokus, Deep Work, Gewohnheiten, Resilienz & High Performance",
    targetAudience: "High-Performer, Angestellte, Leader & Kreative",
    defaultHashtags: ["#mindset #produktivität #fokus #erfolg #persönlichkeitsentwicklung"],
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const week = Math.floor(i / 7) + 1;
      const pillars = ["tips", "mindset", "case_study", "viral", "framework"] as const;
      const pillar = pillars[i % pillars.length];
      const pillarLabels = {
        tips: "⚡ Deep Work Tipp",
        mindset: "🧠 Mindset Shift",
        case_study: "🎯 Habit Blueprint",
        viral: "🔥 Unbequeme Wahrheit",
        framework: "⏱️ Zeit-Management",
      };

      const topics = [
        "Warum Motivation eine Illusion ist",
        "Die 2-Minuten-Regel gegen Prokrastination",
        "Deep Work: Wie du 4 Stunden konzentriert arbeitest",
        "Das Eisenhower-Prinzip für echte Prioritäten",
        "Dopamin-Detox: So gewinnst du deinen Fokus zurück",
        "Die Macht von Mikrogewohnheiten (Atomic Habits)",
        "Warum Multitasking dein Gehirn verlangsamt",
        "Nein sagen ohne schlechtes Gewissen",
        "Die 80/20 Regel für deinen Arbeitstag",
        "Wie du mentale Erschöpfung (Burnout) verhinderst",
        "Morgenroutine: Ohne Smartphone in den Tag starten",
        "Die Kunst des Timeblockings",
        "Warum Feedback das Frühstück der Champions ist",
        "Imposter-Syndrom überwinden",
        "Wie du schwierige Gespräche souverän führst",
        "Resilienz: Rückschläge als Sprungbrett nutzen",
        "Die 5-Sekunden-Regel für schnelle Entscheidungen",
        "Warum Perfektionismus die größte Bremse ist",
        "Lese-Gewohnheiten: 1 Buch pro Woche verstehen",
        "Wie du dein Umfeld für Erfolg optimierst",
        "Digitale Ordnung: Inbox Zero und Clean Desktop",
        "Die Psychologie von Willenskraft & Energielevel",
        "Warum Pausen deine Produktivität steigern",
        "Zielsetzung mit der SMART-Methode",
        "Wie du negative Gedankenmuster auflöst",
        "Die Macht von Selbstreflexion am Sonntagabend",
        "Case Study: Von Chaos zu 4-Tage-Fokus",
        "Warum Disziplin Freiheit bedeutet",
        "Die Kunst des aktiven Zuhörens",
        "Dein 30-Tage High-Performance Blueprint",
      ];

      const topic = topics[i] || `Mindset & Fokus Tag ${day}`;

      return {
        day,
        week,
        theme: topic,
        hook: `Die erfolgreichsten 1% machen diese Sache fundamental anders: ${topic}.`,
        pillar,
        pillarLabel: pillarLabels[pillar],
        headline: topic,
        slides: [
          {
            headline: topic,
            subtext: "Disziplin ist nicht das, was du fühlst – sondern worauf du dich verlässt.",
            visualPrompt: `Abstract 3D crystal brain with glowing violet neural pathways, dark reflective studio background — ${topic}`,
          },
          {
            headline: "Der mentale Hebel",
            subtext: "Verändere deine Identität und deine Gewohnheiten folgen automatisch.",
            visualPrompt: `Sleek hourglass with glowing sand particles, dark purple rim light — Slide 2`,
          },
          {
            headline: "Setze es heute um",
            subtext: "Speichere diesen Beitrag ab und starte deine nächste Deep-Work-Session fokussiert.",
            visualPrompt: `Minimalist glowing monolith beacon, sharp cinematic violet lighting — Call to action`,
          },
        ],
        universalCaption: `Du wirst nicht das, was du dir wünschst – du wirst das, was du täglich tust.\n\n${topic}:\n🔹 Klare Grenzen setzen\n🔹 Deep Work Blöcke im Kalender blockieren\n🔹 Fokus vor Aktionismus\n\n💬 Welcher Punkt hilft dir am meisten? Schreibe es in die Kommentare.\n\n📌 Speichere dir diesen Post für deinen nächsten Produktivitäts-Boost ab! 🚀`,
        hashtags: ["#mindset", "#produktivität", "#fokus", "#erfolg", "#socialcraft"],
      };
    }),
  },

  {
    id: "ai_tech_tools",
    name: "🤖 KI, Tech & Automation",
    icon: "🤖",
    description: "KI-Workflows, Automatisierung, No-Code, Prompt Engineering & SaaS",
    targetAudience: "Tech-Enthusiasten, Marketer, Entwickler & Gründer",
    defaultHashtags: ["#ki #ai #automation #tech #promptengineering"],
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const week = Math.floor(i / 7) + 1;
      const pillars = ["tips", "mindset", "case_study", "viral", "framework"] as const;
      const pillar = pillars[i % pillars.length];
      const pillarLabels = {
        tips: "🛠️ Tool-Tipp",
        mindset: "🚀 AI Zukunft",
        case_study: "⚡ Workflow",
        viral: "🔥 AI Hack",
        framework: "🤖 Prompt Guide",
      };

      const topics = [
        "5 KI-Tools, die dir 10 Stunden pro Woche sparen",
        "Der perfekte Prompt-Aufbau für ChatGPT & Claude",
        "Wie du Social-Media-Posts mit KI automatisierst",
        "Make.com vs. Zapier: Die beste Automation",
        "Die Zukunft von AI Agents im Jahr 2026",
        "Wie du KI als Sparringspartner für Strategie nutzt",
        "Bilder generieren in Studio-Qualität: Prompt-Formeln",
        "Kundenservice mit KI-Chatbots automatisieren",
        "Die 3 größten Fehler beim Prompt Engineering",
        "Wie du Audio & Video mit KI skalierst",
        "No-Code Apps bauen in unter 24 Stunden",
        "KI-gestützte Marktforschung in 5 Minuten",
        "Automatisierte Lead-Qualifizierung mit AI",
        "Wie KI deine Content-Recherche revolutioniert",
        "Open-Source AI Modelle auf eigenem Rechner",
        "Die besten Browser-Erweiterungen für AI",
        "Datenschutz & Sicherheit bei KI-Tools",
        "Wie du ein individuelles GPT für dein Business baust",
        "Von der Idee zum fertigen Karussell per KI",
        "Automatisierte E-Mail-Workflows mit LLMs",
        "Warum KI Menschen nicht ersetzt – sondern Menschen mit KI",
        "Die besten AI Tools für Bild- & Videobearbeitung",
        "KI-gestützte SEO & Content-Optimierung",
        "Voice Clones & KI-Avatare im Marketing",
        "Prompt Chains für komplexe Business-Tasks",
        "Die Roadmap für KI-Integration in dein Unternehmen",
        "Case Study: 30 Tage Content in 1 Stunde erstellt",
        "Wie du KI für Code-Generierung & Debugging nutzt",
        "Die nächsten Megatrends in Artificial Intelligence",
        "Dein 30-Tage AI-Automations-Blueprint",
      ];

      const topic = topics[i] || `KI & Tech Tool Tag ${day}`;

      return {
        day,
        week,
        theme: topic,
        hook: `Vergiss mühsame manuelle Arbeit: ${topic} verändert alles.`,
        pillar,
        pillarLabel: pillarLabels[pillar],
        headline: topic,
        slides: [
          {
            headline: topic,
            subtext: "Nutze die neuesten KI-Tools und baue Workflows, die dir massive Zeitvorteile verschaffen.",
            visualPrompt: `Futuristic glowing cybernetic interface orb, hyper-detailed circuit pathways with violet neon lights, dark matte background — ${topic}`,
          },
          {
            headline: "Der Workflow-Hebel",
            subtext: "Verbinde clevere Prompts mit automatisierten Pipelines für maximale Produktivität.",
            visualPrompt: `Holographic floating data nodes connected by violet laser beams, dark futuristic tech lab — Slide 2`,
          },
          {
            headline: "Automatisiere jetzt",
            subtext: "Speichere diesen Beitrag ab und implementiere den Workflow noch heute.",
            visualPrompt: `Sleek high-tech cyber monolith with glowing core, cinematic studio illumination — Call to action`,
          },
        ],
        universalCaption: `Wer KI 2026 nicht für seine Workflows nutzt, verliert jeden Tag wertvolle Stunden.\n\n${topic}:\n🔹 Zeitersparnis durch smarte Automatisierung\n🔹 Höhere Output-Qualität bei weniger Stress\n🔹 Zukunftssichere Workflows etablieren\n\n💬 Welches KI-Tool nutzt du aktuell am meisten? Teile es in den Kommentaren.\n\n📌 Speichere dir diesen Post für dein nächstes Tech-Setup ab! 🚀`,
        hashtags: ["#ki", "#ai", "#tech", "#automation", "#socialcraft"],
      };
    }),
  },

  {
    id: "ecommerce_d2c",
    name: "🛍️ E-Commerce & D2C Brands",
    icon: "🛍️",
    description: "Shop-Conversion, Ads, Produkt-Launches, UGC & Kundenbindung",
    targetAudience: "Online-Shop-Inhaber, E-Com Gründer & D2C Brands",
    defaultHashtags: ["#ecommerce #onlineshop #d2c #marketing #branding"],
    days: Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const week = Math.floor(i / 7) + 1;
      const topic = `E-Commerce Conversion Hebel Tag ${day}`;
      return {
        day,
        week,
        theme: topic,
        hook: `Warum 95% der Online-Shops scheitern: ${topic}.`,
        pillar: "tips",
        pillarLabel: "🛒 Shop-Tipp",
        headline: topic,
        slides: [
          {
            headline: topic,
            subtext: "Steigere deinen Warenkorbwert und senke deine Werbekosten durch smarte Hooks.",
            visualPrompt: `Luxury 3D product showcase podium with violet ambient lighting, clean reflections, dark studio — ${topic}`,
          },
          {
            headline: "Conversion Hebel",
            subtext: "Vertrauen und Social Proof sind die stärksten Treiber für Verkäufe.",
            visualPrompt: `Floating minimalist packaging with sleek holographic highlights, dark violet gradient — Slide 2`,
          },
          {
            headline: "Umsatz steigern",
            subtext: "Speichere diesen Beitrag ab und optimiere deinen Shop noch heute.",
            visualPrompt: `Futuristic trophy monolith, glowing violet accents, dark luxury backdrop — Call to action`,
          },
        ],
        universalCaption: `Erfolgreiche Online-Shops leben von starkem Branding und messbaren Conversion-Hebel.\n\n${topic}:\n🔹 Schneller Checkout & Vertrauen\n🔹 Unwiderstehliche Produkt-Präsentation\n🔹 Maximale Kundenbindung\n\n💬 Welches Produkt verkaufst du? Schreib es in die Kommentare.\n\n📌 Speichere dir diesen Post für dein E-Com Business ab! 🚀`,
        hashtags: ["#ecommerce", "#onlineshop", "#d2c", "#marketing", "#socialcraft"],
      };
    }),
  },
];
