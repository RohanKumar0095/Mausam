/**
 * SAFETY OVERRIDE HIERARCHY (IMD Green / Amber / Red Standards)
 */

export function evaluateSafetyOverride({
  weatherData = {},
  simulatedSeverity = null,
  currentActivity = null,
  selectedPersonas = ['daily_life'],
  language = 'en'
}) {
  const isHindi = language === 'hi' || language === 'Hindi';
  const warning = weatherData?.warning || { level: 'GREEN', code: 'no_warning', text: 'No warning' };

  if (simulatedSeverity === 'RED' || warning.level === 'RED') {
    return {
      isSevere: true,
      severityLevel: 'RED',
      color: '#E24B4A',
      bg: '#FDF3F2',
      border: '#E24B4A',
      title: isHindi ? '🚨 गंभीर मौसम चेतावनी (रेड अलर्ट)' : '🚨 SEVERE WEATHER WARNING (RED ALERT)',
      text: isHindi
        ? 'अत्यधिक भारी बारिश, आंधी-तूफान और आकाशीय बिजली की गंभीर चेतावनी। सभी बाहरी गतिविधियों को तुरंत रोकें और पक्के आश्रय में रहें।'
        : 'Severe thunderstorm, heavy squall, and lightning hazard. Suspend all outdoor operations immediately and seek indoor shelter.',
      actionRequired: isHindi
        ? 'सुरक्षा अधिरोपण सक्रिय: सामान्य व्यक्तिगत प्राथमिकताओं को सुरक्षा निर्देशों से बदल दिया गया है।'
        : 'Safety Override Active: Routine personalization superseded by severe safety protocols.'
    };
  }

  if (warning.level === 'AMBER' || warning.level === 'ORANGE') {
    return {
      isSevere: true,
      severityLevel: 'AMBER',
      color: '#BA7517',
      bg: '#FAF5ED',
      border: '#BA7517',
      title: isHindi ? '⚠️ मौसम चेतावनी (ऑरेंज / एम्बर अलर्ट)' : '⚠️ WEATHER ADVISORY (AMBER ALERT)',
      text: isHindi
        ? 'गरज के साथ तेज बारिश की संभावना। यात्रा और बाहरी कसरत में सावधानी बरतें।'
        : 'Moderate thunderstorm & localized waterlogging risk. Exercise caution for transit and field operations.',
      actionRequired: isHindi
        ? 'मौसम की स्थिति पर नजर रखें और बैकअप योजना तैयार रखें।'
        : 'Monitor live radar updates and prepare alternative schedules.'
    };
  }

  return {
    isSevere: false,
    severityLevel: 'GREEN',
    color: '#639922',
    bg: '#F0F6E8',
    border: '#639922',
    title: isHindi ? 'सुरक्षित मौसम स्थिति (ग्रीन)' : 'SAFE WEATHER STATUS (GREEN)',
    text: isHindi
      ? 'कोई गंभीर मौसम चेतावनी नहीं। सामान्य व्यक्तिगत प्राथमिकताओं के साथ आगे बढ़ें।'
      : 'No severe weather warnings in effect. Normal personalized conditions apply.',
    actionRequired: null
  };
}
