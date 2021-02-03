import app from 'argumental';
import { SgData } from '../lib/models';
import { projectGuard } from '../lib/events';
import { build } from '../lib/build';

app
.command('build', 'builds the server')
.alias('b')

.option('-m --minify', 'minifies the build')

// Operation can only be performed in a Singular project
.on('actions:before', projectGuard)

.actionDestruct(async ({ opts }) => {

  await build(app.data<SgData>(), opts.minify);

});
