import { http } from './api/http';
import { submitPrepareBatch } from './fieldActions';
import { __resetQueueForTests, configureQueue, getQueue, processQueue } from './queue/runner';

jest.mock('./api/http', () => ({ http: jest.fn() }));
jest.mock('./queue/storage', () => ({
  loadQueue: jest.fn(async () => []),
  saveQueue: jest.fn(async () => undefined),
  persistFile: jest.fn((uri: string) => uri),
  deleteFiles: jest.fn(),
}));

const httpMock = http as jest.MockedFunction<typeof http>;
let online = false;

const body = {
  prepared_at: '2026-10-22',
  process_type: 'kering' as const,
  notes: null,
  g1_gram: '2800.00',
  g1_pcs: null,
  crushed: [{ item_id: 9, gram: '80.00', pcs: null }],
};

beforeEach(() => {
  __resetQueueForTests();
  httpMock.mockReset();
  online = false;
  configureQueue({
    listener: { onChange: () => undefined, onSent: () => undefined },
    isOnline: () => online,
    currentUser: () => 7,
  });
});

describe('prepare batch offline', () => {
  it('queues while offline, then sends JSON with one Idempotency-Key when back online', async () => {
    const res = await submitPrepareBatch({ batchId: 14, batchCode: 'B-MB', body });
    expect(res.status).toBe('queued');
    expect(getQueue()).toHaveLength(1);
    expect(getQueue()[0]).toMatchObject({ kind: 'prepare_batch', json: true });
    expect(httpMock).not.toHaveBeenCalled();

    online = true;
    httpMock.mockResolvedValue({ ok: true, status: 201, data: { data: { preparation_id: 1 } } });
    await processQueue();
    expect(getQueue()).toHaveLength(0);
    const call = httpMock.mock.calls[0][0];
    expect(call.path).toBe('/batches/14/preparation');
    expect(call.idempotencyKey).toBe(res.status === 'queued' ? res.item.id : '');
    expect(call.body).toMatchObject({
      g1_gram: '2800.00',
      crushed: [{ item_id: 9, gram: '80.00' }],
    });
  });

  it('does not queue the same batch twice', async () => {
    await submitPrepareBatch({ batchId: 14, batchCode: 'B-MB', body });
    await submitPrepareBatch({ batchId: 14, batchCode: 'B-MB', body });
    expect(getQueue()).toHaveLength(1);
  });
});
