import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { fonts, radius, sizes, space, typography } from '@/theme';
import Text from '../Text';
import Icon from '../Icon';

export interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  /** satuan di kanan isian, mis. "gr" */
  unit?: string;
  /** isian password dengan tombol tampilkan/sembunyikan */
  secureToggle?: boolean;
}

const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, unit, secureToggle, style, editable = true, onFocus, onBlur, ...others },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? colors.danger : focused ? colors.focusRing : colors.borderStrong;

  return (
    <View style={styles.root}>
      <Text variant="smallStrong" nativeID={`${label}-label`}>
        {label}
      </Text>
      <View
        style={[
          styles.box,
          {
            borderColor,
            borderWidth: focused || error ? 2 : 1,
            backgroundColor: editable ? colors.surface : colors.surfaceSunken,
          },
        ]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }, style]}
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
      ) : hint ? (
        <Text variant="small" color="textSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: space.xs + 2 },
  box: {
    minHeight: sizes.input,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: space.md,
  },
  input: {
    flex: 1,
    minWidth: 0,
    ...typography.body,
    fontFamily: fonts.regular,
    fontSize: 18,
    paddingVertical: space.sm,
    fontVariant: ['tabular-nums'],
  },
  unit: { paddingHorizontal: space.md },
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
