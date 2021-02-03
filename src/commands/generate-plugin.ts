import app from 'argumental';
import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import chalk from 'chalk';
import { pathDoesntExist } from '../lib/validators';
import { projectGuard } from '../lib/events';
import { generateComponent } from '../lib/components';
import { SgData } from '../lib/models';

app
.command('generate plugin', 'generates a new plugin')
.alias('g p')

.argument('<name>', 'plugin name')
// To kebab case
.sanitize(value => _.kebabCase(value.trim()))
// File shouldn't already exist
.validate(value => {

  return pathDoesntExist(
    path.resolve(process.cwd(), 'src', app.data<SgData>()?.singular.project.flat ? '.' : 'plugins'),
    '.plugin.ts'
  )(value);

})

// Operation can only be performed in a Singular project
.on('validators:before', projectGuard)

.action(async args => {

  await generateComponent('plugin', args.name);

  // Update src/main.ts
  const main = await fs.readFile(path.resolve(app.data<SgData>().projectRoot, 'src', 'main.ts'), { encoding: 'utf-8' });
  const pluginPath = `./${app.data<SgData>().singular.project.flat ? '' : 'plugins/'}${args.name}.plugin`;
  const pluginClassName = _.camelCase(args.name) + 'Plugin';
  const pluginImportSyntax = `\nimport { ${pluginClassName} } from '${pluginPath}';`;
  const pluginInstallSyntax = `.install(${pluginClassName})\n`;
  const updatedMain= main
  .replace(
    /^(.*import[^;]+?from[^;]+?;(?!.*import))(.*Singular[^;]*)(\.launch\(\).*)/s,
    `$1${pluginImportSyntax}$2${pluginInstallSyntax}$3`
  );

  // If regex failed
  if ( main === updatedMain ) {

    ora().stopAndPersist({
      text: chalk.yellow(`Could not update "${path.join('src', 'main.ts')}"! Plugin must be manually installed.`),
      symbol: chalk.yellow('!')
    });

  }

  await fs.writeFile(
    path.resolve(app.data<SgData>().projectRoot, 'src', 'main.ts'),
    updatedMain
  );

});
