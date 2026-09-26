import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activeStorageAdapter, indexedDBAdapter } from './storageAdapter';

describe('Storage Adapter', () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
        vi.clearAllMocks();
        mockStorage = {};

        const fakeLocalStorage = {
            getItem: vi.fn((key: string) => mockStorage[key] || null),
            setItem: vi.fn((key: string, val: string) => {
                mockStorage[key] = val;
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStorage[key];
            }),
            clear: vi.fn(() => {
                mockStorage = {};
            }),
            length: 0,
            key: vi.fn(() => null),
        };

        vi.stubGlobal('localStorage', fakeLocalStorage);
    });

    it('activeStorageAdapter sets items to indexedDBAdapter', async () => {
        const spySet = vi.spyOn(indexedDBAdapter, 'setItem').mockResolvedValue(undefined);
        await activeStorageAdapter.setItem('test_key', '{"value": 42}');
        expect(spySet).toHaveBeenCalledWith('test_key', '{"value": 42}');
    });

    it('activeStorageAdapter removes items from both indexedDB and localStorage', async () => {
        const spyDel = vi.spyOn(indexedDBAdapter, 'removeItem').mockResolvedValue(undefined);
        mockStorage['test_key'] = 'some_value';

        await activeStorageAdapter.removeItem('test_key');
        expect(spyDel).toHaveBeenCalledWith('test_key');
        expect(localStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('reads directly from indexedDB if data is present in indexedDB', async () => {
        vi.spyOn(indexedDBAdapter, 'getItem').mockResolvedValue('{"from": "idb"}');
        const result = await activeStorageAdapter.getItem('my_key');
        expect(result).toBe('{"from": "idb"}');
    });

    it('migrates from localStorage to indexedDB if missing in indexedDB but present in localStorage', async () => {
        mockStorage['migrate_key'] = '{"from": "ls"}';

        // 1st call to getItem returns null, 2nd call (verification) returns lsValue
        vi.spyOn(indexedDBAdapter, 'getItem')
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce('{"from": "ls"}');

        const setSpy = vi.spyOn(indexedDBAdapter, 'setItem').mockResolvedValue(undefined);

        const result = await activeStorageAdapter.getItem('migrate_key');
        expect(setSpy).toHaveBeenCalledWith('migrate_key', '{"from": "ls"}');
        expect(result).toBe('{"from": "ls"}');
    });
});
