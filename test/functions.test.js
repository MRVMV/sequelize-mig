import { getYYYYMMDDHHMMSS , shuffleArray} from '../lib/functions.js';

test('getYYYYMMDDHHMMSS', () => {
  expect(getYYYYMMDDHHMMSS()).toHaveLength(14);
});

test('shuffleArray', () => {
  const arr = [1, 2, 3];
  expect(shuffleArray(arr)).toHaveLength(3);
});
