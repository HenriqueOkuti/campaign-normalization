import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

export function loadEnv() {
  interface PathsInterface {
    test: string;
    dev: string;
    prod: string;
  }

  const possiblePaths: PathsInterface = {
    test: '.env.test',
    dev: '.env.dev',
    prod: '.env.prod',
  };

  const environment: string = process.env.NODE_ENV;

  const path = possiblePaths[environment as keyof PathsInterface];

  const currentEnvs = dotenv.config({ path });
  dotenvExpand.expand(currentEnvs);
}
