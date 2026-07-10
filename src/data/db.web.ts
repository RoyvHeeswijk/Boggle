export { schema } from './schema';

export function getDatabase(): never {
  throw new Error('SQLite is not available on web. Use matchRepository web storage.');
}
