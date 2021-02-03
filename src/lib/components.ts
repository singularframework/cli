import app from 'argumental';
import path from 'path';
import fs from 'fs-extra';
import mustache from 'mustache';
import _ from 'lodash';
import ora from 'ora';
import chalk from 'chalk';

import { SgData } from './models';

export async function generateComponent(type: 'service'|'router'|'interceptor'|'plugin', name: string) {

  const spinner = ora().start('Generating component');

  const template = await fs.readFile(
    path.resolve(__dirname, '..', '..', 'template', 'components', `${type}.ts.mustache`),
    { encoding: 'utf-8' }
  );
  const service = mustache.render(template, {
    componentName: name,
    componentNameCamelCased: _.camelCase(name)
  });
  const filepath = path.resolve(
    // Project root (detected by singular.json)
    app.data<SgData>().projectRoot,
    // Codebase directory
    'src',
    // Parent directory (based on singular.flat)
    app.data<SgData>().singular.project.flat ? '.' : `${type}s`,
    // Filename
    `${name}.${type}.ts`
  );

  // If not flat, ensure directory
  if ( ! app.data<SgData>().singular.project.flat ) {

    await fs.ensureDir(path.parse(filepath).dir);

  }

  await fs.writeFile(filepath, service);

  spinner.succeed(`Generated ${type} ${chalk.blueBright(name)} at ${chalk.yellow(filepath)}`);

}
