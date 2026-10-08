import { useCallback, useState } from 'react';
import { useToast } from '@/components/elements/Toast';
import type { ApiError } from '@/services/api/errors';
import type { QueueOutcome } from '@/services/queue/types';

export const QUEUED_MESSAGE = 'Disimpan. Dikirim otomatis saat ada sinyal.';

/**
 * Kirim aksi lapangan lewat antrean dan tampilkan hasilnya dengan bahasa yang sama di
 * semua layar: berhasil -> toast `successMessage`; tanpa sinyal -> toast "Disimpan...";
 * ditolak server -> error dikembalikan ke form.
 */
export default function useFieldSubmit() {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = useCallback(
    async <T>(action: () => Promise<QueueOutcome<T>>, successMessage: string) => {
      setSubmitting(true);
      setError(null);
      try {
        const outcome = await action();
        if (outcome.status === 'sent') toast.show(successMessage, 'success');
        else if (outcome.status === 'queued') toast.show(QUEUED_MESSAGE, 'pending');
        else setError(outcome.error);
        return outcome;
      } finally {
        setSubmitting(false);
      }
    },
    [toast],
  );

  return { submit, submitting, error, setError };
}
