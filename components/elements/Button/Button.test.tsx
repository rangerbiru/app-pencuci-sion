import { render, fireEvent, screen } from '@testing-library/react-native';
import Button from './Button';

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
});
