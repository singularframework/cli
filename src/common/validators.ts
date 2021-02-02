import fs from 'fs-extra';
import path from 'path';

export function pathDoesntExist(basePath: string, extension?: string) {

  return async function pathDoesntExist(filename: string) {

    if ( await fs.pathExists(path.resolve(basePath, filename + (extension ?? ''))) )
      throw new Error(`Path "${path.resolve(basePath, filename + (extension ?? ''))}" already exists!`);

  }

}
