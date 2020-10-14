import { getYYYYMMDDHHMMSS , shuffleArray} from '../lib/functions.js';

test('getYYYYMMDDHHMMSS', () => {
  const today = new Date(2020, 1, 1, 2, 1, 1, 1);
  expect(getYYYYMMDDHHMMSS(today)).toBe('20200201000101');
});

test('shuffleArray', () => {
  const arr = [1, 2, 3];
  expect(shuffleArray(arr)).toHaveLength(3);
});
