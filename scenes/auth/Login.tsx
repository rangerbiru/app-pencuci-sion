import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useTheme from '@/hooks/useTheme';
import { duration, easing, images, lightColors, radius, sizes, space } from '@/theme';
import { useKeyboard } from '@/hooks/useKeyboard';
import { checkMeta, signIn } from '@/services/session';
import { useAppSlice } from '@/slices';
import Text from '@/components/elements/Text';
import TextField from '@/components/elements/TextField';
import Button from '@/components/elements/Button';
import Image from '@/components/elements/Image';
import Icon from '@/components/elements/Icon';
import ContactAdmin from '@/components/elements/ContactAdmin';
import OfflineBanner from '@/components/layouts/OfflineBanner';
import { FadeInItem } from '@/components/elements/Motion';
import type { Dispatch } from '@/utils/store';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Isi email atau nomor HP.'),
  password: z.string().min(1, 'Isi password.'),
});

type FormValues = z.infer<typeof schema>;

/** Pesan awal WhatsApp lupa password, memuat email/no HP yang sudah diketik. */
export function forgotPasswordMessage(identifier: string) {
  const who = identifier.trim();
  return `Halo Admin, saya ${who ? `${who} ` : ''}lupa password aplikasi SION.`;
}

/** Logo muncul sekali saat layar dibuka: fade + membesar dari 0,94 (260 ms); diam bila Kurangi gerak. */
function LogoEntrance({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (!reduce) t.set(withTiming(1, { duration: duration.enter + 40, easing: easing.out }));
    // hanya sekali saat dipasang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const anim = useAnimatedStyle(() => ({
    opacity: t.get(),
    transform: [{ scale: 0.94 + t.get() * 0.06 }],
  }));
  return <Animated.View style={[styles.logoWrap, anim]}>{children}</Animated.View>;
}

function Login() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<Dispatch>();
  const { loginNotice, company } = useAppSlice();
  const passwordRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const viewHeight = useRef(0);
  const submitBottom = useRef(0);
  const { isKeyboardVisible } = useKeyboard();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    // selalu kosong: tidak pernah diisi akun contoh (isi otomatis hanya dari pengelola sandi HP)
    defaultValues: { identifier: '', password: '' },
  });
  const identifier = useWatch({ control, name: 'identifier' });

  // nomor Admin dari /meta: ambil ulang bila belum ada (mis. server belum siap saat aplikasi dibuka)
  useEffect(() => {
    if (!company) checkMeta(dispatch);
  }, [company, dispatch]);

  // keyboard muncul: gulir supaya tombol Masuk tetap terlihat di atas keyboard
  useEffect(() => {
    if (!isKeyboardVisible) return;
    const id = setTimeout(() => {
      const y = submitBottom.current + space.lg - viewHeight.current;
      if (y > 0) scrollRef.current?.scrollTo({ y, animated: true });
    }, 60);
    return () => clearTimeout(id);
  }, [isKeyboardVisible]);

  const onSubmit = handleSubmit(async values => {
    setFormError(null);
    const res = await signIn(dispatch, values.identifier, values.password);
    if (res.ok) return;
    const { fieldErrors, message, status, retryAfter } = res.error;
    if (fieldErrors.identifier) setError('identifier', { message: fieldErrors.identifier });
    if (fieldErrors.password) setError('password', { message: fieldErrors.password });
    if (status === 429 && retryAfter) {
      setFormError(`Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik.`);
    } else if (!fieldErrors.identifier && !fieldErrors.password) {
      setFormError(message);
    } else if (fieldErrors.identifier && /salah/i.test(fieldErrors.identifier)) {
      setFormError(null);
    }
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ height: insets.top, backgroundColor: colors.header }} />
      <OfflineBanner />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          onLayout={e => (viewHeight.current = e.nativeEvent.layout.height)}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {/* logo raster bertulisan navy: di mode gelap diberi alas terang supaya terbaca */}
          <LogoEntrance>
            <View style={[styles.logoPlate, isDark && { backgroundColor: lightColors.background }]}>
              <Image
                source={images.logoFull}
                style={styles.logo}
                accessibilityLabel="SION, Sarang Integra Oase Nature"
              />
            </View>
          </LogoEntrance>
          <FadeInItem index={2} style={styles.form}>
            <View style={styles.heading}>
              <Text variant="title" accessibilityRole="header">
                Masuk
              </Text>
              <Text variant="body" color="textSecondary">
                Pakai akun Pencuci, Kepala Pencuci, atau Mandor.
              </Text>
            </View>

            {loginNotice ? (
              <View style={[styles.notice, { backgroundColor: colors.infoBg }]}>
                <Icon name="info" size={18} color={colors.info} />
                <Text variant="small" style={[styles.flex, { color: colors.info }]}>
                  {loginNotice}
                </Text>
              </View>
            ) : null}

            <Controller
              control={control}
              name="identifier"
              render={({ field }) => (
                <TextField
                  label="Email atau nomor HP"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="none"
                  autoComplete="username"
                  keyboardType="email-address"
                  textContentType="username"
                  placeholder="nama@email.com atau 08xx"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  error={errors.identifier?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextField
                  ref={passwordRef}
                  label="Password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureToggle
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  placeholder="Masukkan password"
                  returnKeyType="go"
                  onSubmitEditing={onSubmit}
                  error={errors.password?.message}
                />
              )}
            />

            {formError ? (
              <View
                style={[styles.notice, { backgroundColor: colors.dangerBg }]}
                accessibilityLiveRegion="polite">
                <Icon name="alert-circle" size={18} color={colors.danger} />
                <Text variant="smallStrong" color="danger" style={styles.flex}>
                  {formError}
                </Text>
              </View>
            ) : null}

            <View
              onLayout={e => {
                const { y, height } = e.nativeEvent.layout;
                submitBottom.current = y + height;
              }}>
              <Button title="Masuk" onPress={onSubmit} isLoading={isSubmitting} fullWidth />
            </View>

            <View style={styles.forgot}>
              <Text variant="small" color="textSecondary" align="center">
                Lupa password? Admin yang mengatur ulang password Anda.
              </Text>
              <ContactAdmin
                message={forgotPasswordMessage(identifier)}
                style={styles.center}
                fallback={
                  <Text variant="small" color="textSecondary" align="center">
                    Nomor WhatsApp Admin belum tersedia. Hubungi Admin langsung di kantor atau lewat
                    atasan Anda.
                  </Text>
                }
              />
            </View>
          </FadeInItem>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    padding: sizes.gutter,
    paddingTop: space.xxl,
    gap: space.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  logoWrap: { alignSelf: 'center' },
  form: { gap: space.lg },
  center: { alignSelf: 'center' },
  logoPlate: { alignSelf: 'center', borderRadius: radius.card, padding: space.sm },
  logo: { width: 168, height: 181 },
  heading: { gap: space.xs, marginTop: space.sm },
  forgot: { gap: space.sm, marginTop: space.sm },
  notice: {
    flexDirection: 'row',
    gap: space.sm,
    padding: space.md,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
});

export default Login;
