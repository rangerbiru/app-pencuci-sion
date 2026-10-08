import { Linking } from 'react-native';
import { useAppSlice } from '@/slices';
import { whatsappUrl } from '@/utils/whatsapp';
import { useToast } from '../Toast';
import Button, { ButtonProps } from '../Button';

export interface ContactAdminProps extends Omit<ButtonProps, 'title' | 'onPress'> {
  /** pesan awal di WhatsApp */
  message?: string;
  title?: string;
}

/** Tombol Hubungi Admin lewat WhatsApp. Tidak tampil bila /meta tidak punya nomor Admin. */
function ContactAdmin({ message, title = 'Hubungi Admin', ...others }: ContactAdminProps) {
  const { company } = useAppSlice();
  const toast = useToast();
  const url = whatsappUrl(company?.admin_whatsapp, message);
  if (!url) return null;
  return (
    <Button
      title={title}
      variant="secondary"
      icon="message-circle"
      accessibilityHint="Membuka WhatsApp"
      onPress={() =>
        Linking.openURL(url).catch(() =>
          toast.show('WhatsApp tidak bisa dibuka. Pasang WhatsApp lalu coba lagi.', 'error'),
        )
      }
      {...others}
    />
  );
}

export default ContactAdmin;
