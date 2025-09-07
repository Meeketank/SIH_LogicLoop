// Notification service for handling browser notifications
export interface NotificationResult {
  granted: boolean;
  error?: string;
}

// Check if notifications are supported
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

// Get current notification permission status
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

// Request notification permission from user
export const requestNotificationPermission = async (): Promise<NotificationResult> => {
  if (!isNotificationSupported()) {
    return {
      granted: false,
      error: 'Notifications are not supported in this browser'
    };
  }

  // If already granted, return true
  if (Notification.permission === 'granted') {
    return { granted: true };
  }

  // If denied, we can't request again
  if (Notification.permission === 'denied') {
    return {
      granted: false,
      error: 'Notification permission was previously denied. Please enable notifications in your browser settings.'
    };
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      return { granted: true };
    } else if (permission === 'denied') {
      return {
        granted: false,
        error: 'Notification permission denied. You can enable notifications in your browser settings to receive updates.'
      };
    } else {
      return {
        granted: false,
        error: 'Notification permission not granted. Please enable notifications to receive updates.'
      };
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return {
      granted: false,
      error: 'Failed to request notification permission'
    };
  }
};

// Show a notification
export const showNotification = (title: string, options?: {
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
}): boolean => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body: options?.body || '',
      icon: options?.icon || '/favicon.ico',
      tag: options?.tag || 'vikasit-jharkhand',
      requireInteraction: options?.requireInteraction || false,
      data: options?.data,
      ...options
    });

    // Auto close after 5 seconds unless requireInteraction is true
    if (!options?.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// Show notification for issue status updates
export const showIssueUpdateNotification = (issueTitle: string, newStatus: string): boolean => {
  const statusMessages = {
    'acknowledged': 'Your report has been acknowledged',
    'in-progress': 'Work has started on your report', 
    'resolved': 'Your report has been resolved'
  };

  const message = statusMessages[newStatus as keyof typeof statusMessages] || 'Your report status has been updated';

  return showNotification('Vikasit Jharkhand - Issue Update', {
    body: `${message}: ${issueTitle}`,
    icon: '/favicon.ico',
    tag: `issue-update-${newStatus}`,
    requireInteraction: false,
    data: {
      type: 'issue-update',
      status: newStatus,
      title: issueTitle
    }
  });
};

// Store notification preference in localStorage
export const setNotificationPreference = (enabled: boolean): void => {
  localStorage.setItem('vikasit_jharkhand_notifications', JSON.stringify(enabled));
};

// Get notification preference from localStorage
export const getNotificationPreference = (): boolean => {
  try {
    const stored = localStorage.getItem('vikasit_jharkhand_notifications');
    return stored ? JSON.parse(stored) : false;
  } catch {
    return false;
  }
};