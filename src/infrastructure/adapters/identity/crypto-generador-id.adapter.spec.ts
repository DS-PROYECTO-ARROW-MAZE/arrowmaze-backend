import { CryptoGeneradorIdAdapter } from './crypto-generador-id.adapter';

describe('CryptoGeneradorIdAdapter', () => {
  const adapter = new CryptoGeneradorIdAdapter();

  it('should_return_a_non_empty_string_when_generating_an_id', () => {
    const id = adapter.generar();

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should_return_a_canonical_uuid_v4_when_generating_an_id', () => {
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(adapter.generar()).toMatch(uuidV4);
  });

  it('should_return_unique_values_when_generating_many_ids', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => adapter.generar()));

    expect(ids.size).toBe(1000);
  });
});
