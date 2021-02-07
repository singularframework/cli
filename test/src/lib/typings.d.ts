import { spawn as childSpawn } from './child-process';
import { wait as waitFunction } from './wait';
import { kill as treeKill } from './kill';

declare global {

  const spawn: typeof childSpawn;
  /** Absolute path to sg.js file. */
  const sgPath: string;
  /** Absolute path to test directory. */
  const testDir: string;
  const wait: typeof waitFunction;
  const kill: typeof treeKill;

}
