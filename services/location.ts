// Location service for geolocation handling
export interface LocationResult {
  address: string;
  lat: number;
  lng: number;
  error?: string;
}

// Check if geolocation is supported
export const isGeolocationSupported = (): boolean => {
  return 'geolocation' in navigator;
};

// Request location permission
export const requestLocationPermission = async (): Promise<PermissionState> => {
  if ('permissions' in navigator) {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      console.error('Permission query failed:', error);
      return 'prompt';
    }
  }
  return 'prompt';
};

// Get user's current location with proper error handling
export const getUserLocation = (options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}): Promise<LocationResult> => {
  return new Promise((resolve) => {
    if (!isGeolocationSupported()) {
      resolve({ 
        address: "Geolocation not supported", 
        lat: 0, 
        lng: 0,
        error: "Geolocation is not supported by this browser" 
      });
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Reverse geocode to get address (mock implementation)
        const address = getLocationName(latitude, longitude);
        
        resolve({
          address,
          lat: latitude,
          lng: longitude,
        });
      },
      (error) => {
        let errorMessage = "Unknown location error";
        let fallbackAddress = "Location unavailable";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied by user";
            fallbackAddress = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            fallbackAddress = "Location unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            fallbackAddress = "Location timeout";
            break;
        }

        resolve({
          address: fallbackAddress,
          lat: 0,
          lng: 0,
          error: errorMessage,
        });
      },
      defaultOptions
    );
  });
};

// Mock reverse geocoding for Jharkhand locations
const getLocationName = (lat: number, lng: number): string => {
  // Define approximate boundaries for major Jharkhand cities
  const cities = [
    { name: "Ranchi", lat: 23.3441, lng: 85.3096, radius: 0.5 },
    { name: "Dhanbad", lat: 23.7957, lng: 86.4304, radius: 0.3 },
    { name: "Jamshedpur", lat: 22.8046, lng: 86.2029, radius: 0.4 },
    { name: "Bokaro", lat: 23.6693, lng: 85.9512, radius: 0.2 },
    { name: "Deoghar", lat: 24.4823, lng: 86.7042, radius: 0.2 },
  ];

  // Find nearest city
  for (const city of cities) {
    const distance = Math.sqrt(
      Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
    );
    if (distance <= city.radius) {
      return `Near ${city.name}, Jharkhand`;
    }
  }

  // Default to coordinates if no city match
  return `${lat.toFixed(6)}, ${lng.toFixed(6)} (Jharkhand)`;
};

// Watch location changes (for future use)
export const watchUserLocation = (
  callback: (result: LocationResult) => void,
  options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }
): number | null => {
  if (!isGeolocationSupported()) {
    callback({
      address: "Geolocation not supported",
      lat: 0,
      lng: 0,
      error: "Geolocation is not supported by this browser"
    });
    return null;
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000,
    ...options
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      callback({
        address: getLocationName(latitude, longitude),
        lat: latitude,
        lng: longitude,
      });
    },
    (error) => {
      let errorMessage = "Location watch error";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission denied";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location unavailable";
          break;
        case error.TIMEOUT:
          errorMessage = "Location timeout";
          break;
      }
      callback({
        address: "Location unavailable",
        lat: 0,
        lng: 0,
        error: errorMessage,
      });
    },
    defaultOptions
  );
};

// Stop watching location
export const stopWatchingLocation = (watchId: number): void => {
  if (watchId && isGeolocationSupported()) {
    navigator.geolocation.clearWatch(watchId);
  }
};