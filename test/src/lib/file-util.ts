import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';

/** Returns true (promise) if all paths exist (relative to testDir). */
export async function pathsExist(paths: string[]) {

  let result = true;

  for ( const file of paths ) {

    result = result && await fs.pathExists(path.join(testDir, file));

  }

  return result;

}

/**
* Checks a directory for file structure.
* `exact` expect all existing files to be included in the provided files.
* It ignores node_modules and .git contents (not the folders themselves).
*/
export function hasStructure(dir: string, files: string[], exact?: boolean) {

  const existing = glob.sync('**', { cwd: dir, dot: true }).filter(m => ! m.match(/^((node_modules)|(\.git))\/.+/));
  const missing = files.filter(f => ! existing.includes(f));

  if ( missing.length )
    throw new Error(`Missing ${missing.length} files!\n${missing.join('\n')}`);

  if ( exact ) {

    const unexpected = existing.filter(f => ! files.includes(f));

    if ( unexpected.length )
      throw new Error(`${unexpected.length} extra files found!\n${unexpected.join('\n')}`);

  }

}
