import { Argumental } from 'argumental/dist/types';
import app from 'argumental';
import path from 'path';
import fs from 'fs-extra';
import { exit } from './exit';
import { SgData } from './models';

/** Looks for singular.json file in the current working directory.
  * If not found, will traverse backwards one directory level at a time until reaching root directory or finding the file.
  * If file is found, the content is loaded into app data's `singular` node, otherwise it would be `null`. */
export const loadSingularJson: Argumental.EventHandler<Argumental.EventData<any>> = async () => {

  let currentDir = process.cwd();
  let found = false;

  while ( ! found ) {

    // Look for singular.json
    if ( await fs.pathExists(path.resolve(currentDir, 'singular.json')) ) {

      app.data<SgData>().singular = await fs.readJson(path.resolve(currentDir, 'singular.json'));
      app.data<SgData>().projectRoot = currentDir;
      found = true;

    }
    // If reached root directory
    else if ( path.parse(process.cwd()).root === currentDir ) {

      app.data<SgData>().singular = null;
      app.data<SgData>().projectRoot = null;
      found = true;

    }
    // Traverse back one directory
    else {

      currentDir = path.resolve(currentDir, '..');

    }

  }

};

/** Saves the `singular` node from app data (if not `null`) into singular.json file. */
export const saveSingularJson: Argumental.EventHandler<Argumental.EventData<any>> = async () => {

  if ( ! app.data<SgData>().singular ) return;

  await fs.writeJson(
    path.resolve(app.data<SgData>().projectRoot, 'singular.json'),
    app.data<SgData>().singular,
    { spaces: 2 }
  );

};

/** Guards against non-present singular.json. */
export const projectGuard: Argumental.EventHandler<Argumental.EventData<any>> = () => {

  if ( ! app.data<SgData>().singular ) exit('Could not locate Singular project!');

};
