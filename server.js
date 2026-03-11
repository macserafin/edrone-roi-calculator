const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Industry keyword lists (PL + EN) ───────────────────────────────
const INDUSTRY_KEYWORDS = {
  ELECTRONICS: {
    label: 'Elektronika',
    keywords: ['elektronika', 'electronics', 'laptop', 'komputer', 'computer', 'telefon', 'smartfon', 'smartphone', 'tablet', 'monitor', 'drukark', 'printer', 'kabel', 'ładowar', 'słuchawk', 'głośnik', 'konsol', 'gaming', 'pc', 'gpu', 'procesor', 'ram', 'ssd', 'pendrive', 'aparat', 'kamera', 'tv', 'telewizor']
  },
  SPORT_EQUIPMENT: {
    label: 'Sprzęt sportowy',
    keywords: ['sport', 'fitness', 'siłownia', 'gym', 'rower', 'bicycle', 'bike', 'bieganie', 'running', 'piłka', 'tenis', 'narty', 'ski', 'snowboard', 'treningowy', 'workout', 'joga', 'yoga', 'outdoor', 'turystyk', 'camping', 'wspinacz', 'pływa', 'swimming', 'sportow']
  },
  EQUIPMENT: {
    label: 'Wyposażenie / RTV AGD',
    keywords: ['agd', 'rtv', 'lodówk', 'pralk', 'zmywark', 'piekarnik', 'kuchenn', 'mikser', 'blender', 'odkurzacz', 'żelazk', 'suszark', 'ekspres', 'coffee', 'tostera', 'robot kuchenn', 'klimatyza', 'grzejnik', 'wentylator', 'appliance', 'sprzęt domow']
  },
  VEHICLES_AND_PARTS: {
    label: 'Samochody i części',
    keywords: ['samochod', 'samochód', 'auto', 'motoryz', 'automotive', 'części', 'parts', 'opony', 'tires', 'felgi', 'olej', 'akumulator', 'hamulc', 'filtr', 'silnik', 'engine', 'tuning', 'car', 'motocykl', 'motorcycle', 'garaż', 'warsztat', 'moto']
  },
  HEALTH_AND_BEAUTY: {
    label: 'Zdrowie i uroda',
    keywords: ['kosmetyk', 'cosmetic', 'uroda', 'beauty', 'pielęgnac', 'skincare', 'makijaż', 'makeup', 'perfum', 'fragrance', 'krem', 'serum', 'szampon', 'shampoo', 'paznokci', 'nail', 'włos', 'hair', 'drogeria', 'spa', 'masaż', 'apteka', 'pharmacy', 'suplement', 'witamin', 'zdrowie']
  },
  ANIMALS_AND_PET_SUPPLIES: {
    label: 'Zwierzęta i akcesoria',
    keywords: ['zwierzęt', 'zwierzą', 'pet', 'pies', 'dog', 'kot', 'cat', 'karma', 'food for', 'smycz', 'akwarium', 'aquarium', 'gryzoni', 'ptaki', 'bird', 'weteryn', 'zoolog', 'zoo', 'pupil', 'łapa', 'piesek', 'kotek', 'koci', 'psi']
  },
  FOOD_DRINK_AND_TOBACCO: {
    label: 'Żywność i napoje',
    keywords: ['żywność', 'food', 'jedzenie', 'napoj', 'drink', 'kawa', 'coffee', 'herbata', 'tea', 'wino', 'wine', 'alkohol', 'piwo', 'beer', 'delikates', 'przyprawa', 'spice', 'ekologiczn', 'organic', 'bio', 'vegan', 'dietetyczn', 'słodycz', 'czekolad', 'chocolate', 'oliwa']
  },
  KIDS_AND_BABIES: {
    label: 'Dzieci i niemowlęta',
    keywords: ['dziec', 'child', 'kids', 'niemowl', 'baby', 'zabawka', 'toy', 'wózek', 'stroller', 'fotelik', 'pieluch', 'diaper', 'ciąża', 'mama', 'maluch', 'przedszkol', 'szkoln', 'plecak szkoln', 'dziecięc', 'bobas', 'smoczek', 'łóżeczk']
  },
  HOME_AND_GARDEN: {
    label: 'Dom i ogród',
    keywords: ['dom', 'home', 'ogród', 'garden', 'dekoracj', 'decoration', 'wnętrz', 'interior', 'meble ogrodow', 'narzędzia', 'tools', 'oświetleni', 'lighting', 'dywan', 'zasłon', 'firan', 'doniczk', 'roślin', 'plant', 'grill', 'basen', 'ogrodow', 'remont', 'budow', 'farba', 'tapeta']
  },
  GAMES_AND_TOYS: {
    label: 'Gry i zabawki',
    keywords: ['gra', 'game', 'zabawka', 'toy', 'planszow', 'board game', 'puzzl', 'klocki', 'lego', 'lalka', 'doll', 'figurk', 'playstation', 'xbox', 'nintendo', 'gier', 'gaming', 'karcian', 'rpg', 'model', 'zdalnie sterowan']
  },
  TRAVEL_ACCESSORIES: {
    label: 'Akcesoria podróżne',
    keywords: ['podróż', 'travel', 'walizk', 'luggage', 'bagaż', 'plecak', 'backpack', 'torba podróżn', 'namiot', 'tent', 'śpiwor', 'sleeping bag', 'kemping', 'camping', 'turystyczn', 'tourist', 'mapa', 'kompas', 'latarka']
  },
  JEWELRY: {
    label: 'Biżuteria',
    keywords: ['biżuter', 'jewelry', 'jewellery', 'złoto', 'gold', 'srebro', 'silver', 'pierścion', 'ring', 'naszyjnik', 'necklace', 'bransolet', 'bracelet', 'kolczyk', 'earring', 'zegarek', 'watch', 'diament', 'diamond', 'klejnot', 'gem', 'wisior']
  },
  CLOTHES_AND_ACCESSORIES: {
    label: 'Odzież i akcesoria',
    keywords: ['odzież', 'ubrania', 'clothing', 'fashion', 'moda', 'sukienk', 'dress', 'koszul', 'shirt', 'spodnie', 'pants', 'jeans', 'bluza', 'kurtka', 'jacket', 'płaszcz', 'coat', 'buty', 'shoes', 'obuwie', 'footwear', 'torebk', 'bag', 'portfel', 'pasek', 'belt', 'czapk', 'szalik', 'garnitur', 'suit', 'bielizn', 'underwear', 'skarpet']
  },
  FURNITURE: {
    label: 'Meble',
    keywords: ['meble', 'furniture', 'sofa', 'kanapa', 'krzesło', 'chair', 'stół', 'table', 'biurko', 'desk', 'szafa', 'wardrobe', 'łóżko', 'bed', 'materac', 'mattress', 'regał', 'shelf', 'komoda', 'fotel', 'armchair', 'meblowy', 'tapicersk']
  },
  HEALTH_AND_WELLNESS: {
    label: 'Zdrowie i wellness',
    keywords: ['wellness', 'zdrowie', 'health', 'suplementy', 'supplements', 'witaminy', 'vitamins', 'dieta', 'diet', 'odchudzanie', 'detox', 'medycyn', 'medical', 'rehabilitacj', 'masażer', 'inhalator', 'ciśnieniomierz', 'termometr', 'ortopedyczn', 'zioła', 'herbs', 'naturalne']
  }
};

// ─── Detect industry from URL ────────────────────────────────────────
async function detectIndustry(url) {
  // Normalize URL
  if (!url.startsWith('http')) url = 'https://' + url;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; edrone-bot/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'pl,en;q=0.5'
      },
      redirect: 'follow'
    });
    clearTimeout(timeout);

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract text signals
    const title = $('title').text() || '';
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDesc = $('meta[property="og:description"]').attr('content') || '';
    const h1 = $('h1').first().text() || '';
    const h2s = $('h2').map((_, el) => $(el).text()).get().slice(0, 5).join(' ');

    // Also grab nav/menu links and category names (common in e-commerce)
    const navText = $('nav a, .menu a, .nav a, .categories a, [class*="categ"] a, [class*="menu"] a')
      .map((_, el) => $(el).text()).get().slice(0, 30).join(' ');

    const corpus = [title, metaDesc, metaKeywords, ogTitle, ogDesc, h1, h2s, navText]
      .join(' ')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics for matching
      .replace(/\s+/g, ' ');

    // Also keep original with Polish chars for exact matching
    const corpusOriginal = [title, metaDesc, metaKeywords, ogTitle, ogDesc, h1, h2s, navText]
      .join(' ')
      .toLowerCase()
      .replace(/\s+/g, ' ');

    // Score each industry
    const scores = {};
    let maxScore = 0;
    let secondScore = 0;
    let bestIndustry = 'OTHER';

    for (const [industry, { keywords }] of Object.entries(INDUSTRY_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Check both normalized and original corpus
        const countNorm = (corpus.match(new RegExp(kwNorm, 'g')) || []).length;
        const countOrig = (corpusOriginal.match(new RegExp(kw, 'g')) || []).length;
        score += Math.max(countNorm, countOrig);
      }
      scores[industry] = score;

      if (score > maxScore) {
        secondScore = maxScore;
        maxScore = score;
        bestIndustry = industry;
      } else if (score > secondScore) {
        secondScore = score;
      }
    }

    // Determine confidence
    let confidence = 'low';
    if (maxScore >= 3 && maxScore >= secondScore * 2) confidence = 'high';
    else if (maxScore >= 2 && maxScore >= secondScore * 1.5) confidence = 'medium';

    // Fallback
    if (maxScore < 2) {
      return { industry: null, confidence: 'none', label: null, scores };
    }

    const label = INDUSTRY_KEYWORDS[bestIndustry]?.label || bestIndustry;
    return { industry: bestIndustry, confidence, label, topScore: maxScore };

  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ─── API endpoint ────────────────────────────────────────────────────
app.post('/api/detect-industry', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const result = await detectIndustry(url);
    res.json(result);
  } catch (err) {
    console.error('Detection error:', err.message);
    res.status(500).json({ error: 'Nie udało się pobrać strony. Sprawdź URL.' });
  }
});

// ─── Static fallback ─────────────────────────────────────────────────
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`ROI Calculator running on :${PORT}`));
