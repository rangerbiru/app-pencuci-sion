import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '@/hooks/useTheme';
import { radius, sizes, space } from '@/theme';
import { Item } from '@/types';
import Text from '../Text';
import Icon from '../Icon';
import Button from '../Button';
import ListRow from '../ListRow';

export interface ItemPickerProps {
  label: string;
  items: Item[];
  value: number | null;
  onChange: (item: Item) => void;
  error?: string;
  /** item yang sudah dipakai di baris lain, ditandai */
  usedIds?: number[];
  loading?: boolean;
}

function itemSubtitle(item: Item): string {
  return [item.jenis.label, item.grup_hasil?.label, item.kode].filter(Boolean).join(', ');
}

/** Pilih item dari GET /items. Bentuknya seperti isian; daftar muncul di lembar bawah. */
function ItemPicker({
  label,
  items,
  value,
  onChange,
  error,
  usedIds = [],
  loading,
}: ItemPickerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = items.find(i => i.id === value) ?? null;

  return (
    <View style={styles.root}>
      <Text variant="smallStrong">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.name ?? 'belum dipilih'}`}
        accessibilityHint="Membuka daftar item"
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
          {selected?.name ?? (loading ? 'Memuat item...' : 'Pilih item')}
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
            {items.length === 0 ? (
              <Text variant="body" color="textSecondary" style={styles.title}>
                Belum ada item aktif. Minta Admin menambahkan item di Master Item.
              </Text>
            ) : (
              items.map((it, i) => (
                <ListRow
                  key={it.id}
                  title={it.name}
                  subtitle={
                    usedIds.includes(it.id) && it.id !== value
                      ? `${itemSubtitle(it)}. Sudah ada di baris lain`
                      : itemSubtitle(it)
                  }
                  right={
                    it.id === value ? (
                      <Icon name="check" size={20} color={colors.success} />
                    ) : undefined
                  }
                  divider={i < items.length - 1}
                  onPress={() => {
                    onChange(it);
                    setOpen(false);
                  }}
                />
              ))
            )}
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

export default ItemPicker;
