import { DeduplicationService, hashContent } from '../src/common';

describe('DeduplicationService', () => {
  const service = new DeduplicationService();

  it('prefers externalPostId, then url, then hash+publishedAt', () => {
    expect(service.buildWhere('s1', { externalPostId: 'abc', url: 'https://x', text: 't', raw: {} })).toEqual({ sourceId: 's1', externalPostId: 'abc' });
    expect(service.buildWhere('s1', { url: 'https://x', text: 't', raw: {} })).toEqual({ sourceId: 's1', postUrl: 'https://x' });
    const publishedAt = new Date('2024-01-01T00:00:00Z');
    expect(service.buildWhere('s1', { url: null, text: 'hello', publishedAt, raw: {} })).toEqual({ sourceId: 's1', contentHash: hashContent('hello'), publishedAt });
  });
});
