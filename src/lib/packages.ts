import path from 'path';
import fs from 'fs-extra';

/** Returns the version of an installed package. */
export async function getInstalledVersion(projectRoot: string, name: string): Promise<string> {

  try {

    return (await fs.readJson(path.join(projectRoot, 'node_modules', ...name.split('/'), 'package.json'))).version || null;

  }
  catch (error) {

    return null;

  }

}
