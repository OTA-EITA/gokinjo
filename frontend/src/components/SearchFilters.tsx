import React from 'react';
import type { FilterState, School } from '../types';
import { LABELS } from '../constants';
import { getSchoolTypeLabel } from '../utils/helpers';

interface SearchFiltersProps {
  filterState: FilterState;
  showFilters: boolean;
  filteredSchools: number;
  filteredCrimes: number;
  searchSuggestions: string[];
  showSuggestions: boolean;
  selectedSuggestionIndex: number;
  availableCrimeCategories: string[];
  onToggleFilters: () => void;
  onSearchChange: (searchTerm: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onSchoolTypeToggle: (type: School['type']) => void;
  onCrimeCategoryToggle: (category: string) => void;
  onSafetyScoreRangeChange: (range: [number, number]) => void;
  onPublicPrivateToggle: (type: 'public' | 'private') => void;
  onClearFilters: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filterState,
  showFilters,
  filteredSchools,
  filteredCrimes,
  searchSuggestions,
  showSuggestions,
  selectedSuggestionIndex,
  availableCrimeCategories,
  onToggleFilters,
  onSearchChange,
  onSearchKeyDown,
  onSearchFocus,
  onSearchBlur,
  onSuggestionClick,
  onSchoolTypeToggle,
  onCrimeCategoryToggle,
  onSafetyScoreRangeChange,
  onPublicPrivateToggle,
  onClearFilters
}) => {
  const highlightSearchTerm = (text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === searchTerm.toLowerCase()) {
        return <mark key={index} className="highlight">{part}</mark>;
      }
      return part;
    });
  };

  return (
    <div className="search-filters">
      <div className="filter-header" onClick={onToggleFilters}>
        <h3 style={{margin: 0, color: '#333', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          {LABELS.UI.SEARCH_FILTERS}
          <span className={`filter-toggle ${showFilters ? 'open' : ''}`}>▼</span>
        </h3>
        <div className="filter-summary" style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
          {`学校${filteredSchools}件 | 犯罪${filteredCrimes}件`}
          {filterState.searchTerm && ` | 検索: "${filterState.searchTerm}"`}
          {(filterState.selectedSchoolTypes.length > 0 || filterState.selectedCrimeCategories.length > 0 || 
            filterState.showPublicOnly || filterState.showPrivateOnly || 
            filterState.safetyScoreRange[0] > 0 || filterState.safetyScoreRange[1] < 100) && 
            <span style={{color: '#1890ff', fontWeight: 'bold'}}> (フィルタ適用中)</span>
          }
        </div>
      </div>
      
      {showFilters && (
        <div className="filter-content" style={{marginTop: '12px'}}>
          <div className="search-box">
            <div className="search-input-container">
              <input
                type="text"
                placeholder={LABELS.UI.SEARCH_PLACEHOLDER}
                value={filterState.searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={onSearchKeyDown}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                className="search-input"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="search-suggestions">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`search-suggestion-item ${
                        index === selectedSuggestionIndex ? 'selected' : ''
                      }`}
                      onClick={() => onSuggestionClick(suggestion)}
                    >
                      <span className="suggestion-text">
                        {highlightSearchTerm(suggestion, filterState.searchTerm)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-group-label">{LABELS.UI.SCHOOL_TYPE_FILTER}</label>
            <div className="filter-checkboxes">
              {(['elementary', 'junior_high', 'high'] as School['type'][]).map(type =>
                <label key={type} className="checkbox-label small">
                  <input
                    type="checkbox"
                    checked={filterState.selectedSchoolTypes.includes(type)}
                    onChange={() => onSchoolTypeToggle(type)}
                  />
                  {` ${getSchoolTypeLabel(type)}`}
                </label>
              )}
            </div>
          </div>
          
          {availableCrimeCategories.length > 0 && (
            <div className="filter-group">
              <label className="filter-group-label">{LABELS.UI.CRIME_TYPE_FILTER}</label>
              <div className="filter-checkboxes">
                {availableCrimeCategories.map(category =>
                  <label key={category} className="checkbox-label small">
                    <input
                      type="checkbox"
                      checked={filterState.selectedCrimeCategories.includes(category)}
                      onChange={() => onCrimeCategoryToggle(category)}
                    />
                    {` ${category}`}
                  </label>
                )}
              </div>
            </div>
          )}
          
          <div className="filter-group">
            <label className="filter-group-label">{LABELS.UI.PUBLIC_PRIVATE_FILTER}</label>
            <div className="filter-checkboxes">
              <label className="checkbox-label small">
                <input
                  type="checkbox"
                  checked={filterState.showPublicOnly}
                  onChange={() => onPublicPrivateToggle('public')}
                />
                {` 公立のみ`}
              </label>
              <label className="checkbox-label small">
                <input
                  type="checkbox"
                  checked={filterState.showPrivateOnly}
                  onChange={() => onPublicPrivateToggle('private')}
                />
                {` 私立のみ`}
              </label>
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-group-label">
              {`${LABELS.UI.SAFETY_SCORE_FILTER}: ${filterState.safetyScoreRange[0]} - ${filterState.safetyScoreRange[1]}`}
            </label>
            <div className="range-sliders">
              <input
                type="range"
                min={0}
                max={100}
                value={filterState.safetyScoreRange[0]}
                onChange={(e) => onSafetyScoreRangeChange([
                  parseInt(e.target.value), 
                  filterState.safetyScoreRange[1]
                ])}
                className="range-slider"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={filterState.safetyScoreRange[1]}
                onChange={(e) => onSafetyScoreRangeChange([
                  filterState.safetyScoreRange[0],
                  parseInt(e.target.value)
                ])}
                className="range-slider"
              />
            </div>
          </div>
          
          <button onClick={onClearFilters} className="clear-filters-btn">
            {LABELS.UI.CLEAR_FILTERS}
          </button>
        </div>
      )}
    </div>
  );
};
