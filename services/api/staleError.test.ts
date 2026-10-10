import { forCurrentArg, staleError } from './staleError';

const err = { kind: 'network', status: null, message: 'Tidak ada sinyal', fieldErrors: {} };

describe('staleError', () => {
  it('returns the error only when old data is still shown', () => {
    expect(staleError({ error: err, data: [1] })?.message).toBe('Tidak ada sinyal');
    expect(staleError({ error: err })).toBeNull();
    expect(staleError({ data: [1] })).toBeNull();
  });
});

describe('forCurrentArg', () => {
  it('treats a new argument as loading instead of showing the previous result', () => {
    const q = forCurrentArg({
      data: [1],
      currentData: undefined,
      isLoading: false,
      isFetching: true,
    });
    expect(q.data).toBeUndefined();
    expect(q.isLoading).toBe(true);
  });

  it('keeps old content while refreshing the same argument', () => {
    const q = forCurrentArg({ data: [1], currentData: [1], isLoading: false, isFetching: true });
    expect(q.data).toEqual([1]);
    expect(q.isLoading).toBe(false);
  });
});
