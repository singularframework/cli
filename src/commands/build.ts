import app from 'argumental';
import { SgData } from '../lib/models';
import { projectGuard } from '../lib/events';
import { build } from '../lib/build';

app
.command('build', 'builds the server')
.alias('b')

.option('-m --minify', 'minifies the build')
.option('-s --standalone', 'makes the build a standalone package')
.option('-p --profile <config_profile>', 'forces a config profile to be used in the build')
.validate(app.STRING)
.option('--prod', 'shorthand for "-p prod -s -m" (overrides -p)')

// Operation can only be performed in a Singular project
.on('actions:before', projectGuard)

.actionDestruct(async ({ opts }) => {

  await build(app.data<SgData>(), opts.prod || opts.minify, opts.prod || opts.standalone, opts.prod ? 'prod' : opts.profile);

});
