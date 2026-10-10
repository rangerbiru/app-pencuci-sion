import { render, fireEvent, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import Button, { BUTTON_HEIGHT } from './Button';

describe('<Button />', () => {
  it('renders the title and handles presses', () => {
    const onPress = jest.fn();
    render(<Button title="Kirim setoran" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Kirim setoran' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while loading', () => {
    const onPress = jest.fn();
    render(<Button title="Kirim" isLoading onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('marks loading as busy and disabled as not pressable', () => {
    const onPress = jest.fn();
    render(<Button title="Simpan" disabled onPress={onPress} />);
    const btn = screen.getByRole('button', { name: 'Simpan' });
    fireEvent.press(btn);
    expect(onPress).not.toHaveBeenCalled();
    expect(btn.props.accessibilityState).toMatchObject({ disabled: true, busy: false });
  });

  it('is 48 dp primary, 44 dp secondary, and only full width when asked', () => {
    render(
      <>
        <Button title="Utama" onPress={jest.fn()} />
        <Button title="Kedua" variant="secondary" onPress={jest.fn()} />
        <Button title="Bawah" fullWidth onPress={jest.fn()} />
      </>,
    );
    // tampilan ada di View pertama di dalam tombol, tata letak di tombol itu sendiri
    const outer = (name: string) =>
      StyleSheet.flatten(screen.getByRole('button', { name }).props.style);
    const inner = (name: string) =>
      StyleSheet.flatten(
        (screen.getByRole('button', { name }).children[0] as ReactTestInstance).props.style,
      );
    const flat = (name: string) => ({ ...outer(name), ...inner(name) });
    expect(flat('Utama')).toMatchObject({
      minHeight: BUTTON_HEIGHT.primary,
      alignSelf: 'flex-start',
    });
    expect(flat('Kedua')).toMatchObject({ minHeight: BUTTON_HEIGHT.secondary });
    expect(flat('Bawah')).toMatchObject({ alignSelf: 'stretch' });
  });
});
