/** Bandingkan versi semver sederhana "1.2.3". Negatif bila a < b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(/[.-]/).map(n => parseInt(n, 10) || 0);
  const pb = b.split(/[.-]/).map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length, 3); i += 1) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export function isBelowMinVersion(current: string, min: string | null | undefined): boolean {
  if (!min) return false;
  return compareVersions(current, min) < 0;
}
