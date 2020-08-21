import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { dirname } = path;

// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url));

export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};
export const readAsset = (assetPath) => {
  return fs.readFileSync(path.join(__dirname, './assets', assetPath)).toString();
};

export default shuffleArray;
