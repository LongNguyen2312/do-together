import { useAppSelector } from '@/store/hooks';

/**
 * The provinces and cities to pick from, as loaded when the app started
 * (see placesSlice); `loading` while the API hasn't answered yet.
 */
export function useProvinces() {
  const provinces = useAppSelector(state => state.places.provinces);
  const loading = useAppSelector(
    state =>
      state.places.status === 'loading' || state.places.status === 'idle',
  );
  return { provinces, loading };
}
