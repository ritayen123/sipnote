"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { barService, type GooglePlaceResult } from "../../lib/services/bar-service";
import { SearchIcon, MapPinIcon } from "./Icons";

interface BarSearchProps {
  value: string;
  onChange: (name: string, googlePlaceId?: string) => void;
}

export default function BarSearch({ value, onChange }: BarSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GooglePlaceResult[]>([]);
  const [localResults, setLocalResults] = useState<{ id: string; name: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLocalResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);

    // Search local bars first
    const local = await barService.search(q);
    setLocalResults(local.map((b) => ({ id: b.id, name: b.name })));

    // Then search Google Places
    const google = await barService.searchGooglePlaces(q);
    setResults(google);

    setShowDropdown(true);
    setSearching(false);
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(val), 400);
  };

  const handleSelectGoogle = (place: GooglePlaceResult) => {
    setQuery(place.name);
    onChange(place.name, place.placeId);
    setShowDropdown(false);
  };

  const handleSelectLocal = (name: string) => {
    setQuery(name);
    onChange(name);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm text-text-secondary block mb-2">酒吧名稱（選填）</label>
      <div className="relative">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="搜尋或輸入酒吧名稱"
          className="w-full pl-9 pr-4 py-3 bg-bg-input border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && (localResults.length > 0 || results.length > 0) && (
        <div className="absolute z-30 w-full mt-1 bg-bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {/* Local results */}
          {localResults.length > 0 && (
            <div>
              <p className="text-xs text-text-muted px-3 pt-2 pb-1">最近去過</p>
              {localResults.map((bar) => (
                <button
                  key={bar.id}
                  type="button"
                  onClick={() => handleSelectLocal(bar.name)}
                  className="w-full text-left px-3 py-2.5 hover:bg-bg-input transition-colors flex items-center gap-2"
                >
                  <MapPinIcon size={14} className="text-accent shrink-0" />
                  <span className="text-sm truncate">{bar.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Google Places results */}
          {results.length > 0 && (
            <div>
              {localResults.length > 0 && <div className="border-t border-border" />}
              <p className="text-xs text-text-muted px-3 pt-2 pb-1">Google 搜尋</p>
              {results.map((place) => (
                <button
                  key={place.placeId}
                  type="button"
                  onClick={() => handleSelectGoogle(place)}
                  className="w-full text-left px-3 py-2.5 hover:bg-bg-input transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MapPinIcon size={14} className="text-text-muted shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{place.name}</p>
                      <p className="text-xs text-text-muted truncate">{place.address}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
