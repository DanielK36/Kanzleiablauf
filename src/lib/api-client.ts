import { useAuth } from '@clerk/nextjs';

// Helper function to get JWT token for API calls
export function useApiCall() {
  const { getToken } = useAuth();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const token = await getToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  };

  return { apiCall };
}
