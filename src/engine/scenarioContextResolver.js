/**
 * ScenarioContextResolver - MAUSAM System-Wide Single Source of Decision Truth
 * 
 * Unifies weather intelligence across Homepage UI, Recommendation Engine, Alert Engine,
 * Chatbot Assistant, and Voice Assistant.
 * 
 * Enforces composite scenario identities: user_id + activity_id + date + start_time + end_time + location
 * and produces authoritative DecisionContext objects that eliminate system contradictions.
 */

import { evaluateSharedWeatherIntelligence } from './sharedWeatherIntelligence.js';
import { getAllowedFactors, normalizeActivityType } from './contextRelevanceEngine.js';
import { timeContextService } from '../services/timeContextService.js';
import { parseTime, formatTime12h, formatTimeRange12h } from '../utils/timeUtils.js';

export function resolveScenarioContext({
  userId = 'usr_demo',
  activityId = null,
  activity = null,
  query = '',
  date = null,
  timeWindow = null,
  selectedPersonas = ['daily_life'],
  routine = [],
  weatherData = {},
  safetyInfo = {},
  language = 'en'
} = {}) {
  const liveTimeCtx = timeContextService.getCurrentContext();
  const current = weatherData?.current || {};
  const primaryPersona = selectedPersonas[0] || 'daily_life';
  const isHindi = language === 'hi' || language === 'Hindi';

  // 1. Evaluate Shared Weather Intelligence for single source of truth
  const sharedIntel = evaluateSharedWeatherIntelligence({
    userId,
    date: date || liveTimeCtx.currentDate,
    selectedPersonas,
    routine,
    weatherData
  });

  const pdi = sharedIntel.primary_decision_insight;
  const activityPlan = sharedIntel.today_activity_plan || [];

  // 2. Identify Target Activity from routine or activityId
  let targetActivity = activity;
  if (!targetActivity && activityId) {
    targetActivity = routine.find(r => r.id === activityId);
  }

  // If no explicit activity passed, search routine matching query or default to primary activity
  if (!targetActivity && routine && routine.length > 0) {
    const qLower = (query || '').toLowerCase();
    targetActivity = routine.find(r => {
      const label = (r.label || '').toLowerCase();
      const type = (r.type || '').toLowerCase();
      return (qLower.includes('run') && (type.includes('run') || label.includes('run'))) ||
             (qLower.includes('football') && label.includes('football')) ||
             (qLower.includes('cricket') && label.includes('cricket')) ||
             (qLower.includes('sports') && type.includes('sport')) ||
             (qLower.includes('college') && (type.includes('college') || label.includes('college'))) ||
             (qLower.includes('travel') && (type.includes('travel') || label.includes('travel'))) ||
             (qLower.includes('commute') && (type.includes('commute') || label.includes('commute')));
    }) || routine[0];
  }

  // 3. Match with Activity Plan evaluation from Shared Weather Intelligence
  let targetPlanItem = null;
  if (targetActivity) {
    targetPlanItem = activityPlan.find(p => p.activityId === targetActivity.id || p.label === targetActivity.label);
  }

  // Default to primary activity or global PDI if no routine activity exists
  if (!targetPlanItem && activityPlan.length > 0) {
    targetPlanItem = activityPlan[0];
  }

  // 4. Construct Composite Scenario Identity
  const scenarioDate = date || liveTimeCtx.currentDate;
  const actStartTime = targetActivity?.startTime || targetPlanItem?.startTime || '07:00';
  const actEndTime = targetActivity?.endTime || targetPlanItem?.endTime || '08:00';
  const actLocation = targetActivity?.location || weatherData?.name || 'Selected Ground';
  const actType = normalizeActivityType(targetActivity?.type || targetPlanItem?.type || 'sports');

  const scenario_id = `${userId}_${targetActivity?.id || 'gen'}_${scenarioDate}_${actStartTime}_${actEndTime}_${actLocation.replace(/\s+/g, '_')}`;

  // 5. Allowed Factors Gate Enforcement
  const allowedFactors = getAllowedFactors({ activity_type: actType, ...targetActivity }, primaryPersona);

  // 6. Build Decision Context
  const decisionStatus = targetPlanItem?.recommendation?.status || pdi?.recommendation?.status || 'GO';
  const decisionReason = targetPlanItem?.recommendation?.reasoning || pdi?.recommendation?.reasoning || (isHindi ? 'मौसम की स्थिति अनुकूल है।' : 'Weather conditions are favorable.');
  const suggestedWindow = targetPlanItem?.recommendation?.suggestedWindow || pdi?.recommendation?.suggestedWindow || (isHindi ? 'वर्तमान समय उत्तम है।' : 'Current window is optimal.');
  const actionAdvice = targetPlanItem?.recommendation?.actionAdvice || pdi?.recommendation?.actionAdvice || '';

  return {
    scenario_id,
    scenario_type: targetActivity ? 'SCHEDULED_ACTIVITY' : 'CURRENT_WEATHER',
    activity: targetActivity ? {
      id: targetActivity.id,
      name: targetActivity.label,
      type: targetActivity.type,
      startTime: actStartTime,
      endTime: actEndTime,
      formattedTimeRange: formatTimeRange12h(actStartTime, actEndTime),
      location: actLocation
    } : null,
    temporal_context: {
      date: scenarioDate,
      start_time: actStartTime,
      end_time: actEndTime,
      timezone: liveTimeCtx.timezone,
      reference_time: liveTimeCtx.time12h,
      display_time: formatTimeRange12h(actStartTime, actEndTime)
    },
    location_context: {
      name: actLocation,
      district: weatherData?.district || weatherData?.name || 'Selected Location'
    },
    weather_context: {
      data_mode: targetActivity ? 'HOURLY_FORECAST' : 'LIVE_CURRENT',
      forecast_timestamp: liveTimeCtx.iso,
      weather_snapshot: current
    },
    relevant_factors: allowedFactors,
    evaluated_values: {
      temp: targetPlanItem?.metrics?.temp ?? current.temp ?? 28,
      pop: targetPlanItem?.metrics?.rainProb ?? current.rainProbability ?? 15,
      wbgt: targetPlanItem?.metrics?.wbgt ?? current.wbgt?.value ?? 26.5,
      wind: targetPlanItem?.metrics?.wind ?? current.windSpeed ?? 10
    },
    decision: {
      status: decisionStatus,
      severity: decisionStatus === 'RESCHEDULE' ? 'HIGH' : (decisionStatus === 'MODIFY' ? 'MEDIUM' : 'LOW'),
      reason: decisionReason,
      suggested_window: suggestedWindow,
      actionAdvice
    },
    sharedIntelligence: sharedIntel,
    generated_at: liveTimeCtx.iso,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };
}
