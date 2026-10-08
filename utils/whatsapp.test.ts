import { whatsappNumber, whatsappUrl } from './whatsapp';

describe('whatsapp', () => {
  it('normalises Indonesian numbers to 62...', () => {
    expect(whatsappNumber('6281234567890')).toBe('6281234567890');
    expect(whatsappNumber('0812-3456-7890')).toBe('6281234567890');
    expect(whatsappNumber('+62 812 3456 7890')).toBe('6281234567890');
  });

  it('hides the button when there is no number', () => {
    expect(whatsappUrl(null)).toBeNull();
    expect(whatsappUrl('')).toBeNull();
  });

  it('builds a wa.me link with an encoded message', () => {
    expect(whatsappUrl('6281234567890', 'Lupa password')).toBe(
      'https://wa.me/6281234567890?text=Lupa%20password',
    );
  });
});
