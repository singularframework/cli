import app from 'argumental';
import _ from 'lodash';
import path from 'path';
import { pathDoesntExist } from '../lib/validators';
import { projectGuard } from '../lib/events';
import { generateComponent } from '../lib/components';
import { SgData } from '../lib/models';

app
.command('generate router', 'generates a new router')
.alias('g r')

.argument('<name>', 'router name')
// To kebab case
.sanitize(value => _.kebabCase(value.trim()))
// File shouldn't already exist
.validate(value => {

  return pathDoesntExist(
    path.resolve(process.cwd(), 'src', app.data<SgData>()?.singular.project.flat ? '.' : 'routers'),
    '.router.ts'
  )(value);

})

// Operation can only be performed in a Singular project
.on('validators:before', projectGuard)

.action(async args => {

  await generateComponent('router', args.name);

});
