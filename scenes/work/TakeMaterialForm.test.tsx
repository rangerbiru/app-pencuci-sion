import { fireEvent, render, screen } from '@testing-library/react-native';
import TakeMaterialForm from './TakeMaterialForm';
import { validateTakeMaterial } from './takeMaterialForm';
import { MyRation } from '@/types';

jest.mock('expo-image', () => ({ Image: () => null }));

const ration: MyRation = {
  batch_assignment_id: 12,
  batch_code: 'B-MOB',
  item: 'Bulu Berat',
  target_gram: '40000.00',
  taken_gram: '12500.00',
  pending_gram: '500.00',
  remaining_gram: '10000.00',
  taken_pcs: 100,
  status: { code: 'running', label: 'Berjalan' },
};

describe('validateTakeMaterial', () => {
  it('accepts gram equal to the remaining ration', () => {
    expect(validateTakeMaterial({ gram: '10.000', pcs: '' }, '10000.00')).toEqual({
      ok: true,
      values: { weight: '10000.00', pcs: null },
    });
  });

  it('rejects gram above the remaining ration with the server wording', () => {
    const res = validateTakeMaterial({ gram: '10000,01', pcs: '' }, '10000.00');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.gram).toBe(
        'Gram (10.000,01 gr) melebihi sisa jatah (10.000 gr). Kurangi gramnya.',
      );
    }
  });

  it('requires a positive number and whole pcs', () => {
    const empty = validateTakeMaterial({ gram: '', pcs: '' }, '100.00');
    expect(!empty.ok && empty.errors.gram).toMatch(/Isi gram/);
    const zero = validateTakeMaterial({ gram: '0', pcs: '1,5' }, '100.00');
    expect(!zero.ok && zero.errors.gram).toMatch(/lebih dari 0/);
    expect(!zero.ok && zero.errors.pcs).toMatch(/bilangan bulat/);
  });
});

describe('<TakeMaterialForm />', () => {
  it('blocks submit when gram exceeds the remaining ration', () => {
    const onValid = jest.fn();
    render(
      <TakeMaterialForm
        ration={ration}
        photoUri="file:///p.jpg"
        onRetakePhoto={jest.fn()}
        onValid={onValid}
      />,
    );
    fireEvent.changeText(screen.getByTestId('input-gram'), '12000');
    fireEvent.press(screen.getByRole('button', { name: 'Periksa' }));
    expect(onValid).not.toHaveBeenCalled();
    expect(screen.getByText(/melebihi sisa jatah/)).toBeTruthy();
  });

  it('shows dot thousands while typing', () => {
    render(
      <TakeMaterialForm
        ration={ration}
        photoUri="file:///p.jpg"
        onRetakePhoto={jest.fn()}
        onValid={jest.fn()}
      />,
    );
    fireEvent.changeText(screen.getByTestId('input-gram'), '1250,5');
    expect(screen.getByTestId('input-gram').props.value).toBe('1.250,5');
  });

  it('passes parsed values when valid', () => {
    const onValid = jest.fn();
    render(
      <TakeMaterialForm
        ration={ration}
        photoUri="file:///p.jpg"
        onRetakePhoto={jest.fn()}
        onValid={onValid}
      />,
    );
    fireEvent.changeText(screen.getByTestId('input-gram'), '1.250,5');
    fireEvent.changeText(screen.getByTestId('input-pcs'), '100');
    fireEvent.press(screen.getByRole('button', { name: 'Periksa' }));
    expect(onValid).toHaveBeenCalledWith(
      { weight: '1250.50', pcs: 100 },
      { gram: '1250.5', pcs: '100' },
    );
  });
});
