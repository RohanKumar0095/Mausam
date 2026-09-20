import React from 'react';
import WidgetWeatherDetailModal from './WidgetWeatherDetailModal';

export default function ExplainModal({ widget, isOpen, onClose, weatherData, selectedPersonas }) {
  if (!isOpen || !widget) return null;

  return (
    <WidgetWeatherDetailModal
      widget={widget}
      isOpen={isOpen}
      onClose={onClose}
      weatherData={weatherData}
      selectedPersonas={selectedPersonas}
    />
  );
}

