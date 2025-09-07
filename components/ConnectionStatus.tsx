import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { isFirebaseAvailable } from '../services/firebase';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      // Hide alert after 5 seconds
      setTimeout(() => setShowOfflineAlert(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial Firebase connection status
    if (!isFirebaseAvailable) {
      setShowOfflineAlert(true);
      setTimeout(() => setShowOfflineAlert(false), 5000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getConnectionStatus = () => {
    if (!isOnline) {
      return { status: 'offline', color: 'destructive', icon: WifiOff, text: 'Offline' };
    } else if (!isFirebaseAvailable) {
      return { status: 'limited', color: 'secondary', icon: CloudOff, text: 'Limited' };
    } else {
      return { status: 'online', color: 'default', icon: Cloud, text: 'Online' };
    }
  };

  const { status, color, icon: Icon, text } = getConnectionStatus();

  return (
    <>
      <Badge variant={color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>

      {showOfflineAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <Alert variant={status === 'offline' ? 'destructive' : 'default'}>
            <Icon className="h-4 w-4" />
            <AlertDescription>
              {status === 'offline' 
                ? 'You are offline. Changes will be saved locally and synced when connection is restored.'
                : 'Running in offline mode. Data is stored locally and may not sync with other users.'
              }
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}