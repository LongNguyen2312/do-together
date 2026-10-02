import { useTranslation } from 'react-i18next';

import TabPlaceholder from '@/components/TabPlaceholder';

export default function DiscoverScreen() {
  const { t } = useTranslation();

  return (
    <TabPlaceholder
      icon="sparkles-outline"
      title={t('tabs.discover')}
      message={t('auth.comingSoonMessage')}
    />
  );
}
