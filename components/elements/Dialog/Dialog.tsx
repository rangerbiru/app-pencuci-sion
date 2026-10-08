import { ReactNode, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import useTheme from '@/hooks/useTheme';
import { radius, sizes, space } from '@/theme';
import Text from '../Text';
import Button from '../Button';
import TextField from '../TextField';

export interface DialogProps {
  visible: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'danger';
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  confirmDisabled?: boolean;
}

/** Konfirmasi di lembar bawah: tombol di zona jempol. */
export function Dialog({
  visible,
  title,
  message,
  children,
  confirmLabel,
  confirmVariant = 'primary',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  isLoading,
  confirmDisabled,
}: DialogProps) {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Tutup"
        />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]} accessibilityViewIsModal>
          <Text variant="heading" accessibilityRole="header">
            {title}
          </Text>
          {message ? (
            <Text variant="body" color="textSecondary">
              {message}
            </Text>
          ) : null}
          {children}
          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              variant="secondary"
              onPress={onCancel}
              style={styles.flex}
              size="large"
            />
            <Button
              title={confirmLabel}
              variant={confirmVariant}
              onPress={onConfirm}
              isLoading={isLoading}
              disabled={confirmDisabled}
              style={styles.flex}
              size="large"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export interface ReasonDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
  serverError?: string;
  minLength?: number;
  /** penerima alasan, mis. "pencuci" atau "Kepala Pencuci" */
  recipient?: string;
}

/** Minta alasan wajib (tolak, tidak setuju). Minimal 5 huruf seperti aturan server. */
export function ReasonDialog({
  visible,
  title,
  message,
  confirmLabel,
  onSubmit,
  onCancel,
  isLoading,
  serverError,
  minLength = 5,
  recipient,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (visible) {
      setReason('');
      setTouched(false);
    }
  }, [visible]);
  const tooShort = reason.trim().length < minLength;
  const error = touched && tooShort ? `Tulis alasan minimal ${minLength} huruf.` : serverError;
  return (
    <Dialog
      visible={visible}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      confirmVariant="danger"
      onCancel={onCancel}
      isLoading={isLoading}
      onConfirm={() => {
        setTouched(true);
        if (!tooShort) onSubmit(reason.trim());
      }}>
      <TextField
        label="Alasan"
        value={reason}
        onChangeText={setReason}
        multiline
        error={error}
        placeholder="Contoh: Gram di foto berbeda dengan isian"
        hint={
          error
            ? undefined
            : `Minimal ${minLength} huruf.${recipient ? ` Dikirim ke ${recipient}.` : ''}`
        }
      />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    marginTop: 'auto',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: sizes.gutter,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
});
