import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { HeartStraightIcon } from 'phosphor-react-native/src/icons/HeartStraight';
import { HouseLineIcon } from 'phosphor-react-native/src/icons/HouseLine';
import { MapPinLineIcon } from 'phosphor-react-native/src/icons/MapPinLine';
import { NotePencilIcon } from 'phosphor-react-native/src/icons/NotePencil';
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { useTranslation } from 'react-i18next';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';

import { useConfirm } from '@/components/ConfirmDialog';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenHeader from '@/components/ScreenHeader';
import UserAvatar from '@/components/UserAvatar';
import { usePickAvatar } from '@/hooks/usePickAvatar';
import { useProvinces } from '@/hooks/useProvinces';
import { CATEGORY_EMOJI } from '@/services/mockData';
import { provinceName } from '@/services/places';
import { normalizeSearch } from '@/utils/format';
import { addCustomInterest, CUSTOM_INTERESTS_MAX } from '@/services/profile';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  forgetInterest,
  saveInterest,
  updateProfile,
} from '@/store/slices/authSlice';
import { useTheme } from '@/theme';
import type { ActivityCategory } from '@/types/activity';
import type { RootStackParamList } from '@/types/navigation';

import CustomActivitySheet from '@/screens/ImFree/CustomActivitySheet';
import type { CustomActivity } from '@/types/broadcast';

import CityPickerSheet from './CityPickerSheet';
import { AVATAR_SIZE, createStyles, type EditProfileStyles } from './styles';

const NAME_MAX_LENGTH = 40;
/** The icon before each card's title. */
const CARD_ICON = ms(18);
const BIO_MAX_LENGTH = 150;
/** Every category there is, in the app's usual order. */
const CATEGORIES = (
  Object.keys(CATEGORY_EMOJI) as (ActivityCategory | 'other')[]
).filter((id): id is ActivityCategory => id !== 'other');

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

/**
 * The user's photo, name, a few words about them, where they live and
 * where they're from, and what they like doing. Leaving with unsaved
 * changes asks first.
 */
export default function EditProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const pickAvatar = usePickAvatar();
  const user = useAppSelector(state => state.auth.user);

  const [avatarUri, setAvatarUri] = useState(user?.avatarUri);
  const [name, setName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [interests, setInterests] = useState(user?.interests ?? []);
  // Interests they've made, kept on the device: picked here or not.
  const savedInterests = useAppSelector(state => state.auth.savedInterests);
  const [pickedCustomIds, setPickedCustomIds] = useState<readonly string[]>(
    () => (user?.customInterests ?? []).map(item => item.id),
  );
  // Ones on the profile from before the device kept a list: kept now too.
  useEffect(() => {
    (user?.customInterests ?? [])
      .filter(item => !savedInterests.some(saved => saved.id === item.id))
      .forEach(item => dispatch(saveInterest(item)));
  }, [user?.customInterests, savedInterests, dispatch]);
  /** Making an interest of their own, in the sheet the free screen uses. */
  const [addingInterest, setAddingInterest] = useState(false);
  const [currentCity, setCurrentCity] = useState(user?.currentCity);
  const [hometown, setHometown] = useState(user?.hometown);
  /** Which place is being picked, if one is. */
  const { provinces } = useProvinces();
  const [picking, setPicking] = useState<PlaceField | null>(null);
  const [bioFocused, setBioFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardOpen(true),
    );
    const hidden = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardOpen(false),
    );
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);
  const [nameTouched, setNameTouched] = useState(false);
  const bioRef = useRef<TextInputInstance>(null);

  const trimmedName = name.trim();
  const trimmedBio = bio.trim();
  const changed =
    avatarUri !== user?.avatarUri ||
    trimmedName !== (user?.displayName ?? '') ||
    trimmedBio !== (user?.bio ?? '') ||
    interests.join() !== (user?.interests ?? []).join() ||
    [...pickedCustomIds].sort().join() !==
      (user?.customInterests ?? [])
        .map(item => item.id)
        .sort()
        .join() ||
    currentCity !== user?.currentCity ||
    hometown !== user?.hometown;
  // Only a name is needed; saving with nothing changed just goes back.
  const canSave = trimmedName.length > 0;
  /** Set on save, so leaving then doesn't ask about discarding. */
  const saved = useRef(false);

  // Back, a swipe or the hardware button: unsaved changes are asked about.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', event => {
        if (!changed || saved.current) {
          return;
        }
        event.preventDefault();
        confirm({
          icon: 'create-outline',
          title: t('profile.edit.discardTitle'),
          message: t('profile.edit.discardMessage'),
          confirmLabel: t('profile.edit.discard'),
          cancelLabel: t('profile.edit.keepEditing'),
          onConfirm: () => navigation.dispatch(event.data.action),
        });
      }),
    [navigation, changed, confirm, t],
  );

  const toggleInterest = (category: ActivityCategory) =>
    setInterests(current =>
      current.includes(category)
        ? current.filter(item => item !== category)
        : [...current, category],
    );

  // An interest of their own: added unless it's already there.
  const categoryNames = CATEGORIES.map(category =>
    t(`imFree.activities.${category}`),
  );
  const addInterest = (interest: CustomActivity) => {
    const next = addCustomInterest(savedInterests, interest, categoryNames);
    const added = next.length > savedInterests.length && next[next.length - 1];
    // A name they've made before picks that one rather than a twin.
    const same =
      added ||
      savedInterests.find(
        item => normalizeSearch(item.name) === normalizeSearch(interest.name),
      );
    if (added) {
      dispatch(saveInterest(added));
    }
    if (same) {
      setPickedCustomIds(current =>
        current.includes(same.id) ? current : [...current, same.id],
      );
    }
    setAddingInterest(false);
  };
  const toggleCustom = (id: string) =>
    setPickedCustomIds(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    );
  // A long press removes one from the device for good, once confirmed.
  const askForget = (interest: CustomActivity) =>
    confirm({
      icon: 'trash-outline',
      title: t('profile.edit.forgetInterestTitle'),
      message: t('profile.edit.forgetInterestMessage', {
        interest: interest.name,
      }),
      confirmLabel: t('profile.edit.forgetInterest'),
      onConfirm: () => {
        dispatch(forgetInterest(interest.id));
        setPickedCustomIds(current =>
          current.filter(item => item !== interest.id),
        );
      },
    });
  const pickedCount = interests.length + pickedCustomIds.length;

  const changePhoto = async () => {
    const uri = await pickAvatar();
    if (uri) {
      setAvatarUri(uri);
    }
  };

  const save = () => {
    if (!canSave) {
      return;
    }
    if (!changed) {
      navigation.goBack();
      return;
    }
    dispatch(
      updateProfile({
        displayName: trimmedName,
        bio: trimmedBio || undefined,
        avatarUri,
        interests,
        customInterests: savedInterests.filter(item =>
          pickedCustomIds.includes(item.id),
        ),
        currentCity,
        hometown,
      }),
    );
    saved.current = true;
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title={t('profile.edit.title')}
        onBack={navigation.goBack}
      />
      {/* The keyboard covers the save button rather than pushing it up;
          the fields scroll clear of it instead. */}
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* The photo, big and centred, a tap away from changing. */}
          <View style={styles.photoBlock}>
            <Pressable
              onPress={changePhoto}
              style={({ pressed }) => pressed && styles.pressed}
              accessibilityRole="button"
              accessibilityLabel={t('profile.changePhoto')}
            >
              <UserAvatar
                size={AVATAR_SIZE}
                name={trimmedName || user?.displayName || ''}
                uri={avatarUri}
              />
              <View style={styles.cameraBadge}>
                <CameraIcon size={ms(15)} color={colors.white} weight="fill" />
              </View>
            </Pressable>
            <Pressable onPress={changePhoto} hitSlop={6}>
              <Text style={styles.photoAction}>
                {t('profile.edit.changePhoto')}
              </Text>
            </Pressable>
          </View>

          <Card
            Glyph={UserIcon}
            title={t('profile.edit.name')}
            right={
              <Text style={styles.hint}>
                {`${name.length}/${NAME_MAX_LENGTH}`}
              </Text>
            }
            styles={styles}
          >
            <TextInput
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => {
                setNameFocused(false);
                setNameTouched(true);
              }}
              placeholder={t('profile.edit.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              maxLength={NAME_MAX_LENGTH}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => bioRef.current?.focus()}
              submitBehavior="submit"
              style={[
                styles.input,
                styles.inputLine,
                nameFocused && styles.inputFocused,
                nameTouched && !trimmedName && styles.inputError,
              ]}
              accessibilityLabel={t('profile.edit.name')}
            />
            {nameTouched && !trimmedName ? (
              <Text style={styles.error}>{t('profile.edit.nameRequired')}</Text>
            ) : null}
          </Card>

          <Card
            Glyph={NotePencilIcon}
            title={t('profile.edit.bio')}
            right={<Text style={styles.hint}>{t('imFree.optional')}</Text>}
            styles={styles}
          >
            <TextInput
              ref={bioRef}
              value={bio}
              onChangeText={setBio}
              onFocus={() => setBioFocused(true)}
              onBlur={() => setBioFocused(false)}
              placeholder={t('profile.edit.bioPlaceholder')}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              maxLength={BIO_MAX_LENGTH}
              multiline
              textAlignVertical="top"
              style={[
                styles.input,
                styles.bioInput,
                bioFocused && styles.inputFocused,
              ]}
              accessibilityLabel={t('profile.edit.bio')}
            />
            <Text style={[styles.hint, styles.counterBelow]}>
              {`${bio.length}/${BIO_MAX_LENGTH}`}
            </Text>
          </Card>

          <Card
            Glyph={MapPinLineIcon}
            title={t('profile.places.title')}
            right={<Text style={styles.hint}>{t('imFree.optional')}</Text>}
            styles={styles}
          >
            <View>
              <PlaceRow
                Glyph={HouseLineIcon}
                label={t('profile.places.currentCity')}
                value={provinceName(currentCity, provinces)}
                placeholder={t('profile.places.addCurrentCity')}
                onPress={() => setPicking('currentCity')}
                styles={styles}
              />
              <PlaceRow
                Glyph={MapPinIcon}
                label={t('profile.places.hometown')}
                value={provinceName(hometown, provinces)}
                placeholder={t('profile.places.addHometown')}
                onPress={() => setPicking('hometown')}
                divided
                styles={styles}
              />
            </View>
          </Card>

          <Card
            Glyph={HeartStraightIcon}
            title={t('profile.edit.interests')}
            right={
              pickedCount ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{pickedCount}</Text>
                </View>
              ) : undefined
            }
            styles={styles}
          >
            <Text style={[styles.hint, styles.cardLead]}>
              {t('profile.edit.interestsHint')}
            </Text>
            <View style={styles.chips}>
              {CATEGORIES.map(category => {
                const on = interests.includes(category);
                return (
                  <Pressable
                    key={category}
                    onPress={() => toggleInterest(category)}
                    style={({ pressed }) => [
                      styles.chip,
                      on && styles.chipOn,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                  >
                    <Text style={styles.chipEmoji}>
                      {CATEGORY_EMOJI[category]}
                    </Text>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                      {t(`imFree.activities.${category}`)}
                    </Text>
                  </Pressable>
                );
              })}
              {/* Their own, kept on the device: tapped on and off like
                  the others; a long press removes one for good. */}
              {savedInterests.map(interest => {
                const on = pickedCustomIds.includes(interest.id);
                return (
                  <Pressable
                    key={interest.id}
                    onPress={() => toggleCustom(interest.id)}
                    onLongPress={() => askForget(interest)}
                    style={({ pressed }) => [
                      styles.chip,
                      on && styles.chipOn,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityHint={t('profile.edit.forgetInterestHint')}
                  >
                    {interest.image ? (
                      <Image
                        source={{ uri: interest.image }}
                        style={styles.chipPhoto}
                      />
                    ) : (
                      <Text style={styles.chipEmoji}>{interest.emoji}</Text>
                    )}
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                      {interest.name}
                    </Text>
                  </Pressable>
                );
              })}
              {savedInterests.length < CUSTOM_INTERESTS_MAX ? (
                <Pressable
                  onPress={() => setAddingInterest(true)}
                  style={({ pressed }) => [
                    styles.chip,
                    styles.chipAdd,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                >
                  <PlusIcon
                    size={ms(12)}
                    color={colors.primary}
                    weight="bold"
                  />
                  <Text style={styles.chipAddText}>
                    {t('profile.edit.otherInterest')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </Card>
        </ScrollView>

        {/* Android shrinks the screen for the keyboard: out of the way then. */}
        {keyboardOpen && Platform.OS === 'android' ? null : (
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, ms(12)) },
            ]}
          >
            <PrimaryButton
              title={t('common.save')}
              onPress={save}
              disabled={!canSave}
              style={styles.saveButton}
            />
          </View>
        )}
      </View>

      <CustomActivitySheet
        visible={addingInterest}
        onClose={() => setAddingInterest(false)}
        onSave={addInterest}
        labels={{
          title: t('profile.edit.newInterestTitle'),
          nameLabel: t('profile.edit.newInterestName'),
          placeholder: t('profile.edit.otherInterestPlaceholder'),
          save: t('profile.edit.newInterestSave'),
        }}
      />
      <CityPickerSheet
        visible={picking !== null}
        title={
          picking === 'hometown'
            ? t('profile.places.hometown')
            : t('profile.places.currentCity')
        }
        value={picking === 'hometown' ? hometown : currentCity}
        onClose={() => setPicking(null)}
        onPick={id => {
          if (picking === 'hometown') {
            setHometown(id);
          } else {
            setCurrentCity(id);
          }
          setPicking(null);
        }}
      />
    </SafeAreaView>
  );
}

type PlaceField = 'hometown' | 'currentCity';

/**
 * A white card of its own for each thing, headed by an outline icon and a
 * title with something on the right, like the free screen's.
 */
function Card({
  Glyph,
  title,
  right,
  styles,
  children,
}: {
  /** From one set, at one size, so the four headers match. */
  Glyph: PhosphorIcon;
  title: string;
  right?: ReactNode;
  styles: EditProfileStyles;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Glyph size={CARD_ICON} color={colors.textSecondary} />
          <Text style={styles.cardTitle} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

/** Where they live, or where they're from: the city picked, or a nudge to pick one. */
function PlaceRow({
  Glyph,
  label,
  value,
  placeholder,
  onPress,
  divided,
  styles,
}: {
  Glyph: PhosphorIcon;
  label: string;
  value?: string;
  placeholder: string;
  onPress: () => void;
  divided?: boolean;
  styles: EditProfileStyles;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.placeRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
    >
      <View style={styles.placeIcon}>
        <Glyph size={ms(18)} color={colors.primary} weight="fill" />
      </View>
      <View style={[styles.placeBody, divided && styles.placeDivided]}>
        <View style={styles.placeText}>
          <Text style={styles.placeLabel}>{label}</Text>
          <Text
            style={[styles.placeValue, !value && styles.placeEmpty]}
            numberOfLines={1}
          >
            {value ?? placeholder}
          </Text>
        </View>
        <CaretRightIcon size={ms(16)} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}
