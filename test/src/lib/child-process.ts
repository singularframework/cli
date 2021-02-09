import { spawn as childSpawn, SpawnOptions } from 'child_process';
import path from 'path';

export { ChildProcess } from 'child_process';

/** Spawns a child process and returns both the reference and a promise which is resolved when the process exits. */
export function spawn(command: string, args: string[], options?: SpawnOptions) {

  if ( ! options ) options = {};

  options = Object.assign({}, {
    windowsHide: true,
    cwd: testDir,
    stdio: 'pipe'
  }, options);

  const ref = childSpawn(command, args, options);

  // Add to processes
  processes.push(ref);

  return {
    ref,
    promise: new Promise<ChildSpawnResponse>((resolve, reject) => ref
      .on('exit', (code, signal) => {

        processes.splice(processes.indexOf(ref), 1);
        resolve({ code, signal });

      })
      .on('error', error => {

        processes.splice(processes.indexOf(ref), 1);
        reject(error);

      }))
  };

}

/**
* Changes the cwd of the returning functions.
* @param relativePath Path relative to testDir.
*/
export function cd(relativePath: string) {

  return {
    /** Spawns a child process and returns both the reference and a promise which is resolved when the process exits. */
    spawn: (command: string, args: string[], options?: SpawnOptions) => spawn(command, args, Object.assign({}, { cwd: path.join(testDir, ...relativePath.split(path.sep)) }, options))
  };

}

export interface ChildSpawnResponse {

  code: number;
  signal: NodeJS.Signals;

}
