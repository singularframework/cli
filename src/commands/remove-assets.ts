import app from 'argumental';
import { loadSingularJson, saveSingularJson, projectGuard } from '../lib/events';
import { SgData } from '../lib/models';
import ora from 'ora';
import chalk from 'chalk';

app
.command('remove assets', 'removes previously registered asset paths')
.alias('r a')

.argument('<...paths>', 'a list of paths to an asset file or directory, relative to "src"')

// Find and load singular.json
.on('validators:before', loadSingularJson)
// Operation can only be performed in a Singular project
.on('actions:before', projectGuard)

.action(async args => {

  if ( ! app.data<SgData>().singular.project.assets )
    app.data<SgData>().singular.project.assets = [];

  for ( const path of args.paths ) {

    const index = app.data<SgData>().singular.project.assets.indexOf(path);

    if ( index > -1 ) {

      app.data<SgData>().singular.project.assets.splice(index, 1);

    }
    else {

      ora().warn(`Path ${chalk.yellow(path)} is not registered!`);

    }

  }

  ora().succeed('Assets are removed');

})

.on('actions:after', saveSingularJson);
