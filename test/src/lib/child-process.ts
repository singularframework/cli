import { spawn as childSpawn, SpawnOptions } from 'child_process';

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

export interface ChildSpawnResponse {

  code: number;
  signal: NodeJS.Signals;

}
