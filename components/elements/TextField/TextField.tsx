import { forwardRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
} from 'react-native';
import useTheme from '@/hooks/useTheme';
import { fonts, radius, sizes, space, typography } from '@/theme';
import Text from '../Text';
import Icon from '../Icon';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** satuan di depan isian, mis. "Rp" */
  prefix?: string;
  /** satuan di belakang isian, mis. "gr" atau "pcs" */
  unit?: string;
  /** isian password dengan tombol tampilkan/sembunyikan */
  secureToggle?: boolean;
}

/** Garis 1 px biasa, 2 px saat fokus atau error. Padding dikurangi agar teks tidak bergeser. */
const BORDER = 1;
const BORDER_ACTIVE = 2;

/**
 * Satu-satunya isian teks di aplikasi. Label di atas, teks bantuan atau pesan error di bawah,
 * satuan di dalam isian. Hanya satu garis tepi: outline bawaan web dan garis bawah Android
 * dimatikan supaya tidak muncul garis kedua di dalam isian.
 */
const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    error,
    hint,
    prefix,
    unit,
    secureToggle,
    style,
    editable = true,
    multiline,
    onFocus,
    onBlur,
    ...others
  },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const active = focused || !!error;
  const borderWidth = active ? BORDER_ACTIVE : BORDER;
  const borderColor = error ? colors.danger : focused ? colors.fieldFocus : colors.fieldBorder;
  const inset = BORDER_ACTIVE - borderWidth;
  const labelId = `${label}-label`;

  return (
    <View style={styles.root}>
      <Text variant="smallStrong" nativeID={labelId}>
        {label}
      </Text>
      <View
        style={[
          styles.box,
          multiline && styles.boxMultiline,
          {
            borderColor,
            borderWidth,
            padding: inset,
            backgroundColor: editable ? colors.fieldBackground : colors.surfaceSunken,
          },
        ]}>
        {prefix ? (
          <Text variant="bodyStrong" color="textSecondary" style={styles.prefix}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityLabelledBy={labelId}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.placeholder}
          underlineColorAndroid="transparent"
          cursorColor={colors.fieldFocus}
          selectionColor={colors.fieldFocus}
          multiline={multiline}
          style={[
            styles.input,
            prefix ? styles.inputAfterPrefix : null,
            multiline && styles.inputMultiline,
            { color: colors.text },
            webNoOutline,
            style,
          ]}
          {...others}
          secureTextEntry={secureToggle ? hidden : others.secureTextEntry}
          editable={editable}
          onFocus={e => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {unit ? (
          <Text variant="bodyStrong" color="textSecondary" style={styles.unit}>
            {unit}
          </Text>
        ) : null}
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden(h => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Tampilkan password' : 'Sembunyikan password'}
            hitSlop={4}
            style={styles.toggle}>
            <Icon name={hidden ? 'eye' : 'eye-off'} size={22} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Icon name="alert-circle" size={16} color={colors.danger} />
          <Text variant="small" color="danger" style={styles.flex}>
            {error}
          </Text>
        </View>
      ) : null}
      {hint ? (
        <Text variant="small" color="textSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

/** react-native-web memberi outline biru/putih saat fokus; garis fokus sudah di kotak isian. */
const webNoOutline =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle)
    : null;

const styles = StyleSheet.create({
  root: { gap: space.xs + 2 },
  box: {
    minHeight: sizes.input,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  boxMultiline: { alignItems: 'flex-start' },
  prefix: { paddingLeft: space.md, paddingRight: space.xs },
  input: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
    ...typography.body,
    fontFamily: fonts.regular,
    fontSize: 18,
    paddingHorizontal: space.md,
    paddingVertical: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    fontVariant: ['tabular-nums'],
  },
  inputAfterPrefix: { paddingLeft: 0 },
  inputMultiline: { minHeight: 88, paddingVertical: space.md, textAlignVertical: 'top' },
  unit: { paddingRight: space.md, paddingLeft: space.xs },
  toggle: {
    width: sizes.touch,
    height: sizes.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { flexDirection: 'row', gap: space.xs, alignItems: 'flex-start' },
  flex: { flex: 1 },
});

export default TextField;
