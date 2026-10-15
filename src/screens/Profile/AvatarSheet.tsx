import { useTranslation } from 'react-i18next';
import { ms } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/Ionicons';

import { useTheme } from '@/theme';

import OptionSheet, { type SheetOption } from './OptionSheet';
import type { ProfileStyles } from './styles';

export type AvatarAction = 'story' | 'photo' | 'change';

interface Props {
  visible: boolean;
  /** Their stories still up: watching them comes first. */
  hasStory: boolean;
  /** Has a photo of their own to look at. */
  hasPhoto: boolean;
  /** The user's own photo: changing it is offered too. */
  canChange?: boolean;
  styles: ProfileStyles;
  onClose: () => void;
  /** Once the sheet's gone, so what it opens doesn't meet it on the way out. */
  onAction: (action: AvatarAction) => void;
}

/**
 * Tapping a profile photo: watch the story, look at the photo, and on the
 * user's own, change it.
 */
export default function AvatarSheet({
  visible,
  hasStory,
  hasPhoto,
  canChange = true,
  styles,
  onClose,
  onAction,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const icon = (name: string) => (
    <Icon name={name} size={ms(22)} color={colors.text} />
  );

  const options: SheetOption<AvatarAction>[] = [
    ...(hasStory
      ? [
          {
            id: 'story' as const,
            icon: icon('play-circle-outline'),
            label: t('profile.avatar.viewStory'),
          },
        ]
      : []),
    ...(hasPhoto
      ? [
          {
            id: 'photo' as const,
            icon: icon('person-circle-outline'),
            label: t('profile.avatar.viewPhoto'),
          },
        ]
      : []),
    ...(canChange
      ? [
          {
            id: 'change' as const,
            icon: icon('camera-outline'),
            label: t('profile.avatar.changePhoto'),
          },
        ]
      : []),
  ];

  return (
    <OptionSheet
      visible={visible}
      options={options}
      styles={styles}
      onClose={onClose}
      onPick={onAction}
    />
  );
}
