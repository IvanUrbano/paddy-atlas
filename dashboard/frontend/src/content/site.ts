import type { ImageName } from './images'

export const nav = [
  { label: 'Overview', href: 'overview' },
  { label: 'Impact', href: 'impact' },
  { label: 'Variables', href: 'variables' },
  { label: 'Cycle', href: 'cycle' },
  { label: 'Method', href: 'method' },
  { label: 'Findings', href: 'findings' },
]

export const heroFacts = [
  { value: '2,338', label: 'clean plots' },
  { value: '6', label: 'agriblocks' },
  { value: '3', label: 'rice varieties' },
  { value: '120', label: 'day cycle' },
]

export const overviewFacts = [
  { label: 'Source', value: 'UCI ML Repository' },
  { label: 'DOI', value: '10.24432/C55W3J' },
  { label: 'Fields', value: '45 variables' },
  { label: 'Records', value: '2,789 raw → 2,338 clean' },
]

export const stats = [
  {
    value: 2338,
    suffix: '',
    label: 'Clean plots',
    note: 'Unique records after removing 451 duplicate rows from the raw 2,789.',
  },
  {
    value: 45,
    suffix: '',
    label: 'Variables profiled',
    note: 'Farm traits, inputs, weather across four windows, and the yield outcome.',
  },
  {
    value: 451,
    suffix: '',
    label: 'Duplicates removed',
    note: 'Batched farm records de-duplicated before any statistic was computed.',
  },
  {
    value: 120,
    suffix: ' days',
    label: 'From nursery to harvest',
    note: 'Four growth windows, each with its own rain, heat, humidity and wind.',
  },
]

export const lenses = [
  {
    index: '01',
    title: 'Descriptive',
    question: 'What is happening in the field?',
    body: 'Every clean plot, summarised. Average yield by agriblock, variety and soil type, with distributions that show how the harvest is actually shaped.',
    points: ['2,338 records', '8 core views', 'Yield by block, variety, soil'],
    status: 'Available',
    image: 'terrace' as ImageName,
  },
  {
    index: '02',
    title: 'Diagnostic',
    question: 'Why does yield differ?',
    body: 'Crosstabs, outlier audits and the 120-day weather story. We separate real regional signals from noise before a single feature is selected.',
    points: ['Outlier audit', 'Variety × block mix', 'Weather trend analysis'],
    status: 'Available',
    image: 'patchwork' as ImageName,
  },
  {
    index: '03',
    title: 'Predictive',
    question: 'What happens next season?',
    body: 'The next chapter: feature selection with wrapper methods, then regression models that estimate yield from farm decisions and conditions.',
    points: ['Feature selection', 'Yield regression', 'Model validation'],
    status: 'In progress',
    image: 'grain' as ImageName,
  },
]

export const variables = [
  {
    index: '01',
    title: 'Farm & field',
    value: '1 – 6 ha',
    body: 'Plot size, agriblock, variety and soil type — the decisions a farmer makes before the season begins.',
    meta: ['hectares', 'agriblock', 'variety', 'soil_types'],
    image: 'terrace' as ImageName,
  },
  {
    index: '02',
    title: 'Water',
    value: '64 – 272 mm',
    body: 'Rainfall and irrigation recorded across four windows of the crop cycle. Water is the quietest variable and the hardest to control.',
    meta: ['30drain', '30_50dai', '51_70dai', '71_105dai'],
    image: 'water' as ImageName,
  },
  {
    index: '03',
    title: 'Heat',
    value: '15 – 35 °C',
    body: 'Minimum and maximum temperature for each growth window, plus the swing between them — a proxy for stress on the plant.',
    meta: ['min temp', 'max temp', 'temp range'],
    image: 'field' as ImageName,
  },
  {
    index: '04',
    title: 'Air',
    value: '64 – 96% RH',
    body: 'Relative humidity, instantaneous wind speed and prevailing direction. Panruti carries its own wind signature.',
    meta: ['humidity', 'wind speed', 'wind direction'],
    image: 'valley' as ImageName,
  },
  {
    index: '05',
    title: 'Yield',
    value: '5,410 – 38,814 kg',
    body: 'The outcome every other variable is measured against. Recorded at harvest, per plot, in kilograms.',
    meta: ['paddy_yield', 'trash', 'target variable'],
    image: 'grain' as ImageName,
  },
]

export const stages = [
  {
    index: '01',
    window: 'D1 — D30',
    title: 'Establish',
    body: 'Nursery to transplant. The young crop meets its first soil and its first rain — the window where establishment decides how much of the season is left to recover.',
    metrics: [
      { label: 'Rainfall', value: '18.1 – 19.6 mm' },
      { label: 'Irrigation', value: '20.4 – 21.9 mm' },
      { label: 'Min temp', value: '18.0 – 20.5 °C' },
    ],
    image: 'seedlings' as ImageName,
  },
  {
    index: '02',
    window: 'D31 — D60',
    title: 'Tillering',
    body: 'The crop spreads and the field fills in. Irrigation peaks in this window, and every millimetre is recorded against the plot that received it.',
    metrics: [
      { label: 'Rainfall', value: '185.2 – 187.2 mm' },
      { label: 'Irrigation', value: '270.8 – 272.8 mm' },
      { label: 'Humidity', value: '78 – 96 %' },
    ],
    image: 'water' as ImageName,
  },
  {
    index: '03',
    window: 'D61 — D90',
    title: 'Panicle',
    body: 'The canopy closes and the panicle forms. Humidity stays high, temperature swings widen, and wind becomes the variable that separates one block from another.',
    metrics: [
      { label: 'Rainfall', value: '165.3 – 167.0 mm' },
      { label: 'Humidity', value: '81 – 92 %' },
      { label: 'Wind', value: '4 – 10 knots' },
    ],
    image: 'closeup' as ImageName,
  },
  {
    index: '04',
    window: 'D91 — D120',
    title: 'Harvest',
    body: 'Grain fill, dry-down and the final measurement. Yield is taken in kilograms per plot — the number the whole analysis is built around.',
    metrics: [
      { label: 'Rainfall', value: '60.0 – 61.0 mm' },
      { label: 'Irrigation', value: '64.0 – 65.0 mm' },
      { label: 'Yield', value: '5,410 – 38,814 kg' },
    ],
    image: 'farmer' as ImageName,
  },
]

export const pipeline = [
  {
    index: '01',
    title: 'Ingest',
    body: 'The raw CSV enters the pipeline exactly as published: 2,789 rows across 45 fields, every value held as text first.',
    tag: 'pandas',
  },
  {
    index: '02',
    title: 'Profile',
    body: 'Shape, head, tail, dtypes and summary statistics. The audit happens before any transformation, so nothing is lost silently.',
    tag: 'audit',
  },
  {
    index: '03',
    title: 'Clean',
    body: 'Columns renamed to snake_case, types coerced, 451 duplicate rows dropped. The working set settles at 2,338 unique plots.',
    tag: 'clean',
  },
  {
    index: '04',
    title: 'Engineer',
    body: 'Seven derived features capture temperature range and early-to-late trends. Z-scores bring 49 numeric columns onto one scale.',
    tag: 'features',
  },
  {
    index: '05',
    title: 'Model',
    body: 'Feature selection and yield regression are the next build. The dashboard will read the same clean frame the notebook produced.',
    tag: 'next',
  },
]

export const findings = [
  {
    tag: 'Diagnostic',
    meta: 'Finding 01 · 4 min read',
    title: 'Yield tracks farm size almost one-to-one.',
    excerpt:
      'Six-hectare plots land near 34,000 kg; one-hectare plots near 5,800 kg. Size explains most of the variance before any agronomy enters the model.',
    detail:
      'Because the raw file is ordered by hectares, an unshuffled train/test split would leak that structure. The analysis normalises yield per hectare and shuffles before splitting, so the model is asked about farming decisions — not plot area.',
    image: 'planting' as ImageName,
  },
  {
    tag: 'Data quality',
    meta: 'Finding 02 · 3 min read',
    title: "Panruti's wind is a signal, not an error.",
    excerpt:
      'The only boxplot outliers in the dataset sit in one column, and all 360 of them belong to a single agriblock.',
    detail:
      'The IQR audit flags 15.4% of wind-speed readings at D61–D90. Every flagged record comes from Panruti, spread across all three varieties, with physically plausible values. They are kept as genuine regional variation rather than trimmed away.',
    image: 'patchwork' as ImageName,
  },
  {
    tag: 'Descriptive',
    meta: 'Finding 03 · 3 min read',
    title: 'The weather barely moves.',
    excerpt:
      'Rainfall in the first window spans just 1.5 mm across every record. Some climate columns carry almost no signal.',
    detail:
      'Narrow ranges mean low variance, and low variance means little explanatory power. The early-to-late trend features — temperature, rainfall, humidity — recover some of that movement and make the weather usable in a model.',
    image: 'water' as ImageName,
  },
]

export const footerLinks = {
  explore: [
    { label: 'Overview', href: 'overview' },
    { label: 'Impact', href: 'impact' },
    { label: 'Variables', href: 'variables' },
    { label: 'Findings', href: 'findings' },
  ],
  project: [
    { label: 'Method', href: 'method' },
    { label: '120-day cycle', href: 'cycle' },
  ],
}
