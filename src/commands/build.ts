import app from 'argumental';
import { SgData } from '../common/models';
import { loadSingularJson, projectGuard } from '../common/events';
import { build } from '../common/build';

app
.command('build', 'builds the server')
.alias('b')

.option('-m --minify', 'minifies the build')

// Find and load singular.json
.on('validators:before', loadSingularJson)
// Operation can only be performed in a Singular project
.on('actions:before', projectGuard)

.actionDestruct(async ({ opts }) => {

  await build(app.data<SgData>(), opts.minify);

});
