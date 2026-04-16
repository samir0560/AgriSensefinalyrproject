/**
 * Human-readable rows for saved feature history (no raw JSON).
 */

function unwrapData(response) {
  if (!response || typeof response !== 'object') return null;
  if ('data' in response && response.data !== undefined) return response.data;
  return response;
}

const BODY_KEYS = [
  ['cropType', 'cropType'],
  ['soilType', 'soilType'],
  ['season', 'season'],
  ['nitrogen', 'nitrogen'],
  ['phosphorus', 'phosphorus'],
  ['potassium', 'potassium'],
  ['temperature', 'temperature'],
  ['humidity', 'humidity'],
  ['ph', 'phLevel'],
  ['pH', 'phLevel'],
  ['rainfall', 'rainfall'],
  ['moisture', 'moisture'],
  ['organicMatter', 'organicMatter']
];

/**
 * @returns {{ label: string, value: string }[]}
 */
export function getRequestRows(featureType, request, t) {
  const rows = [];
  if (!request || typeof request !== 'object') return rows;

  const body =
    request.body && typeof request.body === 'object' && !Array.isArray(request.body)
      ? request.body
      : null;
  const query = request.query && typeof request.query === 'object' ? request.query : null;

  if (request.file?.originalname) {
    rows.push({ label: t('accountRequestImage'), value: String(request.file.originalname) });
  }
  if (request.imageFileName) {
    rows.push({ label: t('accountRequestImage'), value: String(request.imageFileName) });
  }
  if (request.source) {
    rows.push({ label: t('accountRequestSource'), value: String(request.source) });
  }

  const src = body || {};
  if (src._truncated) {
    rows.push({ label: t('accountRequestNote'), value: t('accountRequestTruncated') });
  }

  if (src.location?.coordinates && Array.isArray(src.location.coordinates)) {
    rows.push({
      label: t('coordinates'),
      value: src.location.coordinates.map((n) => Number(n)).join(', ')
    });
  }

  for (const [key, labelKey] of BODY_KEYS) {
    if (src[key] !== undefined && src[key] !== null && src[key] !== '') {
      rows.push({ label: t(labelKey), value: String(src[key]) });
    }
  }

  if (query) {
    if (query.city) rows.push({ label: t('cityName'), value: String(query.city) });
    if (query.lat != null && query.lon != null) {
      rows.push({ label: t('coordinates'), value: `${query.lat}, ${query.lon}` });
    }
    if (query.days) rows.push({ label: t('accountForecastDays'), value: String(query.days) });
  }

  return rows;
}

function addCropOrFertilizerRows(data, t, rows, isFertilizer) {
  if (!Array.isArray(data) || data.length === 0) return;
  const top = data[0];
  const name = top.name || top.crop || top.fertilizer;
  if (name) {
    rows.push({
      label: isFertilizer ? t('recommendedFertilizer') : t('topRecommendedCrop'),
      value: String(name)
    });
  }
  if (top.confidence != null) {
    rows.push({ label: t('confidence'), value: `${Math.round(Number(top.confidence))}%` });
  }
  if (top.npk) {
    rows.push({ label: t('npkRatio'), value: String(top.npk) });
  }
  const rest = data
    .slice(1, 6)
    .map((x) => x.name)
    .filter(Boolean);
  if (rest.length) {
    rows.push({ label: t('accountResultAlternatives'), value: rest.join(', ') });
  }
}

function addDiseaseRows(data, t, rows) {
  const d = data;
  const disease = d.disease ?? d.prediction ?? d.label;
  if (disease) rows.push({ label: t('diseaseDetected'), value: String(disease) });
  if (d.confidence != null) {
    rows.push({ label: t('confidenceLevel'), value: `${Math.round(Number(d.confidence))}%` });
  }
  if (d.description) {
    rows.push({ label: t('description'), value: String(d.description) });
  }
  if (d.treatment) {
    rows.push({ label: t('treatmentAdvice'), value: String(d.treatment) });
  }
}

function addIrrigationRows(data, t, rows) {
  if (data.recommendedMethod) {
    rows.push({ label: t('recommendedMethod'), value: String(data.recommendedMethod) });
  }
  if (data.waterAmount != null) {
    rows.push({ label: t('waterAmount'), value: String(data.waterAmount) });
  }
  if (data.frequency) rows.push({ label: t('frequency'), value: String(data.frequency) });
  if (data.timing) rows.push({ label: t('timing'), value: String(data.timing) });
  if (Array.isArray(data.notes) && data.notes.length) {
    rows.push({ label: t('accountResultNotes'), value: data.notes.join(' · ') });
  }
  if (Array.isArray(data.recommendedSchedule) && data.recommendedSchedule.length) {
    const parts = data.recommendedSchedule.slice(0, 3).map((s) => {
      const bits = [s.date, s.amount != null ? `${s.amount}` : '', s.time].filter(Boolean);
      return bits.join(' ');
    });
    rows.push({ label: t('irrigationSchedule'), value: parts.join(' · ') });
  }
}

function addWeatherRows(data, t, rows) {
  const city = data.name || data.city?.name;
  if (city) rows.push({ label: t('cityName'), value: String(city) });
  if (data.main?.temp != null) {
    rows.push({ label: t('temperature'), value: `${data.main.temp}°C` });
  }
  if (data.weather?.[0]?.description) {
    rows.push({ label: t('accountResultWeatherDesc'), value: String(data.weather[0].description) });
  }
  if (data.main?.humidity != null) {
    rows.push({ label: t('humidity'), value: `${data.main.humidity}%` });
  }
}

function addForecastRows(data, t, rows) {
  if (data.city?.name) rows.push({ label: t('cityName'), value: String(data.city.name) });
  if (Array.isArray(data.list) && data.list.length) {
    const first = data.list[0];
    if (first?.main?.temp != null) {
      rows.push({ label: t('accountResultNextForecast'), value: `${first.main.temp}°C` });
    }
  }
}

function addSoilAnalysisRows(data, t, rows) {
  if (data.pHLevel) rows.push({ label: t('phLevel'), value: String(data.pHLevel) });
  if (data.soilType) rows.push({ label: t('soilType'), value: String(data.soilType) });
  if (Array.isArray(data.cropSuitability) && data.cropSuitability.length) {
    rows.push({
      label: t('accountResultSuitableCrops'),
      value: data.cropSuitability.slice(0, 8).join(', ')
    });
  }
  if (Array.isArray(data.recommendations)) {
    data.recommendations.forEach((r, i) => {
      const text = r.suggestion || r.message || r.text;
      if (text) {
        rows.push({
          label: `${t('accountResultRecommendation')} ${i + 1}`,
          value: String(text)
        });
      }
    });
  }
}

/**
 * @returns {{ label: string, value: string }[]}
 */
export function getResultRows(featureType, response, t) {
  const rows = [];
  if (!response || typeof response !== 'object') return rows;

  const data = unwrapData(response);
  if (data == null) return rows;

  if (data._truncated) {
    rows.push({ label: t('accountResultNote'), value: t('accountResultTruncated') });
    return rows;
  }

  switch (featureType) {
    case 'crop':
      if (Array.isArray(data)) addCropOrFertilizerRows(data, t, rows, false);
      break;
    case 'fertilizer':
      if (Array.isArray(data)) addCropOrFertilizerRows(data, t, rows, true);
      break;
    case 'disease':
      addDiseaseRows(data, t, rows);
      break;
    case 'irrigation':
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        addIrrigationRows(data, t, rows);
      }
      break;
    case 'weather_current':
      if (data && typeof data === 'object') addWeatherRows(data, t, rows);
      break;
    case 'weather_forecast':
      if (data && typeof data === 'object') addForecastRows(data, t, rows);
      break;
    case 'weather_historical':
      if (data.location) rows.push({ label: t('cityName'), value: String(data.location) });
      if (Array.isArray(data.data) && data.data.length) {
        const sample = data.data[0];
        if (sample?.temperature != null) {
          rows.push({ label: t('temperature'), value: String(sample.temperature) });
        }
      }
      break;
    case 'soil_analysis':
      if (data && typeof data === 'object') addSoilAnalysisRows(data, t, rows);
      break;
    case 'soil_submit':
      rows.push({
        label: t('accountResultSaved'),
        value: data._id ? String(data._id) : t('accountResultSoilSaved')
      });
      break;
    default:
      break;
  }

  if (rows.length === 0) {
    const fallback = formatFeatureSummary({ response });
    if (fallback) rows.push({ label: t('accountResultSummary'), value: fallback });
  }

  return rows.filter((r) => r.value && String(r.value).trim());
}

/** One-line preview for lists (kept for potential reuse). */
export function formatFeatureSummary(item) {
  const wrap = item.response;
  const inner = wrap && typeof wrap === 'object' && 'data' in wrap ? wrap.data : wrap;
  if (inner == null) return '';
  if (typeof inner === 'string') return inner.length > 160 ? `${inner.slice(0, 157)}…` : inner;
  if (typeof inner === 'object') {
    if (typeof inner.disease === 'string') return inner.disease;
    if (typeof inner.topCrop === 'string') return inner.topCrop;
    if (typeof inner.crop === 'string') return inner.crop;
    if (Array.isArray(inner.recommendations) && inner.recommendations[0]) {
      const first = inner.recommendations[0];
      if (first && typeof first.name === 'string') return first.name;
    }
    try {
      const str = JSON.stringify(inner);
      return str.length > 160 ? `${str.slice(0, 157)}…` : str;
    } catch {
      return '';
    }
  }
  return String(inner);
}
