import app from 'argumental';
import chokidar from 'chokidar';
import { projectGuard } from '../lib/events';
import { SgData } from '../lib/models';
import { Server } from '../lib/server';
import Spinner from '../lib/spinner';

app
.command('serve', 'runs the server')
.alias('s')

.option('-p --profile <config_profile>', 'sets the server config profile')
.validate(app.STRING)
.option('--skip-build', 'skips building the server')
.option('-w --watch', 'enables hot reloading')

// Operation can only be performed in a Singular project (only when --skip-build is not provided)
.on('actions:before', data => {

  if ( ! data.opts.skipBuild ) return projectGuard(data);

})

.actionDestruct(async ({ opts }) => {

  // Set config profile (if provided)
  process.env.SINGULAR_CONFIG_PROFILE = opts.profile ?? process.env.SINGULAR_CONFIG_PROFILE;

  // Create server
  const server = new Server();

  // Build the server if asked
  if ( ! opts.skipBuild ) await server.build(app.data<SgData>());

  // Launch the server
  server.launch();

  // If hot reloading requested
  if ( opts.watch ) {

    let watcher: chokidar.FSWatcher;

    // If rebuilds are not requested
    if ( opts.skipBuild ) {

      // If inside Singular project, watch dist directory
      if ( app.data<SgData>().singular ) {

        watcher = chokidar.watch('dist', {
          cwd: app.data<SgData>().projectRoot,
          // Ignore dot files (e.g. .logs)
          ignored: /(^|[\/\\])\../,
          ignoreInitial: true
        });

      }
      // Otherwise, watch the current directory
      else {

        watcher = chokidar.watch('.', {
          cwd: process.cwd(),
          // Ignore dot files (e.g. .logs)
          ignored: /(^|[\/\\])\../,
          ignoreInitial: true
        });

      }

    }
    // If source must be rebuilt on changes
    else {

      watcher = chokidar.watch([
        'src',
        'singular.json'
      ], {
        cwd: app.data<SgData>().projectRoot,
        ignoreInitial: true
      });

    }

    // On changes, trigger hot reloading
    watcher
    .on('add', () => server.reload(! opts.skipBuild))
    .on('change', () => server.reload(! opts.skipBuild))
    .on('unlink', () => server.reload(! opts.skipBuild));

    new Spinner().info('Hot reloading enabled');

  }

});
