import { create } from 'zustand';

interface SettingsState {
  notificationHour: number;
  notificationMinute: number;
  restTimerLong: number;   // seconds, for 5-rep sets
  restTimerShort: number;  // seconds, for 8-rep sets
  barWeight: number;

  setNotificationTime: (hour: number, minute: number) => void;
  setRestTimers: (long: number, short: number) => void;
  setBarWeight: (weight: number) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  notificationHour: 8,
  notificationMinute: 0,
  restTimerLong: 210,   // 3.5 minutes
  restTimerShort: 210,  // 3.5 minutes
  barWeight: 20,

  setNotificationTime: (hour, minute) => set({ notificationHour: hour, notificationMinute: minute }),
  setRestTimers: (long, short) => set({ restTimerLong: long, restTimerShort: short }),
  setBarWeight: (weight) => set({ barWeight: weight }),
}));
