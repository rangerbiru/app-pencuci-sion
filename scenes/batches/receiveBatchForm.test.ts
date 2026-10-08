import { validateReceiveBatch, ReceiveInput } from './receiveBatchForm';
import { Container } from '@/types';

const empty: ReceiveInput = { gram: '', bruto: '', tare: '', tareReason: '', pcs: '', notes: '' };
const box: Container = {
  kode: 'WD00001',
  jenis: { code: 'wadah', label: 'Wadah' },
  nama: 'Box biru',
  tara_gram: '350.00',
  status: { code: 'aktif', label: 'Aktif' },
  usable: true,
  isi_kode_stok: null,
};

describe('terima batch', () => {
  it('accepts the full sent gram without notes', () => {
    const res = validateReceiveBatch({ ...empty, gram: '6.000', pcs: '480' }, '6000.00', null);
    expect(res).toEqual({
      ok: true,
      values: {
        receivedGram: '6000.00',
        receivedPcs: 480,
        notes: null,
        shrinkGram: '0.00',
        container: undefined,
      },
    });
  });

  it('never accepts more than was sent', () => {
    const res = validateReceiveBatch({ ...empty, gram: '6000,01' }, '6000.00', null);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.gram).toMatch(/melebihi gram yang dikirim/);
  });

  it('requires a note when there is a difference', () => {
    const res = validateReceiveBatch({ ...empty, gram: '5900' }, '6000.00', null);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errors.notes).toMatch(/selisih 100 gr/);
    const ok = validateReceiveBatch(
      { ...empty, gram: '5900', notes: 'Tercecer saat bongkar' },
      '6000.00',
      null,
    );
    expect(ok.ok && ok.values.shrinkGram).toBe('100.00');
  });

  it('computes gram from bruto minus container tare', () => {
    const res = validateReceiveBatch({ ...empty, bruto: '6.350' }, '6000.00', box);
    expect(res.ok && res.values.receivedGram).toBe('6000.00');
    expect(res.ok && res.values.container).toEqual({
      container_code: 'WD00001',
      container_tare: null,
      tare_reason: null,
      bruto: '6350.00',
    });
  });

  it('blocks bruto that makes gram exceed the shipment', () => {
    const res = validateReceiveBatch({ ...empty, bruto: '6400' }, '6000.00', box);
    expect(!res.ok && res.errors.bruto).toMatch(/melebihi/);
  });

  it('requires a reason when the tare is changed', () => {
    const res = validateReceiveBatch({ ...empty, bruto: '6300', tare: '300' }, '6000.00', box);
    expect(!res.ok && res.errors.tareReason).toMatch(/alasannya/);
  });
});
