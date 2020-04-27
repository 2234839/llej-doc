export function time33(str: string) {
  for (var i = 0, len = str.length, hash = 5381; i < len; ++i) {
    hash += (hash << 5) + str.charCodeAt(i);
  }
  return hash & 0x7fffffff;
}
