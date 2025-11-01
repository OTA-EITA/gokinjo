import { useState, useCallback } from 'react';
import type { Area, School, Crime, SafetyScore } from '../types';
import { API_CONFIG } from '../constants';
import { buildApiUrl, safeFetch } from '../utils/helpers';

interface UseDataFetchReturn {
  areas: Area[];
  schools: School[];
  crimes: Crime[];
  safetyScores: SafetyScore[];
  loading: boolean;
  loadAreas: () => Promise<void>;
  loadAreaData: (wardCode: string, townCode: string) => Promise<void>;
  checkApiHealth: () => Promise<void>;
}

export const useDataFetch = (): UseDataFetchReturn => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [safetyScores, setSafetyScores] = useState<SafetyScore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const checkApiHealth = useCallback(async (): Promise<void> => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`;
      console.log('Checking API health:', url);
      const response = await fetch(url);
      if (response.ok) {
        console.log('API is healthy');
      } else {
        console.error(`API health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('API is not reachable:', error);
      console.error('Make sure backend is running: make start');
    }
  }, []);

  const loadAreas = useCallback(async (): Promise<void> => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AREAS}`;
      console.log('Loading areas from:', url);
      const data = await safeFetch(url);
      
      console.log('Areas response:', data);
      
      if (data) {
        const areasData = data.areas || [];
        console.log(`Loaded ${areasData.length} areas:`, areasData);
        setAreas(areasData);
      } else {
        console.error('No data received from API');
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load areas:', error);
      setLoading(false);
    }
  }, []);

  const loadAreaData = useCallback(async (wardCode: string, townCode: string): Promise<void> => {
    try {
      setLoading(true);

      const schoolsUrl = `${API_CONFIG.BASE_URL}${buildApiUrl(API_CONFIG.ENDPOINTS.SCHOOLS, { ward_code: wardCode, town_code: townCode })}`;
      const schoolsData = await safeFetch(schoolsUrl);
      if (schoolsData) {
        setSchools(schoolsData.schools || []);
      }

      const crimesUrl = `${API_CONFIG.BASE_URL}${buildApiUrl(API_CONFIG.ENDPOINTS.CRIMES, { ward_code: wardCode, town_code: townCode })}`;
      const crimesData = await safeFetch(crimesUrl);
      if (crimesData) {
        setCrimes(crimesData.crimes || []);
      }

      const safetyUrl = `${API_CONFIG.BASE_URL}${buildApiUrl(API_CONFIG.ENDPOINTS.SAFETY_SCORES, { ward_code: wardCode, town_code: townCode })}`;
      const safetyData = await safeFetch(safetyUrl);
      if (safetyData) {
        setSafetyScores(safetyData.safety_scores || []);
      }

      setLoading(false);
      
    } catch (error) {
      console.error('Failed to load area data:', error);
      setLoading(false);
    }
  }, []);

  return {
    areas,
    schools,
    crimes,
    safetyScores,
    loading,
    loadAreas,
    loadAreaData,
    checkApiHealth
  };
};
