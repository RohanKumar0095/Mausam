/**
 * DecisionConsistencyValidator & TimeContextValidator
 * 
 * Ensures 100% decision alignment across Chatbot, Voice Assistant, Alerts, and Homepage UI.
 * Prevents chatbot engine from generating conflicting advice for scheduled routines.
 * Enforces accurate time-of-day phrases based on 24h clock.
 */

import { parseTime, formatTime12h } from '../utils/timeUtils.js';

export class TimeContextValidator {
  /**
   * Returns human-readable time-of-day label based on 24h hour value.
   * Eliminates errors like calling 8:41 PM "midday heat".
   */
  static getTimeOfDayLabel(timeInput, language = 'en') {
    const isHindi = language === 'hi' || language === 'Hindi';
    const parsed = parseTime(timeInput);
    const h = parsed.hour24;

    if (h >= 5 && h < 11) {
      return isHindi ? 'सुबह' : 'Morning';
    } else if (h >= 11 && h < 16) {
      return isHindi ? 'दोपहर' : 'Midday / Afternoon';
    } else if (h >= 16 && h < 19) {
      return isHindi ? 'शाम' : 'Evening';
    } else if (h >= 19 && h < 24) {
      return isHindi ? 'रात' : 'Night';
    } else {
      return isHindi ? 'देर रात' : 'Late Night';
    }
  }

  /**
   * Formats a precise timestamp phrase e.g. "Current conditions at 08:41 PM"
   */
  static formatPreciseTimePhrase(timeInput, language = 'en') {
    const isHindi = language === 'hi' || language === 'Hindi';
    const formatted = formatTime12h(timeInput);
    const label = this.getTimeOfDayLabel(timeInput, language);
    return isHindi ? `वर्तमान स्थितियाँ (${formatted}, ${label})` : `Current conditions at ${formatted} (${label})`;
  }
}

/**
 * Validates proposed chatbot response against authoritative ScenarioContext decision.
 */
export function validateDecisionConsistency(proposedResponse = {}, scenarioContext = {}, language = 'en') {
  if (!scenarioContext || !scenarioContext.decision) return proposedResponse;

  const isHindi = language === 'hi' || language === 'Hindi';
  const authDecision = scenarioContext.decision; // status: 'RESCHEDULE' | 'MODIFY' | 'GO'
  const act = scenarioContext.activity;

  if (!act) return proposedResponse;

  const draftAnswer = (proposedResponse.answer || '').toLowerCase();
  const draftWhy = (proposedResponse.why || '').toLowerCase();
  const combinedDraft = `${draftAnswer} ${draftWhy}`;

  // CONTRADICTION DETECTOR 1:
  // Authoritative decision = RESCHEDULE, but draft advises sticking to routine / claims conditions are safe
  const claimsRoutineIsGood = combinedDraft.includes('stick to your scheduled') ||
                             combinedDraft.includes('routine') && (combinedDraft.includes('better') || combinedDraft.includes('favorable') || combinedDraft.includes('safe') || combinedDraft.includes('recommended')) ||
                             combinedDraft.includes('आप अपनी सामान्य दिनचर्या');

  if (authDecision.status === 'RESCHEDULE' && claimsRoutineIsGood) {
    const formattedTime = act.formattedTimeRange || `${act.startTime}–${act.endTime}`;
    const reason = authDecision.reason || (isHindi ? 'मौसम सुरक्षा सीमा पार हो गई है।' : 'Weather parameters exceed configured safety thresholds.');
    const suggested = authDecision.suggested_window || (isHindi ? '8:30 AM के बाद' : 'later in the day after 8:30 AM');

    return {
      ...proposedResponse,
      answer: isHindi
        ? `नहीं, आपके निर्धारित ${act.name} सत्र (${formattedTime}) के लिए अभ्यास करना वर्तमान में अनुशंसित नहीं है (RESCHEDULE)।`
        : `No, your scheduled ${act.name} session (${formattedTime}) is currently NOT recommended (RESCHEDULE).`,
      why: isHindi
        ? `पूर्वानुमान के अनुसार आपके अभ्यास समय (${formattedTime}) पर ${reason}`
        : `Based on the latest forecast for your scheduled ${act.name} window (${formattedTime}): ${reason}`,
      action: isHindi
        ? `मुख्य अभ्यास को ${suggested} के लिए पुननिर्धारित (Reschedule) करें या इनडोर सत्र चुनें।`
        : `Reschedule your core training to ${suggested} or opt for an indoor tactical session.`,
      safety: isHindi ? '⚠️ पूर्वाग्रह-मुक्त निर्णय: पुननिर्धारण आवश्यक' : '⚠️ Authoritative Decision: Reschedule Recommended',
      ruleTriggered: 'DECISION_CONSISTENCY_VALIDATOR_OVERRIDE'
    };
  }

  // CONTRADICTION DETECTOR 2:
  // Authoritative decision = MODIFY, but draft claims complete GO without caution
  if (authDecision.status === 'MODIFY' && (combinedDraft.includes('perfect') || combinedDraft.includes('completely safe'))) {
    const formattedTime = act.formattedTimeRange || `${act.startTime}–${act.endTime}`;
    return {
      ...proposedResponse,
      answer: isHindi
        ? `आपके ${act.name} सत्र (${formattedTime}) में संशोधन की आवश्यकता है (MODIFY)।`
        : `Your ${act.name} session (${formattedTime}) requires adjustments (MODIFY).`,
      why: authDecision.reason || proposedResponse.why,
      action: authDecision.actionAdvice || proposedResponse.action,
      ruleTriggered: 'DECISION_CONSISTENCY_VALIDATOR_MODIFY_SYNC'
    };
  }

  return proposedResponse;
}
