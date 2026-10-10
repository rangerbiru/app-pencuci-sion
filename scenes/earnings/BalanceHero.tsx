import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { radius, space } from '@/theme';
import { Balance } from '@/types';
import { isFeatureEnabled } from '@/utils/config';
import { formatRupiah } from '@/utils/format';
import Text from '@/components/elements/Text';
import Button from '@/components/elements/Button';
import { CountUp, HeroSurface, onHero } from '@/components/elements/Motion';

function GlassTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text type="small" style={{ color: onHero.muted }}>
        {label}
      </Text>
      <Text type="bodyStrong" style={{ color: onHero.text }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/**
 * Kartu utama Pendapatan (v2): saldo dapat dicairkan (hitung naik saat tampil), sumber dana,
 * tombol Tarik dana, dan dua ubin kaca Bonus menunggu dan THR ditahan.
 */
function BalanceHero({ balance }: { balance: Balance }) {
  const byMandor = balance.paid_by.code === 'mandor';
  const fund = byMandor ? balance.mandor_funds?.[0] : null;
  const available = byMandor ? (fund?.dapat_dicairkan ?? '0.00') : balance.dapat_dicairkan;
  const thr = byMandor ? (fund?.thr_ditahan ?? balance.thr_ditahan) : balance.thr_ditahan;
  const source = byMandor ? `Dana Mandor ${fund?.mandor.name ?? ''}`.trim() : 'Dana SION';
  const formatted = formatRupiah(available, { style: 'whole' });

  return (
    <HeroSurface>
      <View style={styles.gapXs}>
        <Text type="small" style={{ color: onHero.muted }}>
          Saldo dapat dicairkan
        </Text>
        <CountUp
          value={available}
          formatted={formatted}
          prefix="Rp "
          type="numberXL"
          style={{ color: onHero.text }}
        />
        <Text type="small" style={{ color: onHero.muted }}>
          {source}. Minimal tarik {formatRupiah(balance.withdrawal.min_amount, { style: 'whole' })}.
        </Text>
      </View>
      <View style={styles.tiles}>
        <GlassTile
          label="Bonus menunggu"
          value={formatRupiah(balance.pending, { style: 'whole' })}
        />
        <GlassTile label="THR ditahan" value={formatRupiah(thr, { style: 'whole' })} />
      </View>
      {isFeatureEnabled('withdrawals') ? (
        <Button
          title="Tarik dana"
          icon="arrow-down-circle"
          onPress={() => router.push('/tarik-dana')}
        />
      ) : null}
    </HeroSurface>
  );
}

const styles = StyleSheet.create({
  gapXs: { gap: space.xxs },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: {
    flex: 1,
    borderRadius: radius.tile,
    padding: space.md,
    backgroundColor: onHero.glass,
    borderWidth: 1,
    borderColor: onHero.glassBorder,
    gap: 2,
  },
});

export default BalanceHero;
