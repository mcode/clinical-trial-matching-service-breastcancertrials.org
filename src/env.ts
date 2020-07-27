/**
 * This file will establish the presets for the server such as its port, matching service endpoint, and authorization 
 */

import fs from 'fs';
import path from 'path';

const defaults: {[key: string]: string | null} = {
  API_ENDPOINT: '', //TO-DO enter the endpoint for your api 
  PORT: '3000',
  AUTH_TOKEN: null //TO-DO create a .env.local file to store authorization token for your API
};


try {
  // Sadly there is no good way to *synchronously* read lines from a file and
  // Node provides no way to make a module load wait on a Promise.
  const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), { encoding: 'utf8' });
  // Note that the following will collapse \r\r into a single line, but it
  // doesn't matter, empty lines are ignored anyway.
  for (const line of envLocal.split(/\r?[\r\n]/)) {
    const m = /^\s*(\w+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) {
      const k = m[1], value = m[2];
      if (k in defaults) {
        defaults[k] = value;
      }
    }
  }
} catch(ex) {
  const e: NodeJS.ErrnoException = ex as NodeJS.ErrnoException;
  // Ignore ENOENT, it means the file doesn't exist, which is fine
  if (e.code !== 'ENOENT') {
    console.error('Unexpected error loading .env.local:');
    console.error(ex);
  }
}

// Override defaults with environment variables if they exist
for (const k in defaults) {
  if (k in process.env) {
    defaults[k] = process.env[k];
  }
}

export default class Configuration {
  API_ENDPOINT: string;
  PORT: number;
  AUTH_TOKEN: string | null;
  constructor() {
    // Default to defaults
    this.API_ENDPOINT = defaults.API_ENDPOINT;
    this.AUTH_TOKEN = defaults.AUTH_TOKEN;
    this.PORT = parseInt(defaults.PORT);
  }
  /**
   * @return Configuration information
   */
  defaultEnvObject(): {port: number, AUTH_TOKEN: string, api_endpoint: string} {
    return {
      port: this.PORT,
      AUTH_TOKEN: this.AUTH_TOKEN,
      api_endpoint: this.API_ENDPOINT
    };
  }
}

if (module.parent === null) {
  console.log('Environment as loaded:');
  for (const k of Object.entries(defaults)) {
    console.log(`  ${k[0]} = ${k[1]}`);
  }
}
