import { useEffect, useState } from 'react';
import { isOnline, onOnlineChange } from '@/services/network';

/** true bila ada sinyal internet. */
export default function useOnline(): boolean {
  const [online, setOnline] = useState(isOnline());
  useEffect(() => onOnlineChange(setOnline), []);
  return online;
}
