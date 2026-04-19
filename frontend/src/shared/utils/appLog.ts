/** Краткие логи [PM] в консоль. */

const P = "[PM]";

export const appLog = {
  dev: (msg: string, ...rest: unknown[]) => {
    if (import.meta.env.DEV) console.log(`${P} ${msg}`, ...rest);
  },
  info: (msg: string, ...rest: unknown[]) => {
    if (import.meta.env.DEV) console.log(`${P} ${msg}`, ...rest);
  },
  warn: (msg: string, ...rest: unknown[]) => {
    if (import.meta.env.DEV) console.warn(`${P} ${msg}`, ...rest);
  },
  error: (msg: string, ...rest: unknown[]) => console.error(`${P} ${msg}`, ...rest),
};
