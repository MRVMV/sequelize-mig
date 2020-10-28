import { getYYYYMMDDHHMMSS, shuffleArray, template, getFileName } from '../lib/functions.js';

test('getYYYYMMDDHHMMSS', () => {
  expect(getYYYYMMDDHHMMSS()).toHaveLength(14);
});

test('shuffleArray', () => {
  const arr = [1, 2, 3];
  expect(shuffleArray(arr)).toHaveLength(3);
});

test('template', () => {
  expect(template(`Hi how are you '<%name%>'`, { name: 'Maher' })).toEqual('Hi how are you Maher');
});

test('getFileName', () => {
  expect(getFileName(`C:\\Program Files/nodejs\\node.exe`)).toEqual('node.exe');
});
