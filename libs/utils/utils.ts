import isEmpty from 'lodash-es/isEmpty';

export function toQueryString(queryStringObject: URLSearchParamsArg): string {
  if (isEmpty(queryStringObject)) {
    return '';
  }

  const params = new URLSearchParams(queryStringObject);

  for (const [key, value] of [...Array.from(params)]) {
    if (value === 'undefined' || value === 'null') {
      params.delete(key);
    }
  }

  return `${params.toString()}`;
}

export function buildURL(url: string, params?: URLSearchParamsArg): string {
  const queryString = toQueryString(params);

  if (isEmpty(queryString)) {
    return url;
  }

  return url + (url.indexOf('?') === -1 ? '?' : '&') + queryString;
}

// simplify from https://gist.github.com/brandonmcconnell/4a177fd6af7cffd4ca4808b3298b930c
export function getDifferentInDays(fromDate: Date, toDate: Date) {
  const rtf = new Intl.RelativeTimeFormat('en', {
    localeMatcher: 'best fit',
    numeric: 'always',
    style: 'long'
  });
  let diff = fromDate.getTime() - toDate.getTime();

  for (const [unit, value] of [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 31],
    ['week', 1000 * 60 * 60 * 24 * 7],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000]
  ]) {
    if (Math.abs(diff) >= value) {
      diff = Math.floor(diff / Number(value));
      return rtf.format(diff, unit as Intl.RelativeTimeFormatUnit);
    }
  }

  return '';
}
