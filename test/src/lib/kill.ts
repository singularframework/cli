import treeKill from 'tree-kill';
import { ChildProcess } from 'child_process';

/** Kills a process and returns a promise. */
export function kill(child: ChildProcess) {

  return new Promise<void>((resolve, reject) => {

    treeKill(child.pid, error => {

      if ( error ) return reject(error);

      // Remove process from global processes
      processes.splice(processes.indexOf(child), 1);
      
      resolve();

    });

  });

}
