import { useEffect, useState } from 'react';
import { Dayjs } from 'dayjs';
import { useSelector } from 'react-redux';
import { jakarta } from '@/utils/date';
import type { State } from '@/utils/store';

/** Jam sekarang menurut server (selisih dari /meta), diperbarui tiap `intervalMs`. */
export default function useNow(intervalMs = 30000): Dayjs {
  const offset = useSelector((s: State) => s.app.serverOffsetMs);
  const [now, setNow] = useState(() => jakarta(Date.now() + offset));
  useEffect(() => {
    setNow(jakarta(Date.now() + offset));
    const t = setInterval(() => setNow(jakarta(Date.now() + offset)), intervalMs);
    return () => clearInterval(t);
  }, [offset, intervalMs]);
  return now;
}
