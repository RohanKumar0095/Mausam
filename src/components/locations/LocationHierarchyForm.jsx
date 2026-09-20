import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Navigation, 
  MapPin, 
  Check, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  Edit3, 
  CheckCircle2 
} from 'lucide-react';
import { useLocationSearch } from '../../hooks/useLocationSearch';

export default function LocationHierarchyForm({
  initialData = null,
  onSave,
  onCancel,
  isHindi = false
}) {
  const {
    query,
    setQuery,
    suggestions,
    isSearching,
    isDetectingGps,
    error: searchError,
    noResults,
    detectGPS,
    clearSearch
  } = useLocationSearch(300);

  // Editable Location Form State
  const [name, setName] = useState(initialData?.name || '');
  const [area, setArea] = useState(initialData?.area || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [district, setDistrict] = useState(initialData?.district || initialData?.address?.split(',')[0] || '');
  const [state, setState] = useState(initialData?.state || '');
  const [country, setCountry] = useState(initialData?.country || 'India');
  const [pincode, setPincode] = useState(initialData?.pincode || '');
  const [latitude, setLatitude] = useState(initialData?.latitude != null ? String(initialData.latitude) : '');
  const [longitude, setLongitude] = useState(initialData?.longitude != null ? String(initialData.longitude) : '');
  
  const [purposes, setPurposes] = useState(
    Array.isArray(initialData?.purposes) && initialData.purposes.length > 0 
      ? initialData.purposes 
      : [initialData?.purpose || 'Home']
  );
  
  const [personas, setPersonas] = useState(
    Array.isArray(initialData?.personaDefault) ? initialData.personaDefault : (initialData?.personas || ['daily_life'])
  );

  const [formError, setFormError] = useState('');
  const [autoDetected, setAutoDetected] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update dropdown visibility based on query
  useEffect(() => {
    if (query.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [query]);

  // Handle selecting a location suggestion from search dropdown
  const handleSelectSuggestion = (suggestion) => {
    const { hierarchy } = suggestion;

    setArea(hierarchy.area || '');
    setCity(hierarchy.city || hierarchy.district || '');
    setDistrict(hierarchy.district || hierarchy.city || '');
    setState(hierarchy.state || '');
    setCountry(hierarchy.country || 'India');
    setPincode(hierarchy.pincode || '');
    setLatitude(hierarchy.latitude != null ? hierarchy.latitude.toFixed(4) : '');
    setLongitude(hierarchy.longitude != null ? hierarchy.longitude.toFixed(4) : '');

    // Auto fill location name if currently blank
    if (!name.trim()) {
      setName(suggestion.name || hierarchy.area || hierarchy.city || 'My Location');
    }

    setAutoDetected(true);
    setShowSuggestions(false);
    clearSearch();
    setFormError('');
  };

  // Handle "Use My Current Location" button click
  const handleUseCurrentLocation = async () => {
    setFormError('');
    setShowSuggestions(false);
    clearSearch();

    const result = await detectGPS();

    if (result.success && result.hierarchy) {
      const h = result.hierarchy;
      setArea(h.area || (isHindi ? 'वर्तमान क्षेत्र' : 'Current Locality'));
      setCity(h.city || h.district || '');
      setDistrict(h.district || h.city || '');
      setState(h.state || '');
      setCountry(h.country || 'India');
      setPincode(h.pincode || '');
      setLatitude(result.latitude.toFixed(4));
      setLongitude(result.longitude.toFixed(4));

      if (!name.trim()) {
        setName(isHindi ? 'वर्तमान स्थान' : 'Current Location');
      }

      setAutoDetected(true);
    } else {
      setFormError(result.message || (isHindi ? 'स्थान प्राप्त करने में विफल।' : 'Failed to retrieve GPS location.'));
    }
  };

  // Handle Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError(isHindi ? 'कृपया स्थान का नाम दर्ज करें (उदा. "मेरा घर")।' : 'Please enter a location label (e.g. "My Home").');
      return;
    }
    if (!city.trim() && !district.trim() && !area.trim()) {
      setFormError(isHindi ? 'कृपया कम से कम क्षेत्र, शहर या जिला दर्ज करें।' : 'Please fill at least Area, City, or District.');
      return;
    }
    if (!state.trim()) {
      setFormError(isHindi ? 'कृपया राज्य दर्ज करें।' : 'Please enter State.');
      return;
    }

    // Construct full address string
    const addressParts = [area, city, district, state, pincode, country].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    onSave({
      name: name.trim(),
      address: fullAddress,
      area: area.trim(),
      city: city.trim(),
      district: district.trim(),
      state: state.trim(),
      country: country.trim(),
      pincode: pincode.trim(),
      latitude: latitude !== '' ? Number(latitude) : 24.7955,
      longitude: longitude !== '' ? Number(longitude) : 85.0002,
      purposes,
      personas
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
      {/* Top Search & GPS Bar */}
      <div className="relative">
        <label className="block font-semibold text-slate-900 mb-1 text-[11.5px] flex items-center justify-between">
          <span>{isHindi ? 'स्थान खोजें / वर्तमान स्थान का उपयोग करें' : 'Search Location or Use GPS'}</span>
          {autoDetected && (
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              <Sparkles className="w-2.5 h-2.5" />
              {isHindi ? 'अंगूठे द्वारा पदानुक्रम स्वतः भर गया' : 'Hierarchy Auto-Detected'}
            </span>
          )}
        </label>

        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim().length >= 2 && setShowSuggestions(true)}
              placeholder={isHindi ? 'क्षेत्र, शहर, जिला या पिन कोड खोजें...' : 'Type Area, City, District or PIN code...'}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand/40 focus:border-brand focus:outline-none focus:bg-white transition-all"
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 text-brand animate-spin absolute right-3 top-3" />
            )}
          </div>

          {/* Use My Current Location Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isDetectingGps}
            className="px-3 py-2 bg-gradient-to-r from-sky-600 to-brand hover:from-sky-700 hover:to-brand-dark text-white font-medium rounded-lg text-[11px] shadow-xs flex items-center gap-1.5 shrink-0 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            title="Detect GPS & Auto-fill Location Hierarchy"
          >
            <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isDetectingGps 
                ? (isHindi ? 'खोज रहे हैं...' : 'Detecting GPS...') 
                : (isHindi ? 'मेरा स्थान' : 'Use Current Location')}
            </span>
            <span className="sm:hidden">
              {isDetectingGps ? '...' : (isHindi ? 'GPS' : 'GPS')}
            </span>
          </button>
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {showSuggestions && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
            {isSearching && (
              <div className="p-3 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
                <span>{isHindi ? 'स्थान पदानुक्रम खोज रहे हैं...' : 'Searching location hierarchy...'}</span>
              </div>
            )}

            {noResults && !isSearching && (
              <div className="p-3 text-center text-slate-500">
                <AlertCircle className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                <p className="font-medium text-[11px]">{isHindi ? 'कोई स्थान नहीं मिला' : 'No locations found'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isHindi ? 'कृपया नीचे पदानुक्रम फ़ील्ड को मैन्युअल रूप से भरें।' : 'You can manually enter the hierarchy fields below.'}
                </p>
              </div>
            )}

            {!isSearching && suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left p-2.5 hover:bg-sky-50 transition-colors flex items-start gap-2 group"
              >
                <MapPin className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 text-xs truncate">
                    {item.name}
                  </div>
                  <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                    {item.hierarchy.area ? `${item.hierarchy.area}, ` : ''}
                    {item.hierarchy.city ? `${item.hierarchy.city}, ` : ''}
                    {item.hierarchy.district ? `${item.hierarchy.district}, ` : ''}
                    {item.hierarchy.state} {item.hierarchy.pincode ? `(${item.hierarchy.pincode})` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Banner */}
      {(searchError || formError) && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-medium">{searchError || formError}</span>
          </div>
        </div>
      )}

      {/* Location Label Name */}
      <div>
        <label className="block font-semibold text-slate-900 mb-1 text-[11.5px]">
          1. {isHindi ? 'स्थान का नाम / लेबल' : 'Location Label Name'} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isHindi ? 'उदा. मेरा घर, कार्यालय, खेत प्लॉट 1' : 'e.g. My Home, Office, Farm Plot 1'}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-brand focus:outline-none focus:bg-white font-medium"
        />
      </div>

      {/* Automatically Detected / Editable Hierarchy Fields (2x3 Grid) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block font-semibold text-slate-900 text-[11.5px]">
            2. {isHindi ? 'स्थान पदानुक्रम (स्वतः पूर्ण और संपादन योग्य)' : 'Location Hierarchy (Auto-detected & Editable)'} <span className="text-rose-500">*</span>
          </label>
          <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
            <Edit3 className="w-3 h-3 text-slate-400" />
            {isHindi ? 'संपादन योग्य' : 'Editable fields'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
          {/* Area / Locality */}
          <div>
            <label className="block text-slate-600 text-[10.5px] font-medium mb-0.5">
              {isHindi ? 'क्षेत्र / मोहल्ला (Area / Locality)' : 'Area / Locality'}
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder={isHindi ? 'उदा. काके, सिविल लाइंस' : 'e.g. Kanke, Civil Lines, Sector 62'}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:outline-none"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-slate-600 text-[10.5px] font-medium mb-0.5">
              {isHindi ? 'शहर / नगर (City)' : 'City'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={isHindi ? 'उदा. रांची, गया, मुंबई' : 'e.g. Ranchi, Gaya, Mumbai'}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:outline-none font-medium"
            />
          </div>

          {/* District */}
          <div>
            <label className="block text-slate-600 text-[10.5px] font-medium mb-0.5">
              {isHindi ? 'जिला (District)' : 'District'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder={isHindi ? 'उदा. रांची, गया' : 'e.g. Ranchi, Gaya'}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:outline-none"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-slate-600 text-[10.5px] font-medium mb-0.5">
              {isHindi ? 'राज्य (State)' : 'State'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder={isHindi ? 'उदा. झारखंड, बिहार' : 'e.g. Jharkhand, Bihar, Maharashtra'}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:outline-none font-medium"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-slate-600 text-[10.5px] font-medium mb-0.5">
              {isHindi ? 'देश (Country)' : 'Country'}
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. India"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-brand focus:outline-none"
            />
          </div>

          {/* PIN / ZIP Code */}
          <div>
            <label className="block text-slate-600 text-[10.5px] font-medium mb-0.5">
              {isHindi ? 'पिन कोड (PIN Code)' : 'PIN / ZIP Code'}
            </label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder={isHindi ? 'उदा. 834008, 823001' : 'e.g. 834008, 823001'}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-brand focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* GPS Coordinates Badge (Latitude & Longitude) */}
      <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-200/80">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
            <Navigation className="w-3 h-3 text-brand" /> 
            {isHindi ? 'जीपीएस निर्देशांक (अक्षांश / देशांतर)' : 'GPS Coordinates'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {latitude && longitude ? `${latitude}°N, ${longitude}°E` : (isHindi ? 'अज्ञात' : 'Auto-Resolved')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <label className="block text-slate-500 text-[10px] mb-0.5">{isHindi ? 'अक्षांश (Latitude)' : 'Latitude'}</label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 24.7955"
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] mb-0.5">{isHindi ? 'देशांतर (Longitude)' : 'Longitude'}</label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 85.0002"
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-brand focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium rounded hover:bg-slate-100 transition-colors"
        >
          {isHindi ? 'रद्द करें' : 'Cancel'}
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-95"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isHindi ? 'स्थान सहेजें' : 'Save Location'}</span>
        </button>
      </div>
    </form>
  );
}
