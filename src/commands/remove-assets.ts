import app from 'argumental';
import { saveSingularJson, projectGuard } from '../lib/events';
import { SgData } from '../lib/models';
import ora from 'ora';
import chalk from 'chalk';

app
.command('remove assets', 'removes previously registered asset paths')
.alias('r a')

.argument('<...paths>', 'a list of paths to an asset file or directory, relative to "src"')

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

      ora().stopAndPersist({
        text: `Path ${chalk.yellow(path)} is not registered!`,
        symbol: chalk.yellow('!')
      });

    }

  }

  ora().succeed('Assets are removed');

})

.on('actions:after', saveSingularJson);
