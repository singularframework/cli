import { Argumental } from 'argumental/dist/types';
import app from 'argumental';
import path from 'path';
import fs from 'fs-extra';
import { exit } from './exit';
import { SgData } from './models';

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
export const projectGuard: Argumental.EventHandler<Argumental.EventData<any>> = (data) => {

  // Skip guard if immediate option --help was provided
  if ( data.opts.help ) return;

  if ( ! app.data<SgData>().singular ) exit('Could not locate Singular project!');

};
