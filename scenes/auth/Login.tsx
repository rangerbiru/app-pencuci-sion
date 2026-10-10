import { useRef, useState } from 'react';
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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useTheme from '@/hooks/useTheme';
import { images, lightColors, radius, sizes, space } from '@/theme';
import { signIn } from '@/services/session';
import { useAppSlice } from '@/slices';
import Text from '@/components/elements/Text';
import TextField from '@/components/elements/TextField';
import Button from '@/components/elements/Button';
import Image from '@/components/elements/Image';
import Icon from '@/components/elements/Icon';
import ContactAdmin from '@/components/elements/ContactAdmin';
import OfflineBanner from '@/components/layouts/OfflineBanner';
import config from '@/utils/config';
import type { Dispatch } from '@/utils/store';

const schema = z.object({
  identifier: z.string().trim().min(1, 'Isi email atau nomor HP.'),
  password: z.string().min(1, 'Isi password.'),
});

type FormValues = z.infer<typeof schema>;

function Login() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch<Dispatch>();
  const { loginNotice } = useAppSlice();
  const passwordRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  });

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
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
          keyboardShouldPersistTaps="handled">
          {/* logo raster bertulisan navy: di mode gelap diberi alas terang supaya terbaca */}
          <View style={[styles.logoPlate, isDark && { backgroundColor: lightColors.background }]}>
            <Image
              source={images.logoFull}
              style={styles.logo}
              accessibilityLabel="SION, Sarang Integra Oase Nature"
            />
          </View>
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
                placeholder="0812... atau nama@contoh.com"
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

          <Button title="Masuk" onPress={onSubmit} isLoading={isSubmitting} fullWidth />
          {__DEV__ ? (
            // hanya build pengembangan: alamat API yang benar-benar terbaca, untuk dicek dari HP
            <Text variant="caption" color="textSecondary" align="center" selectable>
              API: {config.apiBase}
            </Text>
          ) : null}

          <View style={styles.forgot}>
            <Text variant="small" color="textSecondary" align="center">
              Lupa password? Minta Admin mengatur ulang password Anda.
            </Text>
            <ContactAdmin message="Halo Admin SION, saya lupa password aplikasi SION Mobile. Nama/nomor HP saya: " />
          </View>
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
