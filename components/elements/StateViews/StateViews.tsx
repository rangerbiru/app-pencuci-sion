import { StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { space } from '@/theme';
import { ApiError } from '@/services/api/errors';
import Text from '../Text';
import Icon, { IconName } from '../Icon';
import Button from '../Button';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Layar kosong selalu memberi langkah berikutnya. */
export function EmptyState({
  icon = 'inbox',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <Icon name={icon} size={32} color={colors.textSecondary} />
      <Text variant="subheading" align="center">
        {title}
      </Text>
      {message ? (
        <Text variant="body" color="textSecondary" align="center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="secondary" onPress={onAction} style={styles.button} />
      ) : null}
    </View>
  );
}

export interface ErrorStateProps {
  error: ApiError | undefined;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { colors } = useTheme();
  const offline = error?.kind === 'network' || error?.kind === 'timeout';
  return (
    <View style={styles.root} accessibilityLiveRegion="polite">
      <Icon name={offline ? 'wifi-off' : 'alert-triangle'} size={32} color={colors.danger} />
      <Text variant="subheading" align="center">
        {offline ? 'Tidak ada sinyal' : 'Data gagal dimuat'}
      </Text>
      <Text variant="body" color="textSecondary" align="center">
        {error?.message ?? 'Coba lagi sebentar lagi.'}
      </Text>
      <Button
        title="Coba lagi"
        icon="refresh-cw"
        variant="secondary"
        onPress={onRetry}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xxxl,
    paddingHorizontal: space.lg,
  },
  button: { marginTop: space.sm, alignSelf: 'stretch' },
});
