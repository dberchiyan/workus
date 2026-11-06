/** The PostgreSQL connection settings, as the app, Prisma and the seed read them. */
export interface DatabaseSettings {
  host: string;
  port: number;
  name: string;
  username: string;
  password: string;
}

/** One connection URL from the parts; credentials are encoded, so any characters work. */
export const databaseUrl = ({ host, port, name, username, password }: DatabaseSettings): string =>
  `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${String(port)}/${encodeURIComponent(name)}?schema=public`;
