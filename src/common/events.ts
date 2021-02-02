import { Argumental } from 'argumental/dist/types';
import app from 'argumental';
import { SgData } from './models';
import path from 'path';
import fs from 'fs-extra';

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
