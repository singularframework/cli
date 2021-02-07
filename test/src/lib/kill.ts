import treeKill from 'tree-kill';

/** Kills a process and returns a promise. */
export function kill(pid: number) {

  return new Promise<void>((resolve, reject) => {

    treeKill(pid, error => {

      if ( error ) return reject(error);
      resolve();

    });

  });

}
