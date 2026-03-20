import { normalizeApifyRecord } from '../src/common';

describe('normalizeApifyRecord', () => {
  it('maps generic Apify output into normalized shape', () => {
    const result = normalizeApifyRecord({ id: '123', url: 'https://example.com/post/1', message: 'Hello world', author: 'Jane', timestamp: '2024-01-01T00:00:00Z' });
    expect(result).toMatchObject({ externalPostId: '123', url: 'https://example.com/post/1', text: 'Hello world', authorName: 'Jane' });
  });
});
