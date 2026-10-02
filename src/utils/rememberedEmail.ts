import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBERED_EMAIL_KEY = '@dotogether/remembered_email';

export async function getRememberedEmail(): Promise<string | null> {
  return AsyncStorage.getItem(REMEMBERED_EMAIL_KEY);
}

export async function setRememberedEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
}

export async function clearRememberedEmail(): Promise<void> {
  await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
}
