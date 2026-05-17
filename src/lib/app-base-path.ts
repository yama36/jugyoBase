/**
 * Next.js の `basePath` と同一値。ミドルウェアの matcher・リダイレクトと揃える。
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath
 */
export const APP_BASE_PATH = "/jugyobase";

/** `<a>` や `<img src>` など Link 以外で basePath 付き URL が必要なとき */
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error(`withBasePath expects absolute path: ${path}`);
  }
  if (APP_BASE_PATH && path.startsWith(APP_BASE_PATH)) {
    return path;
  }
  return APP_BASE_PATH ? `${APP_BASE_PATH}${path}` : path;
}
