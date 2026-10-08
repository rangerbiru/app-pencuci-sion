import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { space } from '@/theme';
import { toApiError, useChangePasswordMutation } from '@/services';
import { useToast } from '@/components/elements/Toast';
import Screen from '@/components/layouts/Screen';
import TextField from '@/components/elements/TextField';
import Button from '@/components/elements/Button';
import BottomBar from '@/components/elements/BottomBar';
import Text from '@/components/elements/Text';

const schema = z
  .object({
    current_password: z.string().min(1, 'Isi password sekarang.'),
    password: z.string().min(8, 'Password baru minimal 8 karakter.'),
    password_confirmation: z.string().min(1, 'Ulangi password baru.'),
  })
  .refine(v => v.password === v.password_confirmation, {
    path: ['password_confirmation'],
    message: 'Ulangan password tidak sama. Ketik lagi.',
  });

type Values = z.infer<typeof schema>;

/** Ganti password. Perangkat lain dikeluarkan; HP ini tetap masuk. */
function ChangePassword() {
  const toast = useToast();
  const [change, state] = useChangePasswordMutation();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: '', password: '', password_confirmation: '' },
  });

  const onSubmit = handleSubmit(async values => {
    try {
      await change(values).unwrap();
      toast.show('Password diganti');
      router.back();
    } catch (e) {
      const err = toApiError(e);
      const keys = Object.keys(err.fieldErrors) as (keyof Values)[];
      if (keys.length) keys.forEach(k => setError(k, { message: err.fieldErrors[k] }));
      else setError('current_password', { message: err.message });
    }
  });

  const field = (name: keyof Values, label: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field: f }) => (
        <TextField
          label={label}
          value={f.value}
          onChangeText={f.onChange}
          onBlur={f.onBlur}
          secureToggle
          autoCapitalize="none"
          error={errors[name]?.message}
        />
      )}
    />
  );

  return (
    <Screen
      title="Ganti password"
      back
      footer={
        <BottomBar>
          <Button
            title="Simpan password"
            onPress={onSubmit}
            isLoading={state.isLoading}
            style={styles.flex}
          />
        </BottomBar>
      }>
      <View style={styles.form}>
        {field('current_password', 'Password sekarang')}
        {field('password', 'Password baru')}
        {field('password_confirmation', 'Ulangi password baru')}
        <Text variant="small" color="textSecondary">
          Setelah diganti, HP lain yang memakai akun ini akan keluar. HP ini tetap masuk.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { gap: space.lg },
});

export default ChangePassword;
