import app from 'argumental';
import _ from 'lodash';
import path from 'path';
import { pathDoesntExist } from '../common/validators';
import { loadSingularJson } from '../common/events';
import { generateComponent } from '../common/components';
import { SgData } from '../common/models';

app
.command('generate service', 'generates a new service')
.alias('g s')

.argument('<name>', 'service name')
// To kebab case
.sanitize(value => _.kebabCase(value.trim()))
// File shouldn't already exist
.validate(value => {

  return pathDoesntExist(
    path.resolve(process.cwd(), 'src', app.data<SgData>()?.singular.project.flat ? '.' : 'services'),
    '.service.ts'
  )(value);

})

// Find and load singular.json
.on('validators:before', loadSingularJson)

.action(async args => {

  await generateComponent('service', args.name);

});
