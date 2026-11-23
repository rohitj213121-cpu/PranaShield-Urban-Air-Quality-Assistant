import type { Language, OutdoorActivityId, UserProfileId, VerdictLevel } from '../types/airQuality';

interface UiCopy {
  nav: {
    overview: string;
    planner: string;
    routine: string;
    indoor: string;
  };
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
  };
  aqi: {
    sectionTitle: string;
    searchPlaceholder: string;
    searchButton: string;
    searchingCity: string;
    quickCitiesLabel: string;
    verdictLabel: string;
    maskLabel: string;
    safestTimeLabel: string;
    stationLabel: string;
    trendTitle: string;
    trendSubtitle: string;
    aqiUnit: string;
    pm25Desc: string;
    pm10Desc: string;
    no2Desc: string;
    weatherLabel: string;
    customCityBadge: string;
    peakLabel: string;
    lowLabel: string;
  };
  lungMeter: {
    sectionTitle: string;
    sectionSubtitle: string;
    cigarettesUnit: string;
    perDaySuffix: string;
    recoveryLabel: string;
    recoveryUnit: string;
    weeklyLabel: string;
    whoMultipleLabel: string;
    visualLabel: string;
    formulaNote: string;
    severityLow: string;
    severityModerate: string;
    severityHigh: string;
    severitySevere: string;
  };
  safeHavens: {
    sectionTitle: string;
    sectionSubtitle: string;
    findBtn: string;
    refreshBtn: string;
    searchingBtn: string;
    aiBadge: string;
    promptTitle: string;
    promptDesc: string;
    pm25DropLabel: string;
    estAqiLabel: string;
    bestWindowLabel: string;
    routeTipLabel: string;
  };
  verdicts: Record<VerdictLevel, { title: string; action: string }>;
  planner: {
    sectionTitle: string;
    sectionSubtitle: string;
    profileLabel: string;
    activityLabel: string;
    generateBtn: string;
    generatingBtn: string;
    safestWindowTitle: string;
    riskTitle: string;
    maskTitle: string;
    precautionsTitle: string;
    indoorAltTitle: string;
    emptyHint: string;
    retryBtn: string;
    profiles: Record<UserProfileId, { label: string; desc: string }>;
    activities: Record<OutdoorActivityId, { label: string; desc: string }>;
  };
  routine: {
    sectionTitle: string;
    sectionSubtitle: string;
    progressLabel: string;
    resetBtn: string;
    filterAll: string;
    filterMobility: string;
    filterHome: string;
    filterCommunity: string;
    tipGeneratorTitle: string;
    generateTipBtn: string;
    generatingTipBtn: string;
    tipPlaceholder: string;
    impactLabel: string;
  };
  indoor: {
    sectionTitle: string;
    sectionSubtitle: string;
    guidePlantsTitle: string;
    guideVentTitle: string;
    guidePurifierTitle: string;
    plantsList: { name: string; benefit: string }[];
    ventRule: string;
    purifierRule: string;
    chatTitle: string;
    chatPlaceholder: string;
    sendBtn: string;
    thinkingText: string;
    quickPromptsLabel: string;
    quickPrompts: string[];
    welcomeMessage: string;
  };
  footer: {
    note: string;
    scaleTitle: string;
  };
}

export const UI_COPY: Record<Language, UiCopy> = {
  en: {
    nav: {
      overview: 'Live AQI',
      planner: 'Health Planner',
      routine: 'Daily Coach',
      indoor: 'Indoor AI',
    },
    hero: {
      kicker: 'Winter Smog Family Shield · India Urban Air Intelligence',
      title: 'Breathe safer across Indian cities with live AI guidance',
      subtitle:
        'Check real-time city smog verdicts, find the safest outdoor window for your family, build low-emission daily habits, and get instant indoor air answers.',
    },
    aqi: {
      sectionTitle: 'Live City AQI & Safety Verdict',
      searchPlaceholder: 'Search any Indian city (e.g., Jaipur, Patna, Pune, Chandigarh)...',
      searchButton: 'Check AQI',
      searchingCity: 'Fetching city data...',
      quickCitiesLabel: 'Quick-select NCR & Metro hubs',
      verdictLabel: 'Outdoor Safety Verdict',
      maskLabel: 'Mask Guidance',
      safestTimeLabel: 'Lowest Smog Window Today',
      stationLabel: 'Monitoring Zone',
      trendTitle: '24-Hour AQI Trend & Pollution Spikes',
      trendSubtitle: 'Winter thermal inversion peaks early morning & night; afternoon warmth brings brief dispersion.',
      aqiUnit: 'US/CPCB Index',
      pm25Desc: 'Fine particles (lungs)',
      pm10Desc: 'Coarse dust',
      no2Desc: 'Traffic exhaust',
      weatherLabel: 'Local Conditions',
      customCityBadge: 'AI-Estimated City Telemetry',
      peakLabel: 'Peak',
      lowLabel: 'Lowest',
    },
    lungMeter: {
      sectionTitle: 'Smog-to-Cigarette Equivalent & Lung Impact Meter',
      sectionSubtitle: '24-hour passive smoke equivalence based on current PM2.5 density.',
      cigarettesUnit: 'cigarettes',
      perDaySuffix: '/ day',
      recoveryLabel: 'Est. Lung Recovery',
      recoveryUnit: 'hrs clean air',
      weeklyLabel: '7-Day Burden',
      whoMultipleLabel: 'WHO 24h Limit',
      visualLabel: '24-Hour Lung Equivalence',
      formulaNote: 'Berkeley Earth standard: ~1 cigarette equals 22 µg/m³ of PM2.5 breathed for 24 hours.',
      severityLow: 'Minimal Burden',
      severityModerate: 'Light Passive Load',
      severityHigh: 'Heavy Airway Stress',
      severitySevere: 'Severe Lung Strain',
    },
    safeHavens: {
      sectionTitle: 'AI Clean-Air Safe Haven & Micro-Route Advisor',
      sectionSubtitle: 'Discover 3 low-AQI micro-zones—urban forests, botanical parks, and HEPA indoor sanctuaries.',
      findBtn: 'Find Nearest Clean-Air Zones',
      refreshBtn: 'Refresh Clean-Air Zones',
      searchingBtn: 'Scanning micro-zones...',
      aiBadge: '✨ PranaShield Micro-Climate AI',
      promptTitle: 'Locate Cleaner Breathing Pockets Nearby',
      promptDesc:
        'Use AI micro-climate guidance to pinpoint urban green canopies and HEPA-filtered indoor havens with lower PM2.5 and safer walking routes.',
      pm25DropLabel: 'PM2.5 Drop',
      estAqiLabel: 'Est. Zone AQI',
      bestWindowLabel: 'Best Visit Window',
      routeTipLabel: 'Micro-Route Tip',
    },
    verdicts: {
      GO: { title: 'GO', action: 'Air is safe for normal outdoor routines.' },
      CAUTION: { title: 'CAUTION', action: 'Sensitive groups should pace exertion.' },
      LIMIT: { title: 'LIMIT', action: 'Shorten outdoor time & wear protection.' },
      AVOID: { title: 'AVOID', action: 'Stay indoors; avoid outdoor exercise.' },
    },
    planner: {
      sectionTitle: 'AI Health & Outdoor Planner',
      sectionSubtitle: 'Select a family profile and planned activity to calculate the safest hour and medical precautions.',
      profileLabel: '1. Who is stepping out?',
      activityLabel: '2. Planned outdoor activity',
      generateBtn: 'Get AI Safety Plan',
      generatingBtn: 'Analyzing air & health risk...',
      safestWindowTitle: 'Recommended Window',
      riskTitle: 'Exposure Risk',
      maskTitle: 'Mask & Gear',
      precautionsTitle: 'Step-by-Step Precautions',
      indoorAltTitle: 'If You Stay Indoors',
      emptyHint: 'Choose a profile and activity to generate tailored AI guidance for the selected city.',
      retryBtn: 'Retry Analysis',
      profiles: {
        healthy_adult: { label: 'Healthy Adult', desc: 'Standard respiratory resilience' },
        child_elderly: { label: 'Child / Elderly', desc: 'Developing or sensitive lungs' },
        respiratory: { label: 'Asthma / Respiratory', desc: 'High airway sensitivity' },
      },
      activities: {
        morning_walk: { label: 'Morning Walk', desc: 'Light pace · 30–45 mins' },
        commute: { label: 'Commute', desc: 'Metro, bus, bike, or drive' },
        outdoor_sports: { label: 'Outdoor Sports', desc: 'High breathing rate' },
      },
    },
    routine: {
      sectionTitle: 'Low-Emission Daily Routine Coach',
      sectionSubtitle: 'Simple daily habits that cut both your personal smog exposure and neighborhood emissions.',
      progressLabel: 'completed today',
      resetBtn: 'Reset',
      filterAll: 'All',
      filterMobility: 'Mobility',
      filterHome: 'Home',
      filterCommunity: 'Community',
      tipGeneratorTitle: 'AI Habit & Exposure Tip Generator',
      generateTipBtn: 'Generate New AI Tip',
      generatingTipBtn: 'Crafting tip...',
      tipPlaceholder: 'Generate a fresh, city-specific action tip to lower your pollution footprint today.',
      impactLabel: 'Estimated Benefit',
    },
    indoor: {
      sectionTitle: 'Indoor Air Quality Guide & AI Chat',
      sectionSubtitle: 'Practical ventilation windows, NASA-studied indoor plants, and instant answers for cleaner home air.',
      guidePlantsTitle: 'Best Air-Purifying Plants',
      guideVentTitle: 'Smart Ventilation Timing',
      guidePurifierTitle: 'HEPA & Room Sealing',
      plantsList: [
        { name: 'Areca Palm', benefit: 'Humidifies dry winter air & traps fine dust' },
        { name: 'Snake Plant', benefit: 'Releases oxygen at night; ideal for bedrooms' },
        { name: 'Money Plant (Pothos)', benefit: 'Absorbs indoor VOCs & cooking fumes' },
        { name: 'Peace Lily', benefit: 'Reduces mold spores & household toxins' },
      ],
      ventRule: 'Open windows briefly between 1:00 PM – 4:00 PM when winter inversion lifts. Keep sealed from 6 PM to 10 AM.',
      purifierRule: 'Run a True HEPA H13 purifier on Medium in bedrooms 1 hour before sleep; place a damp towel under door gaps during severe smog.',
      chatTitle: 'Ask PranaShield Indoor AI',
      chatPlaceholder: 'Ask about HEPA CADR, plants, kids’ bedrooms, or ventilation...',
      sendBtn: 'Ask AI',
      thinkingText: 'Checking indoor air guidance...',
      quickPromptsLabel: 'Try asking:',
      quickPrompts: [
        'Best plants for a Delhi bedroom?',
        'When should I open windows today?',
        'How to make a budget DIY air purifier?',
        'Tips to keep kids safe indoors during AQI 350+?',
      ],
      welcomeMessage:
        'Namaste! Ask me anything about keeping your home air clean during smog days — from room purifier sizing and ventilation timings to safe indoor plants.',
    },
    footer: {
      note: 'PranaShield provides AI-assisted urban air quality guidance for Indian households. Always follow official CPCB / SAFAR & physician advisories during severe pollution alerts.',
      scaleTitle: 'CPCB AQI Verdict Scale: 0–100 GO · 101–200 CAUTION · 201–300 LIMIT · 301+ AVOID',
    },
  },
  hi: {
    nav: {
      overview: 'लाइव AQI',
      planner: 'हेल्थ प्लानर',
      routine: 'डेली कोच',
      indoor: 'इंडोर AI',
    },
    hero: {
      kicker: 'सर्दियों के स्मॉग से परिवार की सुरक्षा · भारतीय शहरी वायु सहायता',
      title: 'लाइव AI सलाह के साथ भारतीय शहरों में सुरक्षित सांस लें',
      subtitle:
        'ताज़ा AQI और सुरक्षा चेतावनी देखें, परिवार के बाहर जाने का सबसे सुरक्षित समय जानें, कम-प्रदूषण वाली दैनिक आदतें अपनाएं और घर की हवा साफ रखने के उपाय पूछें।',
    },
    aqi: {
      sectionTitle: 'लाइव शहर AQI और सुरक्षा सलाह',
      searchPlaceholder: 'कोई भी भारतीय शहर खोजें (जैसे जयपुर, पटना, पुणे, चंडीगढ़)...',
      searchButton: 'AQI देखें',
      searchingCity: 'शहर का डेटा लाया जा रहा है...',
      quickCitiesLabel: 'प्रमुख एनसीआर और मेट्रो शहर',
      verdictLabel: 'बाहर जाने की स्थिति',
      maskLabel: 'मास्क निर्देश',
      safestTimeLabel: 'आज सबसे कम स्मॉग का समय',
      stationLabel: 'निगरानी क्षेत्र',
      trendTitle: '24 घंटे का AQI ट्रेंड और प्रदूषण उतार-चढ़ाव',
      trendSubtitle: 'सर्दियों में सुबह और रात को धुंध अधिक रहती है; दोपहर की धूप में प्रदूषण कुछ कम होता है।',
      aqiUnit: 'CPCB सूचकांक',
      pm25Desc: 'अति सूक्ष्म कण (फेफड़ों के लिए घातक)',
      pm10Desc: 'मोटे धूल कण',
      no2Desc: 'ट्रैफिक गैस',
      weatherLabel: 'स्थानीय मौसम',
      customCityBadge: 'AI अनुमानित शहर डेटा',
      peakLabel: 'उच्चतम',
      lowLabel: 'न्यूनतम',
    },
    lungMeter: {
      sectionTitle: 'स्मॉग-से-सिगरेट समतुल्य और फेफड़ों पर असर मीटर',
      sectionSubtitle: 'मौजूदा PM2.5 स्तर के आधार पर 24 घंटे का निष्क्रिय धुएं के बराबर प्रभाव।',
      cigarettesUnit: 'सिगरेट',
      perDaySuffix: '/ दिन',
      recoveryLabel: 'अनुमानित रिकवरी',
      recoveryUnit: 'घंटे साफ हवा',
      weeklyLabel: 'साप्ताहिक भार',
      whoMultipleLabel: 'WHO 24h सीमा',
      visualLabel: '24 घंटे का फेफड़ों पर भार',
      formulaNote: 'बर्कले अर्थ मानक: 24 घंटे में 22 µg/m³ PM2.5 सांस लेना लगभग 1 सिगरेट पीने के बराबर है।',
      severityLow: 'न्यूनतम भार',
      severityModerate: 'हल्का धुआं भार',
      severityHigh: 'अधिक श्वसन दबाव',
      severitySevere: 'गंभीर फेफड़ों पर दबाव',
    },
    safeHavens: {
      sectionTitle: 'AI क्लीन-एयर सेफ हेवन और माइक्रो-रूट सलाहकार',
      sectionSubtitle: 'कम AQI वाले 3 नज़दीकी क्षेत्र खोजें — शहरी जंगल, बॉटनिकल पार्क और HEPA-फ़िल्टर्ड इंडोर स्थान।',
      findBtn: 'नज़दीकी क्लीन-एयर ज़ोन खोजें',
      refreshBtn: 'ज़ोन रीफ़्रेश करें',
      searchingBtn: 'क्लीन-एयर ज़ोन खोजे जा रहे हैं...',
      aiBadge: '✨ प्राणशील्ड माइक्रो-क्लाइमेट AI',
      promptTitle: 'आसपास साफ हवा वाले सुरक्षित स्थान खोजें',
      promptDesc:
        'कम PM2.5 वाले घने हरित पार्क, शहरी जंगल और HEPA-फ़िल्टर्ड इंडोर पुस्तकालय/सेंटर व सुरक्षित पैदल मार्ग तुरंत देखें।',
      pm25DropLabel: 'PM2.5 में कमी',
      estAqiLabel: 'अनुमानित AQI',
      bestWindowLabel: 'सबसे उपयुक्त समय',
      routeTipLabel: 'माइक्रो-रूट सुझाव',
    },
    verdicts: {
      GO: { title: 'GO (सुरक्षित)', action: 'सामान्य बाहरी गतिविधियों के लिए हवा सुरक्षित है।' },
      CAUTION: { title: 'CAUTION (सावधानी)', action: 'संवेदनशील लोग भारी परिश्रम से बचें।' },
      LIMIT: { title: 'LIMIT (सीमित करें)', action: 'बाहर समय कम बिताएं और मास्क पहनें।' },
      AVOID: { title: 'AVOID (बाहर न जाएं)', action: 'घर के अंदर रहें; बाहर व्यायाम न करें।' },
    },
    planner: {
      sectionTitle: 'AI हेल्थ और आउटडोर प्लानर',
      sectionSubtitle: 'परिवार के सदस्य और गतिविधि चुनें ताकि AI सबसे सुरक्षित समय और सावधानियां बता सके।',
      profileLabel: '1. बाहर कौन जा रहा है?',
      activityLabel: '2. बाहर की गतिविधि चुनें',
      generateBtn: 'AI सुरक्षा योजना पाएं',
      generatingBtn: 'हवा और स्वास्थ्य जोखिम का विश्लेषण...',
      safestWindowTitle: 'सबसे सुरक्षित समय',
      riskTitle: 'जोखिम स्तर',
      maskTitle: 'मास्क और सुरक्षा',
      precautionsTitle: 'ज़रूरी सावधानियां',
      indoorAltTitle: 'घर के अंदर विकल्प',
      emptyHint: 'चयनित शहर के लिए AI सुरक्षा सुझाव पाने के लिए प्रोफ़ाइल और गतिविधि चुनें।',
      retryBtn: 'पुनः प्रयास करें',
      profiles: {
        healthy_adult: { label: 'स्वस्थ वयस्क', desc: 'सामान्य श्वसन क्षमता' },
        child_elderly: { label: 'बच्चे / बुजुर्ग', desc: 'अधिक संवेदनशील फेफड़े' },
        respiratory: { label: 'अस्थमा / सांस की समस्या', desc: 'उच्च श्वसन संवेदनशीलता' },
      },
      activities: {
        morning_walk: { label: 'मॉर्निंग वॉक', desc: 'हल्की सैर · 30–45 मिनट' },
        commute: { label: 'दफ़्तर / स्कूल यात्रा', desc: 'मेट्रो, बस, बाइक या कार' },
        outdoor_sports: { label: 'आउटडोर खेल / दौड़', desc: 'तेज़ सांस लेने वाली गतिविधि' },
      },
    },
    routine: {
      sectionTitle: 'लो-एमिशन डेली रूटीन कोच',
      sectionSubtitle: 'रोज़मर्रा की आसान आदतें जो आपका स्मॉग संपर्क और शहर का प्रदूषण दोनों घटाती हैं।',
      progressLabel: 'आज पूर्ण',
      resetBtn: 'रीसेट',
      filterAll: 'सभी',
      filterMobility: 'यातायात',
      filterHome: 'घर',
      filterCommunity: 'समुदाय',
      tipGeneratorTitle: 'AI दैनिक आदत व बचाव सुझाव',
      generateTipBtn: 'नया AI सुझाव पाएं',
      generatingTipBtn: 'सुझाव तैयार हो रहा है...',
      tipPlaceholder: 'आज अपना प्रदूषण प्रभाव कम करने के लिए शहर-आधारित नया AI सुझाव प्राप्त करें।',
      impactLabel: 'अनुमानित लाभ',
    },
    indoor: {
      sectionTitle: 'इंडोर एयर क्वालिटी गाइड और AI चैट',
      sectionSubtitle: 'खिड़कियां खोलने का सही समय, हवा शुद्ध करने वाले पौधे और घर की हवा के लिए तुरंत सवाल पूछें।',
      guidePlantsTitle: 'हवा शुद्ध करने वाले बेहतरीन पौधे',
      guideVentTitle: 'सही वेंटिलेशन का समय',
      guidePurifierTitle: 'HEPA और कमरे की सीलिंग',
      plantsList: [
        { name: 'एरेका पाम (Areca Palm)', benefit: 'सर्दियों की सूखी हवा में नमी बढ़ाता और धूल सोखता है' },
        { name: 'स्नेक प्लांट (Snake Plant)', benefit: 'रात में भी ऑक्सीजन देता है; बेडरूम के लिए उत्तम' },
        { name: 'मनी प्लांट (Pothos)', benefit: 'रसोई के धुएं और हानिकारक गैसों को कम करता है' },
        { name: 'पीस लिली (Peace Lily)', benefit: 'घर के अंदर की नमी व टॉक्सिन्स कम करने में सहायक' },
      ],
      ventRule: 'दोपहर 1:00 से 4:00 बजे के बीच ही थोड़ी देर खिड़कियां खोलें जब धुंध छंटती है। शाम 6 से सुबह 10 बजे तक बंद रखें।',
      purifierRule: 'सोने से 1 घंटे पहले बेडरूम में True HEPA H13 प्यूरीफायर चलाएं; गंभीर स्मॉग में दरवाज़े के नीचे गीला तौलिया रखें।',
      chatTitle: 'प्राणशील्ड इंडोर AI से पूछें',
      chatPlaceholder: 'HEPA प्यूरीफायर, पौधों, बच्चों के कमरे या वेंटिलेशन के बारे में पूछें...',
      sendBtn: 'AI से पूछें',
      thinkingText: 'इंडोर सलाह तैयार की जा रही है...',
      quickPromptsLabel: 'ये सवाल पूछकर देखें:',
      quickPrompts: [
        'दिल्ली के बेडरूम के लिए सबसे अच्छे पौधे कौन से हैं?',
        'आज खिड़कियां खोलने का सही समय क्या है?',
        'सस्ते में DIY एयर प्यूरीफायर कैसे बनाएं?',
        'AQI 350+ में बच्चों को घर के अंदर सुरक्षित कैसे रखें?',
      ],
      welcomeMessage:
        'नमस्ते! स्मॉग के दिनों में घर की हवा साफ रखने से जुड़ा कोई भी सवाल पूछें — जैसे एयर प्यूरीफायर क्षमता, वेंटिलेशन का सही समय या सुरक्षित इंडोर पौधे।',
    },
    footer: {
      note: 'प्राणशील्ड भारतीय परिवारों के लिए AI-आधारित शहरी वायु गुणवत्ता मार्गदर्शन देता है। गंभीर प्रदूषण में हमेशा आधिकारिक CPCB/SAFAR व डॉक्टर की सलाह का पालन करें।',
      scaleTitle: 'CPCB AQI स्केल: 0–100 GO · 101–200 CAUTION · 201–300 LIMIT · 301+ AVOID',
    },
  },
};
