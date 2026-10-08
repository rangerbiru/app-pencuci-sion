import { http } from '../api/http';
import { __resetQueueForTests, configureQueue, enqueue, getQueue, processQueue } from './runner';
import { saveQueue } from './storage';

jest.mock('../api/http', () => ({ http: jest.fn() }));
jest.mock('./storage', () => ({
  loadQueue: jest.fn(async () => []),
  saveQueue: jest.fn(async () => undefined),
  persistFile: jest.fn((uri: string) => `queued://${uri}`),
  deleteFiles: jest.fn(),
}));

const httpMock = http as jest.MockedFunction<typeof http>;
const ok = { ok: true as const, status: 201, data: { data: { id: 1 } } };
const offline = {
  ok: false as const,
  error: { kind: 'network' as const, status: null, message: 'offline', fieldErrors: {} },
};

let online = true;
const onSent = jest.fn();

beforeEach(() => {
  __resetQueueForTests();
  httpMock.mockReset();
  onSent.mockReset();
  online = true;
  configureQueue({
    listener: { onChange: () => undefined, onSent },
    isOnline: () => online,
    currentUser: () => 7,
  });
});

const takeMaterial = () =>
  enqueue({
    kind: 'take_material',
    path: '/work/take-material',
    fields: { batch_assignment_id: 12, weight: '500.00' },
    files: { photo: 'file:///photo.jpg' },
  });

describe('resend queue', () => {
  it('sends immediately when online and removes the item', async () => {
    httpMock.mockResolvedValue(ok);
    const res = await takeMaterial();
    expect(res.status).toBe('sent');
    expect(getQueue()).toHaveLength(0);
    expect(httpMock).toHaveBeenCalledTimes(1);
    expect(httpMock.mock.calls[0][0].idempotencyKey).toBeTruthy();
  });

  it('keeps the item as "Belum terkirim" when there is no signal', async () => {
    httpMock.mockResolvedValue(offline);
    const res = await takeMaterial();
    expect(res.status).toBe('queued');
    expect(getQueue()).toHaveLength(1);
    expect(getQueue()[0].status).toBe('pending');
    expect(getQueue()[0].files.photo).toBe('queued://file:///photo.jpg');
    expect(saveQueue).toHaveBeenCalled();
  });

  it('does not send while offline and sends once when back online', async () => {
    online = false;
    await takeMaterial();
    expect(httpMock).not.toHaveBeenCalled();

    online = true;
    httpMock.mockResolvedValue(ok);
    await Promise.all([processQueue(), processQueue(), processQueue()]);
    expect(httpMock).toHaveBeenCalledTimes(1);
    expect(getQueue()).toHaveLength(0);
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('reuses the same idempotency key on every retry', async () => {
    httpMock.mockResolvedValueOnce(offline);
    await takeMaterial();
    httpMock.mockResolvedValueOnce(offline);
    await processQueue();
    httpMock.mockResolvedValueOnce(ok);
    await processQueue();
    const keys = httpMock.mock.calls.map(c => c[0].idempotencyKey);
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(1);
  });

  it('does not queue the same check-in twice', async () => {
    online = false;
    const a = await enqueue({
      kind: 'check_in',
      path: '/attendance/check-in',
      dedupeKey: 'check_in:2026-09-24',
      fields: {},
    });
    const b = await enqueue({
      kind: 'check_in',
      path: '/attendance/check-in',
      dedupeKey: 'check_in:2026-09-24',
      fields: {},
    });
    expect(getQueue()).toHaveLength(1);
    expect(a.status === 'queued' && b.status === 'queued' && a.item.id === b.item.id).toBe(true);
  });

  it('treats 409 on check-in as already recorded', async () => {
    httpMock.mockResolvedValue({
      ok: false,
      error: { kind: 'http', status: 409, message: 'Anda sudah absen masuk.', fieldErrors: {} },
    });
    const res = await enqueue({ kind: 'check_in', path: '/attendance/check-in', fields: {} });
    expect(res.status).toBe('sent');
    expect(getQueue()).toHaveLength(0);
  });

  it('returns validation errors to the form and drops the item', async () => {
    httpMock.mockResolvedValue({
      ok: false,
      error: {
        kind: 'http',
        status: 422,
        message: 'Gram melebihi sisa jatah',
        fieldErrors: { weight: 'Gram melebihi sisa jatah' },
      },
    });
    const res = await takeMaterial();
    expect(res.status).toBe('rejected');
    expect(getQueue()).toHaveLength(0);
  });

  it('only sends items owned by the signed-in user', async () => {
    online = false;
    await takeMaterial();
    configureQueue({
      listener: { onChange: () => undefined, onSent },
      isOnline: () => true,
      currentUser: () => 99,
    });
    httpMock.mockResolvedValue(ok);
    await processQueue();
    expect(httpMock).not.toHaveBeenCalled();
    expect(getQueue()).toHaveLength(1);
  });
});
