export const fetcherSWR = (url: string) => fetch(url).then((res) => res.json());

export function removeRangeString(str: string, from: number, to: number) {
  return str.substring(0, from) + str.substring(to);
}
