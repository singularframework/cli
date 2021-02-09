import { spawn as childSpawn, cd as cdFunction } from './child-process';
import { wait as waitFunction } from './wait';
import { kill as treeKill } from './kill';
import { ChildProcess } from 'child_process';

declare global {

  const spawn: typeof childSpawn;
  /** Absolute path to sg.js file. */
  const sgPath: string;
  /** Absolute path to test directory. */
  const testDir: string;
  const wait: typeof waitFunction;
  const kill: typeof treeKill;
  const cd: typeof cdFunction;
  /** Holds a reference to all running processes spawned. */
  const processes: ChildProcess[];

}
