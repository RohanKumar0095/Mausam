import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Check, Plus, X, Trash2, Edit2 } from 'lucide-react';
import { customLocationStore } from '../data/customLocationStore';
import { useI18n } from '../i18n/i18nContext';
import LocationHierarchyForm from '../components/locations/LocationHierarchyForm';

export default function LocationSetup({ onContinueLocations, onBack }) {
  const { language, t } = useI18n();
  const isHindi = language === 'hi';

  const [customLocations, setCustomLocations] = useState(() => customLocationStore.getCustomLocations());
  const [selectedLocations, setSelectedLocations] = useState(() => {
    const list = customLocationStore.getCustomLocations();
    return list.map(l => l.id);
  });

  // Modal form state (for Add and Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const toggleLocation = (id) => {
    if (selectedLocations.includes(id)) {
      setSelectedLocations(selectedLocations.filter(x => x !== id));
    } else {
      setSelectedLocations([...selectedLocations, id]);
    }
  };

  const handleOpenAddModal = () => {
    setEditingLocation(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (loc, e) => {
    e.stopPropagation();
    setEditingLocation(loc);
    setIsModalOpen(true);
  };

  const handleDeleteLocation = (id, e) => {
    e.stopPropagation();
    const updated = customLocationStore.deleteCustomLocation(id);
    setCustomLocations(updated);
    setSelectedLocations(selectedLocations.filter(x => x !== id));
  };

  const handleSaveLocationData = (locationData) => {
    if (editingLocation) {
      customLocationStore.updateCustomLocation(editingLocation.id, locationData);
      const allUpdated = customLocationStore.getCustomLocations();
      setCustomLocations(allUpdated);
    } else {
      const newLoc = customLocationStore.saveCustomLocation(locationData);
      const allUpdated = customLocationStore.getCustomLocations();
      setCustomLocations(allUpdated);
      setSelectedLocations([newLoc.id, ...selectedLocations]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F4F8FB] flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-medium">
            {isHindi ? 'स्थान सेटअप' : 'LOCATION PURPOSE SETUP'}
          </span>
          <div className="w-4" />
        </div>

        <div className="mb-3">
          <h2 className="text-base font-bold text-slate-900 leading-snug">
            {isHindi ? 'आपकी दैनिक गतिविधियाँ कहाँ होती हैं?' : 'Where are your daily activities performed?'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {isHindi 
              ? 'मौसम-अनुकूलित परामर्श के लिए अपने घर, कार्यालय, खेत या पार्क के स्थान जोड़ें।'
              : 'Add and select your personal locations to synchronize context-aware weather advisories.'}
          </p>
        </div>

        {/* Add New Location Action Button */}
        <button
          onClick={handleOpenAddModal}
          className="w-full py-2.5 px-3 mb-3 bg-white hover:bg-sky-50 text-brand border border-dashed border-brand/50 rounded-mausam text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
        >
          <Plus className="w-4 h-4 text-brand" />
          <span>{isHindi ? '+ नया स्थान जोड़ें' : '+ Add New Location'}</span>
        </button>

        {/* Locations List / Empty State */}
        <div className="space-y-2 flex-1 overflow-y-auto max-h-[50vh] pr-1 py-1">
          {customLocations.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-mausam border border-slate-200 shadow-2xs my-auto">
              <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-semibold text-slate-800">
                {isHindi ? 'अभी तक कोई स्थान नहीं जोड़ा गया' : 'No locations added yet'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                {isHindi
                  ? 'व्यक्तिगत मौसम परामर्श प्राप्त करने के लिए "+ नया स्थान जोड़ें" बटन पर क्लिक करें।'
                  : 'Click "+ Add New Location" above to set up your home, workplace, farm, or outdoor activity spot.'}
              </p>
            </div>
          ) : (
            customLocations.map(loc => {
              const isSelected = selectedLocations.includes(loc.id);
              return (
                <div
                  key={loc.id}
                  onClick={() => toggleLocation(loc.id)}
                  className={`w-full p-3 rounded-mausam border text-left flex items-start justify-between gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-light/70 border-brand ring-1 ring-brand/30 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-900 text-xs truncate">
                        {loc.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-medium uppercase tracking-tight">
                        {isHindi ? 'कस्टम' : 'Custom'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                      <span className="bg-white px-1.5 py-0.2 rounded border border-slate-200 text-brand font-medium">
                        🏷️ {loc.purpose}
                      </span>
                      <span className="truncate">
                        {loc.area ? `${loc.area}, ` : ''}
                        {loc.city ? `${loc.city}, ` : ''}
                        {loc.district ? `${loc.district}, ` : ''}
                        {loc.state} {loc.pincode ? `(${loc.pincode})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(loc, e)}
                      className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-200/50"
                      title="Edit location"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteLocation(loc.id, e)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                      title="Delete location"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isSelected ? (
                      <div className="w-4 h-4 rounded bg-brand text-white flex items-center justify-center flex-shrink-0 ml-1">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border border-slate-300 flex-shrink-0 ml-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-slate-200 mt-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
          >
            {t('q_back')}
          </button>
          <button
            onClick={() => onContinueLocations(selectedLocations)}
            className="px-5 py-2 bg-brand hover:bg-brand-dark text-white rounded-mausam text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>{isHindi ? 'दैनिक दिनचर्या पर आगे बढ़ें' : 'Continue to Daily Routine'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Add / Edit Location Modal with LocationHierarchyForm */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-mausam shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-brand px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-300" />
                <h3 className="text-sm font-semibold">
                  {editingLocation 
                    ? (isHindi ? 'स्थान पदानुक्रम संपादित करें' : 'Edit Location Hierarchy') 
                    : (isHindi ? 'नया स्थान पदानुक्रम जोड़ें' : 'Add Location Hierarchy')}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-white/20 text-white/90">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[82vh]">
              <LocationHierarchyForm
                initialData={editingLocation}
                onSave={handleSaveLocationData}
                onCancel={() => setIsModalOpen(false)}
                isHindi={isHindi}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
