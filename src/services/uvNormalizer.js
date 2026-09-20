/**
 * MAUSAM UV Response Normalizer
 * Normalizes OpenUV, WeatherAPI, or generic UV data into standard MAUSAM format.
 */

export function getUVCategory(uvIndex) {
  const val = Number(uvIndex) || 0;
  if (val <= 2) return { category: 'Low', categoryHi: 'कम', color: '#0F6E56' };
  if (val <= 5) return { category: 'Moderate', categoryHi: 'मध्यम', color: '#BA7517' };
  if (val <= 7) return { category: 'High', categoryHi: 'उच्च', color: '#D85A38' };
  if (val <= 10) return { category: 'Very High', categoryHi: 'अत्यधिक उच्च', color: '#A32D2D' };
  return { category: 'Extreme', categoryHi: 'अति तीव्र', color: '#791A88' };
}

export function normalizeUVResponse(raw, source = 'OpenUV') {
  if (!raw) return null;

  // OpenUV format: { result: { uv: 6.4, uv_max: 8.1, uv_max_time: "..." } }
  // WeatherAPI format: raw.current.uv or direct number
  let uvIndex = 0;
  let uvMax = null;
  let uvMaxTime = null;

  if (typeof raw === 'number') {
    uvIndex = raw;
  } else if (raw.result && typeof raw.result.uv === 'number') {
    uvIndex = raw.result.uv;
    uvMax = raw.result.uv_max;
    uvMaxTime = raw.result.uv_max_time;
  } else if (raw.current && typeof raw.current.uv === 'number') {
    uvIndex = raw.current.uv;
  } else if (typeof raw.uv === 'number') {
    uvIndex = raw.uv;
  }

  const categoryInfo = getUVCategory(uvIndex);

  return {
    index: Math.round(uvIndex * 10) / 10,
    category: categoryInfo.category,
    categoryHi: categoryInfo.categoryHi,
    color: categoryInfo.color,
    maxIndex: uvMax ? Math.round(uvMax * 10) / 10 : null,
    maxTime: uvMaxTime,
    isLive: true,
    source,
    fetchedAt: Date.now()
  };
}
