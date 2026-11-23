import type {
  CityAirData,
  CoachTipResponse,
  Language,
  OutdoorActivityId,
  PlannerAdvice,
  SafeHavensResponse,
  SafeHavenZone,
  UserProfileId,
} from '../types/airQuality';

export function buildFallbackPlannerAdvice(
  city: CityAirData,
  profile: UserProfileId,
  activity: OutdoorActivityId,
  language: Language
): PlannerAdvice {
  const highSmog = city.aqi >= 300;
  const poorSmog = city.aqi >= 200 && city.aqi < 300;
  const moderateSmog = city.aqi >= 100 && city.aqi < 200;
  const isChildOrElderly = profile === 'child_elderly';
  const isRespiratory = profile === 'respiratory';
  const isSensitive = isChildOrElderly || isRespiratory;

  if (language === 'hi') {
    if (highSmog) {
      if (isRespiratory) {
        return {
          safestWindow: `घर के अंदर रहें (अति आवश्यक हो तो ${city.bestWindow})`,
          riskRating: 'गंभीर श्वसन जोखिम',
          headline: `${city.name.hi} में AQI ${city.aqi} (PM2.5: ${city.pm25} µg/m³) अस्थमा व सांस रोगियों के लिए खतरनाक है — आज बाहर की गतिविधि टालें।`,
          maskGuidance: 'यदि बाहर निकलना मजबूरी हो, तो बिना वाल्व वाला N95 या N99 मास्क नाक पर कसकर पहनें।',
          precautions: [
            `सवेरे 6–10 बजे और शाम 6 बजे के बाद ${city.station.hi} क्षेत्र में धुंध चरम पर रहती है; बाहर न जाएं।`,
            'डॉक्टर द्वारा बताया गया रिलीवर इनहेलर और नेबुलाइज़र तैयार रखें।',
            'यदि गतिविधि यात्रा (Commute) की हो तो बंद कैब या मेट्रो चुनें और एसी री-सर्कुलेशन मोड पर रखें।',
            'घर लौटकर गुनगुने नमकीन पानी से गरारे करें और भाप लें।',
          ],
          indoorAlternative:
            'कमरे के अंदर हल्की स्ट्रेचिंग, धीमी अनुलोम-विलोम ब्रीदिंग (HEPA प्यूरीफायर चलते हुए) या हल्का टहलना सुरक्षित रहेगा।',
        };
      }
      if (isChildOrElderly) {
        return {
          safestWindow:
            activity === 'commute'
              ? `${city.bestWindow} (अनावश्यक यात्रा टालें)`
              : `घर के अंदर रहें · सीमित बाहर: ${city.bestWindow}`,
          riskRating: 'उच्च जोखिम',
          headline: `${city.name.hi} (AQI ${city.aqi}) में बच्चों व बुजुर्गों के लिए बाहर ${
            activity === 'outdoor_sports' ? 'खेलकूद' : activity === 'commute' ? 'यात्रा' : 'मॉर्निंग वॉक'
          } से बचना सबसे सुरक्षित है।`,
          maskGuidance: 'बच्चों/बुजुर्गों के चेहरे के आकार का सही फिट N95 मास्क ही उपयोग करें।',
          precautions: [
            `सुबह की सैर के बजाय दोपहर ${city.bestWindow} के बीच केवल 10–15 मिनट धूप में टहलें।`,
            'स्कूल/ऑफिस यात्रा के दौरान खुले ऑटो या दोपहिया वाहन से बचें; मेट्रो या बंद कार बेहतर है।',
            'दिन भर गुनगुना पानी, तुलसी-अदरक काढ़ा और विटामिन-C युक्त फल दें।',
            'कमरे में सूखी झाड़ू न लगाएं; केवल गीला पोंछा लगाएं।',
          ],
          indoorAlternative: 'घर के हॉल में बच्चों के साथ हल्के इंडोर गेम्स, योग या बुजुर्गों के लिए धीमी स्ट्रेचिंग कराएं।',
        };
      }
      return {
        safestWindow: activity === 'outdoor_sports' ? 'आज इंडोर शिफ्ट करें' : city.bestWindow,
        riskRating: activity === 'outdoor_sports' ? 'उच्च जोखिम' : 'मध्यम-उच्च जोखिम',
        headline: `${city.name.hi} में AQI ${city.aqi} और PM2.5 ${city.pm25} µg/m³ है; स्वस्थ वयस्कों को भी भारी बाहरी व्यायाम टालना चाहिए।`,
        maskGuidance: 'बाहर यात्रा या छोटे काम के लिए N95 मास्क अनिवार्य रूप से पहनें।',
        precautions: [
          `बाहर निकलने का सबसे कम स्मॉग वाला समय दोपहर ${city.bestWindow} है; सुबह 9 बजे से पहले बाहर न दौड़ें।`,
          'मुंह से सांस लेने के बजाय नाक से धीमी सांस लें ताकि सूक्ष्म धूल कण फिल्टर हो सकें।',
          'व्यस्त सड़कों व निर्माण स्थलों के पास से गुजरते समय दूरी बनाए रखें।',
          'लौटने के बाद आंखों को साफ पानी से धोएं और पर्याप्त पानी पिएं।',
        ],
        indoorAlternative: 'आज बाहर दौड़ या खेल की जगह घर पर बॉडीवेट एक्सरसाइज, रस्सी कूद या इंडोर योग करें।',
      };
    }

    if (poorSmog || (moderateSmog && isSensitive)) {
      return {
        safestWindow: city.bestWindow,
        riskRating: poorSmog ? 'सावधानी आवश्यक' : 'हल्की सावधानी',
        headline: `${city.name.hi} में AQI ${city.aqi} (PM10: ${city.pm10} µg/m³) के साथ दोपहर ${city.bestWindow} के बीच सीमित गतिविधि सुरक्षित रहेगी।`,
        maskGuidance: isSensitive
          ? 'बाहर निकलते समय N95 मास्क पहनें और नाक के ब्रिज पर अच्छी तरह दबाएं।'
          : 'मुख्य सड़कों व भारी ट्रैफिक के पास N95 मास्क साथ रखें।',
        precautions: [
          `${city.station.hi} के आसपास सुबह-शाम की धुंध से बचने के लिए दोपहर के समय को चुनें।`,
          'भारी दौड़ या स्प्रिंट की जगह मध्यम गति की सैर या स्ट्रेचिंग रखें।',
          'खांसी, गले में खराश या आंखों में जलन होने पर तुरंत अंदर आ जाएं।',
        ],
        indoorAlternative: 'यदि हवा में धूल तेज़ दिखे तो घर के अंदर सीढ़ियां चढ़ना या योग करना बेहतर विकल्प है।',
      };
    }

    return {
      safestWindow: city.bestWindow,
      riskRating: 'सुरक्षित स्थिति',
      headline: `${city.name.hi} (AQI ${city.aqi}, हवा की गति ${city.windKmh} km/h) में आज बाहरी गतिविधि के लिए स्थिति अनुकूल है।`,
      maskGuidance: isRespiratory ? 'धूल भरी सड़कों पर हल्का मास्क पास रखें।' : 'पार्क व खुले क्षेत्रों में मास्क की आवश्यकता नहीं।',
      precautions: [
        'व्यस्त ट्रैफिक चौराहों के बजाय हरे-भरे पार्क या अंदरूनी कॉलोनी की सड़कें चुनें।',
        'गतिविधि से पहले और बाद में पानी पिएं।',
        isSensitive ? 'इनहेलर या आवश्यक दवा साथ रखना न भूलें।' : 'सुबह या दोपहर की ताज़ी हवा का लाभ उठाएं।',
      ],
      indoorAlternative: 'शाम के व्यस्त ट्रैफिक समय में इंडोर स्ट्रेचिंग या हल्का कार्डियो कर सकते हैं।',
    };
  }

  // English rich context-aware planner
  if (highSmog) {
    if (isRespiratory) {
      return {
        safestWindow: `Stay indoors (essential errands only: ${city.bestWindow})`,
        riskRating: 'Severe Respiratory Risk',
        headline: `At AQI ${city.aqi} (PM2.5 ${city.pm25} µg/m³) around ${city.station.en}, ${city.name.en} poses high airway inflammation risk—move today's routine indoors.`,
        maskGuidance: 'Wear a tight-fitting, valve-free N95 or N99 respirator for any unavoidable trip outdoors.',
        precautions: [
          `Avoid 6:00 AM–10:30 AM and post-6:00 PM hours when ${city.windKmh} km/h winter winds trap ground-level smog.`,
          'Keep your prescribed reliever inhaler and spacer within reach before stepping outside.',
          'For unavoidable commutes, choose closed Metro coaches or keep car AC strictly on Recirculate mode.',
          'Rinse eyes with clean water and gargle with warm saline upon returning home.',
        ],
        indoorAlternative:
          'Practice gentle indoor mobility, seated pranayama (with a HEPA purifier running), or slow corridor walking.',
      };
    }

    if (isChildOrElderly) {
      return {
        safestWindow:
          activity === 'commute'
            ? `${city.bestWindow} (minimize roadside wait)`
            : `Keep indoors · Brief sun only: ${city.bestWindow}`,
        riskRating: 'High Risk',
        headline: `In ${city.name.en} (AQI ${city.aqi}), avoid early-morning ${
          activity === 'outdoor_sports' ? 'sports' : activity === 'commute' ? 'exposed commute' : 'walks'
        } for children and seniors today.`,
        maskGuidance: 'Use a properly sized kids’ or adult N95 mask sealed cleanly around nose and chin.',
        precautions: [
          `Limit outdoor sunlight breaks to 10–15 minutes strictly between ${city.bestWindow}.`,
          'Avoid open autos or two-wheelers along arterial corridors; opt for Metro or closed cabs.',
          'Serve warm fluids, Vitamin C-rich fruits, and avoid chilled drinks if throat irritation appears.',
          'Keep bedroom doors sealed after 6 PM and wet-mop floors instead of dry sweeping.',
        ],
        indoorAlternative: 'Host light indoor balance games, stretching, or hallway walks away from kitchen fumes.',
      };
    }

    return {
      safestWindow: activity === 'outdoor_sports' ? 'Move workout indoors today' : city.bestWindow,
      riskRating: activity === 'outdoor_sports' ? 'High Exertion Risk' : 'Elevated Risk',
      headline: `With ${city.name.en} at AQI ${city.aqi} (PM2.5 ${city.pm25} µg/m³), high-breathing outdoor exertion should be shifted indoors.`,
      maskGuidance: 'Wear a snug N95 respirator during commutes or brief errands.',
      precautions: [
        `Schedule unavoidable errands between ${city.bestWindow}, when midday warming gives brief dispersion.`,
        'Breathe through your nose rather than your mouth to filter coarse PM10 particles.',
        'Avoid jogging or cycling near construction dust or diesel traffic corridors.',
        'Hydrate well and wash exposed skin and face immediately after getting indoors.',
      ],
      indoorAlternative: 'Replace outdoor sports with indoor bodyweight circuits, yoga, stair climbs, or stationary cycling.',
    };
  }

  if (poorSmog || (moderateSmog && isSensitive)) {
    return {
      safestWindow: city.bestWindow,
      riskRating: poorSmog ? 'Moderate-High Caution' : 'Sensitive Caution',
      headline: `${city.name.en} is at AQI ${city.aqi} (PM10 ${city.pm10} µg/m³); ${city.bestWindow} offers the cleanest air for your ${activity.replace('_', ' ')}.`,
      maskGuidance: isSensitive
        ? 'Wear an N95 mask outdoors and check for zero side-gap leakage.'
        : 'Keep an N95 mask handy near heavy traffic junctions and Metro feeder routes.',
      precautions: [
        `Stick to shaded, tree-lined lanes around ${city.station.en} and skip main highway edges.`,
        'Cap vigorous duration to 25–30 minutes and keep a steady, conversational breathing pace.',
        'Move indoors immediately if you notice coughing, wheezing, or burning eyes.',
      ],
      indoorAlternative: 'Indoor treadmill, mobility flows, or brisk indoor walking avoids roadside particulate spikes.',
    };
  }

  return {
    safestWindow: city.bestWindow,
    riskRating: 'Low Risk · Safe',
    headline: `${city.name.en} air quality is favorable today (AQI ${city.aqi}, wind ${city.windKmh} km/h)—great conditions for your ${activity.replace('_', ' ')}.`,
    maskGuidance: isRespiratory ? 'Carry a light mask near dusty intersections.' : 'No mask needed in open parks.',
    precautions: [
      'Choose green parks or residential streets over signalized traffic intersections.',
      'Stay hydrated before and after outdoor movement.',
      isSensitive ? 'Keep routine respiratory medication handy as a precaution.' : 'Enjoy outdoor time freely within the recommended window.',
    ],
    indoorAlternative: 'Evening indoor stretching or core work pairs well if local traffic picks up.',
  };
}

export function buildFallbackIndoorReply(
  question: string,
  city: CityAirData,
  language: Language
): string {
  const q = question.toLowerCase();

  if (language === 'hi') {
    if (q.includes('plant') || q.includes('पौधे') || q.includes('bedroom') || q.includes('बेडरूम')) {
      return `${city.name.hi} (AQI ${city.aqi}, PM2.5: ${city.pm25} µg/m³) के घरों के लिए सबसे अच्छे इंडोर पौधे:\n• स्नेक प्लांट (Snake Plant): रात में भी ऑक्सीजन छोड़ता है और कम रोशनी में पनपता है — बेडरूम के लिए आदर्श।\n• एरेका पाम (Areca Palm): सर्दियों की सूखी हवा में प्राकृतिक नमी जोड़ता है।\n• मनी प्लांट और पीस लिली: रसोई व कमरे की गैसों (VOCs) को कम करते हैं।\nसुझाव: पत्तियों को हफ्ते में 2 बार गीले कपड़े से पोंछें ताकि जमी धूल साफ रहे।`;
    }
    if (q.includes('window') || q.includes('खिड़क') || q.includes('vent') || q.includes('समय')) {
      return `${city.name.hi} में आज क्रॉस-वेंटिलेशन के लिए खिड़कियां केवल दोपहर ${city.bestWindow} के बीच 15–20 मिनट खोलें जब धूप से धुंध हल्की होती है।\n• सुबह 6:00–10:30 और शाम 6:00 बजे के बाद खिड़कियां बंद रखें।\n• खाना बनाते समय चिमनी/एग्जॉस्ट चलाएं ताकि अंदर धुआं जमा न हो।`;
    }
    if (q.includes('diy') || q.includes('सस्ते') || q.includes('purifier') || q.includes('प्यूरीफायर') || q.includes('cadr')) {
      return `बजट DIY एयर प्यूरीफायर और HEPA गाइड:\n• कम खर्च में DIY बॉक्स-फैन फ़िल्टर: एक 16–20 इंच के बॉक्स/पेडेस्टल फैन के पीछे MERV-13 या True HEPA रिप्लेसमेंट फ़िल्टर टेप से सील करें।\n• यदि आप HEPA H13 प्यूरीफायर ले रहे हैं, तो 150–200 वर्ग फुट के बेडरूम के लिए कम से कम 250–300 m³/h CADR चुनें।\n• सोने से 1 घंटे पहले कमरे को बंद कर प्यूरीफायर चलाएं।`;
    }
    if (q.includes('kid') || q.includes('child') || q.includes('बच्च') || q.includes('baby')) {
      return `${city.name.hi} में AQI ${city.aqi} होने पर बच्चों को सुरक्षित रखने के उपाय:\n• बच्चों के कमरे में शाम 6 बजे से पहले दरवाज़ों की दरारों पर ड्राफ्ट-स्टॉपर या गीला तौलिया लगाएं।\n• सूखी झाड़ू के बजाय दिन में 1–2 बार गीला पोंछा लगाएं और कमरे में धूप/अगरबत्ती न जलाएं।\n• केवल ${city.bestWindow} के बीच ही संक्षिप्त वेंटिलेशन करें और पर्याप्त पानी व फल दें।`;
    }
    return `${city.name.hi} में आज AQI ${city.aqi} (PM2.5: ${city.pm25} µg/m³) है। घर की हवा साफ रखने के लिए:\n• केवल ${city.bestWindow} के बीच ही 15 मिनट खिड़कियां खोलें; बाकी समय सील रखें।\n• सूखी झाड़ू की जगह गीला पोंछा लगाएं और खाना बनाते समय चिमनी चलाएं।\n• बेडरूम में True HEPA H13 प्यूरीफायर व स्नेक प्लांट/एरेका पाम रखें।`;
  }

  // English rich context-aware replies
  if (q.includes('plant') || q.includes('bedroom')) {
    return `For bedrooms in ${city.name.en} (AQI ${city.aqi}, PM2.5 ${city.pm25} µg/m³), the best low-maintenance indoor plants are:\n• Snake Plant (Sansevieria): Releases oxygen at night and thrives in low light—ideal beside beds.\n• Areca Palm: Naturally humidifies dry winter indoor air.\n• Money Plant (Pothos) & Peace Lily: Help absorb household VOCs and kitchen fumes.\nTip: Wipe leaves weekly with a damp cloth so settled dust doesn’t block transpiration.`;
  }
  if (q.includes('window') || q.includes('open') || q.includes('vent')) {
    return `In ${city.name.en} today (AQI ${city.aqi}), open windows for just 15–20 minutes between ${city.bestWindow} when afternoon sun weakens the winter inversion.\n• Keep windows and balcony doors closed from 6:00 PM to 10:30 AM.\n• Always run your kitchen chimney/exhaust while cooking—indoor tadka smoke can spike room PM2.5 above 300 µg/m³ if trapped.`;
  }
  if (q.includes('diy') || q.includes('budget') || q.includes('corsi') || q.includes('cadr') || q.includes('hepa')) {
    return `Budget DIY & HEPA Sizing for ${city.name.en} (PM2.5 ${city.pm25} µg/m³):\n• DIY Purifier: Tape a genuine True HEPA H13 or MERV-13 replacement filter snugly onto the intake side of a standard 16–20" box or pedestal fan, sealing side gaps with duct tape.\n• HEPA Sizing: For a 150–200 sq ft Indian bedroom, aim for a CADR of 250–320 m³/h and run it on Medium 1 hour before sleep.`;
  }
  if (q.includes('kid') || q.includes('child') || q.includes('baby') || q.includes('family')) {
    return `Keeping kids safe indoors in ${city.name.en} at AQI ${city.aqi}:\n• Seal door bottom gaps with a draft stopper or damp towel before 6:00 PM.\n• Wet-mop floors daily instead of dry sweeping, and skip agarbatti, dhoop, or scented candles.\n• Ventilate briefly only around ${city.bestWindow}, run HEPA filtration in sleeping areas, and keep kids hydrated.`;
  }
  return `With ${city.name.en} at AQI ${city.aqi} (PM2.5 ${city.pm25} µg/m³, PM10 ${city.pm10} µg/m³), protect indoor air with three habits:\n• Ventilate briefly only during ${city.bestWindow}; keep rooms sealed morning and night.\n• Switch to wet-mopping and always run the kitchen exhaust while cooking.\n• Pair a True HEPA H13 purifier (or MERV-13 fan filter) with Snake Plant and Areca Palm in bedrooms.`;
}

export function buildFallbackCoachTip(
  city: CityAirData,
  language: Language,
  seedIndex = 0
): CoachTipResponse {
  if (language === 'hi') {
    const tips: CoachTipResponse[] = [
      {
        title: 'दरवाज़ों की दरार सील करें और गीला पोंछा अपनाएं',
        actionStep: `आज शाम 6 बजे से पहले ${city.name.hi} में मुख्य दरवाज़े के नीचे ड्राफ्ट-स्टॉपर या गीला तौलिया लगाएं और सूखी झाड़ू न लगाएं।`,
        whyItHelps: `AQI ${city.aqi} होने पर बाहर की धुंध दरवाज़े की दरारों से अंदर आती है; सीलिंग और गीले पोंछे से घर के अंदर PM2.5 घटता है।`,
        estimatedImpact: 'कमरे के अंदर धूल कणों में 35–45% तक कमी',
      },
      {
        title: 'खाना बनाते समय चिमनी और इंडक्शन को प्राथमिकता दें',
        actionStep: `आज ${city.name.hi} में तड़का या तलने के दौरान किचन चिमनी/एग्जॉस्ट को अधिकतम गति पर चलाएं और बर्तन ढककर पकाएं।`,
        whyItHelps: 'रसोई का धुआं बंद कमरों में PM2.5 को कुछ ही मिनटों में 250+ µg/m³ तक बढ़ा सकता है।',
        estimatedImpact: 'घर के अंदर धुएं के अचानक उछाल में 50% कमी',
      },
      {
        title: 'निकट दूरी के लिए पैदल या मेट्रो फीडर चुनें',
        actionStep: `2 किमी से कम के काम के लिए कार/बाइक के बजाय मेट्रो, ई-रिक्शा या दोपहर ${city.bestWindow} में पैदल यात्रा करें।`,
        whyItHelps: 'छोटी कोल्ड-स्टार्ट ड्राइव सबसे अधिक NO2 और अनबर्न हाइड्रोकार्बन छोड़ती हैं।',
        estimatedImpact: 'दैनिक व्यक्तिगत वाहन उत्सर्जन में ~30% बचत',
      },
    ];
    return tips[seedIndex % tips.length];
  }

  const tips: CoachTipResponse[] = [
    {
      title: 'Seal Door Gaps & Switch to Wet-Mopping',
      actionStep: `Place a draft stopper or damp cloth along balcony/front door gaps in ${city.name.en} before 6 PM and skip dry sweeping today.`,
      whyItHelps: `At AQI ${city.aqi}, winter smog seeps indoors through unsealed frames while dry brooms re-suspend settled PM10 into breathing height.`,
      estimatedImpact: 'Cuts indoor particulate spike by 35–45%',
    },
    {
      title: 'Run Kitchen Chimney & Keep Lids On While Cooking',
      actionStep: `Turn on your kitchen exhaust 5 minutes before tadka/frying in ${city.name.en} and keep bedroom doors closed while cooking.`,
      whyItHelps: 'Unvented cooking aerosols rapidly spike indoor PM2.5 above 250 µg/m³ in sealed winter homes.',
      estimatedImpact: 'Reduces indoor cooking PM2.5 buildup by ~50%',
    },
    {
      title: 'Swap Short Cold-Start Drives for Metro or Walking',
      actionStep: `Replace sub-2 km car or two-wheeler errands today with Metro, e-rickshaw, or a masked midday walk during ${city.bestWindow}.`,
      whyItHelps: 'Cold-start vehicle trips under 2 km emit disproportionate NO2 and tailpipe particulates before catalytic converters warm up.',
      estimatedImpact: 'Saves ~30% of daily commute exhaust',
    },
  ];
  return tips[seedIndex % tips.length];
}

interface CitySafeHavenSeed {
  name: { en: string; hi: string };
  zoneType: SafeHavenZone['zoneType'];
  typeLabel: { en: string; hi: string };
  pm25ReductionPct: number;
  bestWindow?: string;
  microRouteTip: { en: string; hi: string };
}

const CITY_HAVEN_SEEDS: Record<string, CitySafeHavenSeed[]> = {
  delhi: [
    {
      name: { en: 'Sanjay Van Urban Forest', hi: 'संजय वन शहरी जंगल' },
      zoneType: 'forest',
      typeLabel: { en: 'Dense Urban Forest', hi: 'घना शहरी जंगल' },
      pm25ReductionPct: 38,
      microRouteTip: {
        en: 'Enter via Qutab Institutional Area gate and walk deep ridge trails 250m inside from Outer Ring Road.',
        hi: 'कुतुब इंस्टीट्यूशनल एरिया गेट से प्रवेश करें और आउटर रिंग रोड से 250 मीटर अंदर घने पेड़ों के बीच चलें।',
      },
    },
    {
      name: { en: 'Lodhi Garden Botanical Canopy', hi: 'लोधी गार्डन हरित उद्यान' },
      zoneType: 'park',
      typeLabel: { en: 'Heritage Botanical Park', hi: 'बॉटनिकल हेरिटेज पार्क' },
      pm25ReductionPct: 32,
      microRouteTip: {
        en: 'Arrive via Jor Bagh Metro; stick to central Bada Gumbad lawns away from Lodhi Road traffic.',
        hi: 'जोर बाग मेट्रो से आएं और लोधी रोड ट्रैफिक से दूर मध्य लॉन व बारा गुंबद के पास रहें।',
      },
    },
    {
      name: { en: 'India Habitat Centre / HEPA Reading Wing', hi: 'इंडिया हैबिटेट सेंटर / HEPA इंडोर विंग' },
      zoneType: 'indoor_hepa',
      typeLabel: { en: 'HEPA-Filtered Indoor Haven', hi: 'HEPA-फ़िल्टर्ड इंडोर स्थान' },
      pm25ReductionPct: 68,
      bestWindow: '10:00 AM – 8:00 PM',
      microRouteTip: {
        en: 'Use Jor Bagh or Khan Market Metro feeder; climate-controlled indoor lounges keep PM2.5 low all day.',
        hi: 'खान मार्केट मेट्रो से पहुंचें; नियंत्रित वेंटिलेशन वाले इंडोर हॉल पूरे दिन सुरक्षित रहते हैं।',
      },
    },
  ],
  noida: [
    {
      name: { en: 'Okhla Bird Sanctuary', hi: 'ओखला पक्षी विहार' },
      zoneType: 'forest',
      typeLabel: { en: 'Wetland & Riparian Reserve', hi: 'आर्द्रभूमि व हरित अभयारण्य' },
      pm25ReductionPct: 35,
      microRouteTip: {
        en: 'Take Magenta Line to Okhla Bird Sanctuary Metro and follow riverside tree-lined mud tracks.',
        hi: 'मजेंटा लाइन मेट्रो से पहुंचें और यमुना किनारे पेड़ों से ढके शांत पथ पर टहलें।',
      },
    },
    {
      name: { en: 'Meghdootam Park (Sector 50)', hi: 'मेघदूतम पार्क (सेक्टर 50)' },
      zoneType: 'park',
      typeLabel: { en: 'Dense Neighborhood Park', hi: 'घना सेक्टर पार्क' },
      pm25ReductionPct: 29,
      microRouteTip: {
        en: 'Enter from internal Sector 50 lane rather than Dadri Main Road to dodge construction dust.',
        hi: 'दादरी मेन रोड की धूल से बचने के लिए सेक्टर 50 की अंदरूनी लेन से प्रवेश करें।',
      },
    },
    {
      name: { en: 'DLF Mall of India HEPA Atrium', hi: 'DLF मॉल ऑफ इंडिया HEPA एट्रियम' },
      zoneType: 'indoor_hepa',
      typeLabel: { en: 'MERV-13 / HEPA Indoor Hub', hi: 'HEPA-फ़िल्टर्ड इंडोर परिसर' },
      pm25ReductionPct: 65,
      bestWindow: '11:00 AM – 8:30 PM',
      microRouteTip: {
        en: 'Direct walk from Noida Sector 18 Metro keeps family errands & indoor walks away from roadside smog.',
        hi: 'सेक्टर 18 मेट्रो से सीधा प्रवेश परिवार की सैर व जरूरी कामों को बाहरी धुंध से बचाता है।',
      },
    },
  ],
  gurugram: [
    {
      name: { en: 'Aravalli Biodiversity Park', hi: 'अरावली बायोडायवर्सिटी पार्क' },
      zoneType: 'forest',
      typeLabel: { en: 'Aravalli Forest Reserve', hi: 'अरावली वन क्षेत्र' },
      pm25ReductionPct: 39,
      microRouteTip: {
        en: 'Take Rapid Metro to Guru Dronacharya; walk the inner ridge loops shielded from NH-48 exhaust.',
        hi: 'गुरु द्रोणाचार्य मेट्रो से आएं और NH-48 ट्रैफिक से दूर अंदरूनी पहाड़ी पगडंडियों पर रहें।',
      },
    },
    {
      name: { en: 'Leisure Valley Park (Sector 29)', hi: 'लीज़र वैली पार्क (सेक्टर 29)' },
      zoneType: 'park',
      typeLabel: { en: 'Botanical Green Oasis', hi: 'बॉटनिकल ग्रीन पार्क' },
      pm25ReductionPct: 31,
      microRouteTip: {
        en: 'Use shaded inner rose-garden paths far from IFFCO Chowk signalized junction.',
        hi: 'इफको चौक के धुएं से दूर पार्क के बीच वाले हरित व छायादार मार्ग का उपयोग करें।',
      },
    },
    {
      name: { en: 'Ambience / CyberHub Filtered Galleries', hi: 'साइबरहब / एंबिएंस फ़िल्टर्ड इंडोर ज़ोन' },
      zoneType: 'indoor_hepa',
      typeLabel: { en: 'Filtered Indoor Sanctuary', hi: 'फ़िल्टर्ड इंडोर परिसर' },
      pm25ReductionPct: 64,
      bestWindow: '10:30 AM – 8:00 PM',
      microRouteTip: {
        en: 'Arrive via IndusInd Bank CyberCity Rapid Metro; indoor climate zones offer calm filtered breathing.',
        hi: 'रैपिड मेट्रो से पहुंचकर इंडोर वेंटिलेटेड गैलरी में सुरक्षित समय बिताएं।',
      },
    },
  ],
  mumbai: [
    {
      name: { en: 'Sanjay Gandhi National Park (Borivali)', hi: 'संजय गांधी राष्ट्रीय उद्यान (बोरीवली)' },
      zoneType: 'forest',
      typeLabel: { en: 'Tropical Urban Forest', hi: 'घना शहरी राष्ट्रीय वन' },
      pm25ReductionPct: 44,
      microRouteTip: {
        en: 'Walk past the main gate by 1 km or cycle shaded Gandhi Tekdi trails for crisp forest air.',
        hi: 'मुख्य द्वार से 1 किमी अंदर गांधी टेकड़ी मार्ग पर पेड़ों के बीच स्वच्छ हवा का आनंद लें।',
      },
    },
    {
      name: { en: 'Hanging Gardens & Kamala Nehru Park', hi: 'हैंडिंग गार्डन और कमला नेहरू पार्क' },
      zoneType: 'park',
      typeLabel: { en: 'Elevated Coastal Canopy', hi: 'ऊंचाई वाला हरित उद्यान' },
      pm25ReductionPct: 34,
      microRouteTip: {
        en: 'Malabar Hill elevation and sea breeze clear fine particulates fastest here after 11 AM.',
        hi: 'मालाबार हिल की ऊंचाई और समुद्री हवा से 11 बजे के बाद यहां हवा सबसे साफ रहती है।',
      },
    },
    {
      name: { en: 'NMACC & Jio World HEPA Cultural Centre', hi: 'NMACC और BKC HEPA कल्चरल सेंटर' },
      zoneType: 'indoor_hepa',
      typeLabel: { en: 'HEPA-Filtered Indoor Haven', hi: 'HEPA-फ़िल्टर्ड इंडोर सेंटर' },
      pm25ReductionPct: 66,
      bestWindow: '11:00 AM – 8:00 PM',
      microRouteTip: {
        en: 'Ideal during afternoon BKC construction dust spikes; indoor lobbies keep particulate count minimal.',
        hi: 'BKC निर्माण धूल बढ़ने पर वातानुकूलित व फ़िल्टर्ड इंडोर गैलरी सुरक्षित विकल्प है।',
      },
    },
  ],
};

function buildGenericCitySeeds(city: CityAirData): CitySafeHavenSeed[] {
  return [
    {
      name: {
        en: `${city.name.en} Reserve Forest / Green Belt`,
        hi: `${city.name.hi} रिज़र्व वन / ग्रीन बेल्ट`,
      },
      zoneType: 'forest',
      typeLabel: { en: 'Dense Urban Forest', hi: 'घना शहरी जंगल' },
      pm25ReductionPct: 36,
      microRouteTip: {
        en: `Choose interior tree-canopy trails at least 200m away from ${city.station.en} main arterial roads.`,
        hi: `${city.station.hi} की मुख्य सड़कों से कम से कम 200 मीटर अंदर पेड़ों से घिरे मार्ग चुनें।`,
      },
    },
    {
      name: {
        en: `${city.name.en} Central Botanical Garden`,
        hi: `${city.name.hi} सेंट्रल बॉटनिकल गार्डन`,
      },
      zoneType: 'park',
      typeLabel: { en: 'Botanical Park Canopy', hi: 'बॉटनिकल पार्क' },
      pm25ReductionPct: 30,
      microRouteTip: {
        en: 'Use shaded inner lawns and fountains during midday sun when ground inversion weakens.',
        hi: 'दोपहर की धूप में जब धुंध कम हो, तब पार्क के मध्य हरे लॉन में टहलें।',
      },
    },
    {
      name: {
        en: `${city.name.en} HEPA Public Library / Cultural Atrium`,
        hi: `${city.name.hi} HEPA इंडोर लाइब्रेरी / कल्चरल सेंटर`,
      },
      zoneType: 'indoor_hepa',
      typeLabel: { en: 'HEPA-Filtered Indoor Haven', hi: 'HEPA-फ़िल्टर्ड इंडोर स्थान' },
      pm25ReductionPct: 65,
      bestWindow: '10:30 AM – 8:00 PM',
      microRouteTip: {
        en: 'Spend peak morning/evening smog hours in MERV-13/HEPA ventilated indoor community halls.',
        hi: 'सुबह और शाम के चरम स्मॉग के समय फ़िल्टर्ड इंडोर हॉल या लाइब्रेरी में रहें।',
      },
    },
  ];
}

export function buildFallbackSafeHavens(
  city: CityAirData,
  language: Language
): SafeHavensResponse {
  const seeds = CITY_HAVEN_SEEDS[city.id] || buildGenericCitySeeds(city);

  const zones: SafeHavenZone[] = seeds.map((seed) => {
    const estimatedAqi = Math.max(22, Math.round(city.aqi * (1 - seed.pm25ReductionPct / 100)));
    return {
      name: seed.name[language],
      zoneType: seed.zoneType,
      typeLabel: seed.typeLabel[language],
      pm25ReductionPct: seed.pm25ReductionPct,
      estimatedAqi,
      bestWindow: seed.bestWindow || city.bestWindow,
      microRouteTip: seed.microRouteTip[language],
    };
  });

  const citySummary =
    language === 'hi'
      ? `${city.name.hi} (AQI ${city.aqi}) के भीतर घने हरित क्षेत्रों और HEPA इंडोर स्थानों में 30%–68% कम PM2.5 मिलता है।`
      : `Tree canopies and HEPA indoor venues in ${city.name.en} (city AQI ${city.aqi}) cut PM2.5 exposure by 30%–68%.`;

  return { citySummary, zones };
}

