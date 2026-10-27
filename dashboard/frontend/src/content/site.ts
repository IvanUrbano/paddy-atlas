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
  { label: 'Source fields', value: '45 + 7 derived' },
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
    label: 'Source variables',
    note: 'Farm traits, inputs and four weather windows. Seven derived features are added after cleaning.',
  },
  {
    value: 451,
    suffix: '',
    label: 'Duplicates removed',
    note: 'Batched farm records were de-duplicated before any statistic was computed.',
  },
  {
    value: 120,
    suffix: ' days',
    label: 'Crop cycle covered',
    note: 'Four weather windows from day 1 to day 120.',
  },
]

export const lenses = [
  {
    index: '01',
    title: 'Descriptive',
    question: 'What patterns are present?',
    body: 'Distributions and grouped means for total yield, yield per hectare, farm traits, inputs and weather across the clean plots.',
    points: ['2,338 records', '6 dashboard sections', 'Total and per-hectare measures'],
    status: 'Available',
    image: 'terrace' as ImageName,
  },
  {
    index: '02',
    title: 'Diagnostic',
    question: 'Which differences are large enough to examine?',
    body: 'Group comparisons, outlier checks and seasonal weather profiles. Differences are reported with sample counts and effect sizes where applicable.',
    points: ['Group comparisons', 'Outlier audit', 'Seasonal weather profile'],
    status: 'Available',
    image: 'patchwork' as ImageName,
  },
  {
    index: '03',
    title: 'Predictive',
    question: 'Can yield be predicted out of sample?',
    body: 'Planned work: feature selection and regression with block-grouped validation. This release is descriptive and diagnostic only.',
    points: ['Feature selection', 'Yield regression', 'Grouped validation'],
    status: 'Planned',
    image: 'grain' as ImageName,
  },
]

export const variables = [
  {
    index: '01',
    title: 'Farm & field',
    value: '1 – 6 ha',
    body: 'Plot size, agriblock, variety and soil type. Plot size is the largest source of variation in total yield.',
    meta: ['hectares', 'agriblock', 'variety', 'soil_types'],
    image: 'terrace' as ImageName,
  },
  {
    index: '02',
    title: 'Water',
    value: '18 – 187 mm rain',
    body: 'Rainfall and irrigation recorded in four growth windows. Both are constant within a block-window and change sharply between windows.',
    meta: ['30drain', '30_50dai', '51_70dai', '71_105dai'],
    image: 'water' as ImageName,
  },
  {
    index: '03',
    title: 'Heat',
    value: '15 – 35 °C',
    body: 'Minimum and maximum temperature for each growth window, plus the recorded temperature range.',
    meta: ['min temp', 'max temp', 'temp range'],
    image: 'field' as ImageName,
  },
  {
    index: '04',
    title: 'Air',
    value: '64 – 96% RH',
    body: 'Relative humidity and instantaneous wind speed. At D61–90, Panruti records 4 knots while the other five blocks record 8 or 10.',
    meta: ['humidity', 'wind speed', 'wind direction'],
    image: 'valley' as ImageName,
  },
  {
    index: '05',
    title: 'Yield',
    value: '5,410 – 38,814 kg',
    body: 'Total yield at harvest, recorded per plot in kilograms. Yield per hectare is derived by dividing by plot area.',
    meta: ['paddy_yield', 'yield_per_ha', 'target variable'],
    image: 'grain' as ImageName,
  },
]

export const stages = [
  {
    index: '01',
    window: 'D1 — D30',
    title: 'Establish',
    body: 'Nursery and transplant window. Recorded rainfall is 18.1–19.6 mm and irrigation is 20.4–21.9 mm across blocks.',
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
    body: 'Irrigation is highest in this window. The record shows 270.8–272.8 mm across blocks, alongside 185.2–187.2 mm of rain.',
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
    body: 'Rainfall stays close to 166 mm. Wind separates the blocks: Panruti records 4 knots; the other five record 8 or 10.',
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
    body: 'Final measurement window. Rainfall is 60.0–61.0 mm and irrigation is 64.0–65.0 mm; yield is recorded in kilograms per plot.',
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
    body: 'The published CSV contains 2,789 rows and 45 source fields. Values are read as text first, then typed.',
    tag: 'pandas',
  },
  {
    index: '02',
    title: 'Profile',
    body: 'Shape, dtypes, missing values, duplicates and summary statistics are checked before transformation.',
    tag: 'audit',
  },
  {
    index: '03',
    title: 'Clean',
    body: 'Columns are renamed to snake_case, types are coerced and 451 duplicate rows are dropped, leaving 2,338 unique plots.',
    tag: 'clean',
  },
  {
    index: '04',
    title: 'Engineer',
    body: 'Seven derived fields capture temperature range, season totals and early-to-late weather summaries.',
    tag: 'features',
  },
  {
    index: '05',
    title: 'Model',
    body: 'Feature selection and yield regression are planned. This release stops at descriptive and diagnostic analysis.',
    tag: 'next',
  },
]

export const findings = [
  {
    tag: 'Descriptive',
    meta: 'Finding 01 · scale effect',
    title: 'Total yield rises with plot size.',
    excerpt:
      'Mean total yield is 5,746 kg at 1 ha and 36,256 kg at 6 ha. Hectares and total yield correlate at r = 0.994.',
    detail:
      'Plot size is also associated with yield per hectare (r = 0.595; η² = 0.496 across the six size groups). Dividing by area removes most of the dispersion, but not the entire size gradient.',
    image: 'planting' as ImageName,
  },
  {
    tag: 'Data quality',
    meta: 'Finding 02 · wind audit',
    title: 'The low-wind records are regional, not errors.',
    excerpt:
      'All 360 IQR-flagged wind readings in D61–90 are 4 knots, and every one occurs in Panruti.',
    detail:
      'The other five blocks record 8 or 10 knots in this window. The flagged values are physically plausible and vary by block, so they were retained and labelled rather than trimmed.',
    image: 'patchwork' as ImageName,
  },
  {
    tag: 'Descriptive',
    meta: 'Finding 03 · seasonal weather',
    title: 'Rainfall changes by season; humidity also changes by block.',
    excerpt:
      'Mean rainfall is 18.7 mm in D1–30, 186.0 mm in D31–60, 166.2 mm in D61–90 and 60.4 mm in D91–120.',
    detail:
      'Between-block rainfall ranges are about 1–2 mm within each window. Humidity is less uniform: D1–30 block means range from 64.6% to 88.5%, so it is not interchangeable across blocks.',
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
