let logLevel = 3;

export const getYYYYMMDDHHMMSS = (date = new Date()) =>
  [
    date.getUTCFullYear(),
    (date.getUTCMonth() + 1).toString().padStart(2, '0'),
    date.getUTCDate().toString().padStart(2, '0'),
    date.getUTCHours().toString().padStart(2, '0'),
    date.getUTCMinutes().toString().padStart(2, '0'),
    date.getUTCSeconds().toString().padStart(2, '0'),
  ].join('');

export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};

export const template = (text, params) => {
  Object.entries(params).forEach(([key, val]) => {
    text = text.replace(`'<%${key}%>'`, val);
  });

  return text;
};

export const getFileName = (path) => path.replace(/^.*(\\|\/|:)/, '');

export const log = (logLvl, message) => {
  if (logLvl >= logLevel) console.log(message);
};

export const setLogLevel = (logLvl) => {
  logLevel = logLvl;
};

/**
 * Slightly modified lodash groupBy
 * https://github.com/lodash/lodash/blob/master/groupBy.js
 */
export const groupBy = (collection, iteratee) =>
  collection.reduce((result, value, key) => {
    key = iteratee(value);
    if (Object.hasOwnProperty.call(result, key)) {
      result[key].push(value);
    } else {
      result[key] = [value];
    }
    return result;
  }, {});
