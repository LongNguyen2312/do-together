import { Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';

import { compressPhotoToDataUri } from '@/services/media';

/** Long edge of a profile photo: shown at most a few dozen points across. */
const AVATAR_MAX_SIZE = 512;

/**
 * Picks a profile photo from the library, as a small JPEG `data:` uri to
 * keep in the store; null if nothing was picked.
 */
export function usePickAvatar() {
  const { t } = useTranslation();
  return async (): Promise<string | null> => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });
    if (result.errorCode) {
      Alert.alert(t('profile.photoError'));
      return null;
    }
    const uri = result.assets?.[0]?.uri;
    if (!uri) {
      return null;
    }
    try {
      return await compressPhotoToDataUri(uri, AVATAR_MAX_SIZE);
    } catch {
      Alert.alert(t('profile.photoError'));
      return null;
    }
  };
}
