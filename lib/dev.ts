export const isDev = process.env.NODE_ENV !== 'production';

export function assertDev() {
  if (!isDev) {
    const err: any = new Error('Not Found');
    err.status = 404;
    throw err;
  }
}
