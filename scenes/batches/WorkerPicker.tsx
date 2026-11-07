import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import { radius, sizes, space } from '@/theme';
import Text from '@/components/elements/Text';
import Icon from '@/components/elements/Icon';
import Button from '@/components/elements/Button';
import ListRow from '@/components/elements/ListRow';

export interface WorkerOption {
  id: number;
  name: string;
}

export interface WorkerPickerProps {
  label: string;
  workers: WorkerOption[];
  value: number | null;
  onChange: (id: number) => void;
  /** pencuci yang sudah dipakai di baris lain, ditandai */
  usedIds?: number[];
  error?: string;
}

/** Pilih satu pencuci dari tim; bentuknya seperti isian, daftar muncul di lembar bawah. */
function WorkerPicker({ label, workers, value, onChange, usedIds = [], error }: WorkerPickerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = workers.find(w => w.id === value) ?? null;

  return (
    <View style={styles.root}>
      <Text variant="smallStrong">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.name ?? 'belum dipilih'}`}
        accessibilityHint="Membuka daftar pencuci"
        style={({ pressed }) => [
          styles.box,
          {
            borderColor: error ? colors.danger : colors.fieldBorder,
            borderWidth: error ? 2 : 1,
            backgroundColor: pressed ? colors.pressed : colors.fieldBackground,
          },
        ]}>
        <Text
          variant="body"
          style={[styles.flex, { color: selected ? colors.text : colors.placeholder }]}>
          {selected?.name ?? 'Pilih pencuci'}
        </Text>
        <Icon name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>
      {error ? (
        <Text variant="small" color="danger">
          {error}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Tutup"
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom + space.lg },
          ]}
          accessibilityViewIsModal>
          <Text variant="heading" accessibilityRole="header" style={styles.title}>
            {label}
          </Text>
          <ScrollView style={styles.list}>
            {workers.map((w, i) => (
              <ListRow
                key={w.id}
                title={w.name}
                subtitle={
                  usedIds.includes(w.id) && w.id !== value ? 'Sudah ada di baris lain' : undefined
                }
                right={
                  w.id === value ? (
                    <Icon name="check" size={20} color={colors.success} />
                  ) : undefined
                }
                divider={i < workers.length - 1}
                onPress={() => {
                  onChange(w.id);
                  setOpen(false);
                }}
              />
            ))}
          </ScrollView>
          <View style={styles.title}>
            <Button title="Batal" variant="secondary" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.xs + 2 },
  flex: { flex: 1 },
  box: {
    minHeight: sizes.input,
    borderRadius: radius.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
  },
  sheet: {
    marginTop: 'auto',
    maxHeight: '80%',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: sizes.gutter,
    gap: space.md,
  },
  title: { paddingHorizontal: sizes.gutter },
  list: { flexGrow: 0 },
});

export default WorkerPicker;
