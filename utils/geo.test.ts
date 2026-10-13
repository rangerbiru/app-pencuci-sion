import { distanceMeters, locationVerdict } from './geo';

const office = { latitude: -6.2, longitude: 106.816666 };

describe('geo', () => {
  it('measures distance in meters', () => {
    // 0,001 derajat lintang sekitar 111 m
    const d = distanceMeters(office, { latitude: -6.201, longitude: 106.816666 });
    expect(Math.round(d)).toBe(111);
  });

  it('says inside or outside the work radius', () => {
    const near = { latitude: -6.2005, longitude: 106.816666 };
    const far = { latitude: -6.21, longitude: 106.816666 };
    expect(locationVerdict(near, { ...office, radius_m: 100 })).toEqual({
      inside: true,
      distance: 56,
    });
    expect(locationVerdict(far, { ...office, radius_m: null }, 100)?.inside).toBe(false);
  });

  it('leaves the decision to the server without work coordinates or radius', () => {
    expect(locationVerdict(office, { latitude: null, longitude: null }, 100)).toBeNull();
    expect(locationVerdict(office, office, null)).toBeNull();
    expect(locationVerdict(office, null, 100)).toBeNull();
  });
});
