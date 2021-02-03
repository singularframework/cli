import { spawn as childSpawn, SpawnOptions } from 'child_process';

export { ChildProcess } from 'child_process';

/** Spawns a child process and returns both the reference and a promise which is resolved when the process exits. */
export function spawn(command: string, args: string[], options: SpawnOptions) {

  const ref = childSpawn(command, args, options);

  return {
    ref,
    promise: new Promise<ChildSpawnResponse>((resolve, reject) => ref
      .on('exit', (code, signal) => resolve({ code, signal }))
      .on('error', reject))
  };

}

export interface ChildSpawnResponse {

  code: number;
  signal: NodeJS.Signals;

}
