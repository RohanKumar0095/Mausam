/**
 * Push Notification Service for MAUSAM
 * Manages Web Notifications API permissions and notification dispatches.
 */

export const pushNotificationService = {
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission() {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission() {
    if (!this.isSupported()) return 'denied';
    try {
      const result = await Notification.requestPermission();
      return result;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  },

  sendNotification({ title, body, alertId = null, icon = '/favicon.ico' }) {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      console.log('[Simulated Push Notification]', { title, body, alertId });
      return null;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        data: { alertId, deepLink: `/alerts/${alertId}` }
      });

      notification.onclick = function() {
        window.focus();
        if (alertId) {
          window.dispatchEvent(new CustomEvent('mausam:open_alert', { detail: { alertId } }));
        }
        notification.close();
      };

      return notification;
    } catch (e) {
      console.warn('Failed to dispatch notification:', e);
      return null;
    }
  }
};
