import app from 'argumental';
import path from 'path';
import { loadSingularJson, saveSingularJson, projectGuard } from '../common/events';
import { SgData } from '../common/models';

app
.command('add assets', 'registers paths as assets to be copied during builds')
.alias('a a')

.argument('<...paths>', 'a list of paths to an asset file or directory, relative to "src"')
// Asset must exist
.validate((values, ...rest) => {

  for ( const value of values ) {

    app.FILE_PATH(path.resolve(app.data<SgData>().projectRoot, 'src', value), ...rest);

  }

})

// Find and load singular.json
.on('validators:before', loadSingularJson)
// Operation can only be performed in a Singular project
.on('validators:before', projectGuard)

.action(async args => {

  if ( ! app.data<SgData>().singular.project.assets )
    app.data<SgData>().singular.project.assets = [];

  app.data<SgData>().singular.project.assets = app.data<SgData>().singular.project.assets
  .concat(...args.paths.filter((path: string) => ! app.data<SgData>().singular.project.assets.includes(path)));

  console.log('Assets are registered');

})

.on('actions:after', saveSingularJson);
