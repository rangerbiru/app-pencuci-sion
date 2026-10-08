import { forwardRef, useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { compareDecimal } from '@/utils/decimal';
import { displayFromValue, formatNumberInput } from '@/utils/numberInput';
import { formatGram, formatRupiah } from '@/utils/format';
import TextField, { TextFieldProps } from '../TextField';

type BaseProps = Omit<TextFieldProps, 'value' | 'onChangeText' | 'keyboardType' | 'inputMode'>;

export interface NumberInputProps extends BaseProps {
  /** nilai untuk API tanpa titik ribuan: "1000000", "1250.5", atau "" */
  value: string;
  onChangeValue: (value: string) => void;
  /** 0 = bilangan bulat (rupiah, pcs), 2 = gram */
  decimals: number;
  /** nilai maksimal (string desimal); lebih dari ini = pesan error di bawah isian */
  max?: string | null;
  /** pesan saat melebihi `max` */
  maxMessage?: string;
}

/**
 * Isian angka yang diformat saat diketik (titik ribuan, koma desimal). Yang dikirim ke
 * `onChangeValue` selalu string angka polos, jadi aman untuk API dan perbandingan desimal.
 */
const NumberInput = forwardRef<TextInput, NumberInputProps>(function NumberInput(
  { value, onChangeValue, decimals, max, maxMessage, error, ...others },
  ref,
) {
  const [display, setDisplay] = useState(() => displayFromValue(value, decimals));
  const lastValue = useRef(value);

  // nilai diganti dari luar (reset form, chip "Tarik semua")
  useEffect(() => {
    if (value !== lastValue.current) {
      lastValue.current = value;
      setDisplay(displayFromValue(value, decimals));
    }
  }, [value, decimals]);

  const overMax = !!max && !!value && compareDecimal(value, max) > 0;

  return (
    <TextField
      ref={ref}
      {...others}
      value={display}
      keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      error={error ?? (overMax ? maxMessage : undefined)}
      onChangeText={text => {
        const next = formatNumberInput(text, decimals, display);
        setDisplay(next.display);
        lastValue.current = next.value;
        if (next.value !== value) onChangeValue(next.value);
      }}
    />
  );
});

export type MoneyInputProps = Omit<NumberInputProps, 'decimals' | 'prefix' | 'unit'>;

/** Rupiah: awalan "Rp", keyboard angka, tanpa sen. */
export const MoneyInput = forwardRef<TextInput, MoneyInputProps>(function MoneyInput(
  { max, maxMessage, ...others },
  ref,
) {
  return (
    <NumberInput
      ref={ref}
      {...others}
      decimals={0}
      prefix="Rp"
      max={max}
      maxMessage={
        maxMessage ?? (max ? `Melebihi batas ${formatRupiah(max, { style: 'whole' })}.` : undefined)
      }
    />
  );
});

export type GramInputProps = Omit<NumberInputProps, 'decimals' | 'prefix' | 'unit'>;

/** Gram: koma desimal (maks 2 angka), titik ribuan, satuan "gr" di belakang. */
export const GramInput = forwardRef<TextInput, GramInputProps>(function GramInput(
  { max, maxMessage, ...others },
  ref,
) {
  return (
    <NumberInput
      ref={ref}
      {...others}
      decimals={2}
      unit="gr"
      max={max}
      maxMessage={maxMessage ?? (max ? `Melebihi batas ${formatGram(max)}.` : undefined)}
    />
  );
});

export type PcsInputProps = Omit<NumberInputProps, 'decimals' | 'prefix' | 'unit'>;

/** Pcs: bilangan bulat dengan titik ribuan, satuan "pcs" di belakang. */
export const PcsInput = forwardRef<TextInput, PcsInputProps>(function PcsInput(props, ref) {
  return <NumberInput ref={ref} {...props} decimals={0} unit="pcs" />;
});

export default NumberInput;
