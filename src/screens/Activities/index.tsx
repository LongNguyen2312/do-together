import { useTranslation } from 'react-i18next';

import TabPlaceholder from '@/components/TabPlaceholder';

export default function ActivitiesScreen() {
  const { t } = useTranslation();

  return (
    <TabPlaceholder
      icon="calendar-outline"
      title={t('tabs.activities')}
      message={t('auth.comingSoonMessage')}
    />
  );
}
