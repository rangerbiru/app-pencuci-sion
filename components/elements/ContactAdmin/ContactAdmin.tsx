import { ReactNode } from 'react';
import { Linking } from 'react-native';
import { useAppSlice } from '@/slices';
import { whatsappUrl } from '@/utils/whatsapp';
import { useToast } from '../Toast';
import Button, { ButtonProps } from '../Button';

export interface ContactAdminProps extends Omit<ButtonProps, 'title' | 'onPress'> {
  /** pesan awal di WhatsApp */
  message?: string;
  title?: string;
  /** tampil bila /meta tidak punya nomor Admin; bawaan: tidak tampil apa pun */
  fallback?: ReactNode;
}

/** Tombol Hubungi Admin lewat WhatsApp. Tanpa nomor Admin di /meta: `fallback` (bawaan kosong). */
function ContactAdmin({
  message,
  title = 'Hubungi Admin',
  fallback = null,
  ...others
}: ContactAdminProps) {
  const { company } = useAppSlice();
  const toast = useToast();
  const url = whatsappUrl(company?.admin_whatsapp, message);
  if (!url) return <>{fallback}</>;
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
