import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export class HapticsService {
  /**
   * Triggers a light selection feedback (e.g. on dialing a wheel or clicking selector).
   */
  static async selection() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Graceful fallback for non-supported environments
    }
  }

  /**
   * Triggers success feedback (e.g. when all strings are perfectly tuned).
   */
  static async notificationSuccess() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Triggers a soft impact tap — used for individual string completion confirmation.
   * Lighter than impactLight(), approximately 10–20 ms perceived duration.
   */
  static async impactSoft() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Triggers a light impact tap.
   */
  static async impactLight() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Graceful fallback
    }
  }
}
