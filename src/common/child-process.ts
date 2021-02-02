import child from 'child_process';

export function spawn(command: string, args: string[], options: child.SpawnOptions): Promise<ChildSpawnResponse> {

  return new Promise((resolve, reject) => {

    child.spawn(command, args, options)
    .on('exit', (code, signal) => resolve({ code, signal }))
    .on('error', reject);

  });

}

export interface ChildSpawnResponse {

  code: number;
  signal: NodeJS.Signals;

}
