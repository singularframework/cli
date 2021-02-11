import app from 'argumental';
import chalk from 'chalk';
import path from 'path';
import { SgData } from '../lib/models';
import { projectGuard } from '../lib/events';

const logo =
`
       _____ _                   __
      / ___/(_)___  ____ ___  __/ /___ ______
      \\__ \\/ / __ \\/ __ \`/ / / / / __ \`/ ___/
     ___/ / / / / / /_/ / /_/ / / /_/ / /
    /____/_/_/ /_/\\__, /\\__,_/_/\\__,_/_/
                 /____/________    ____
                      / ____/ /   /  _/
                     / /   / /    / /
                    / /___/ /____/ /
                    \\____/_____/___/
`;

const separator =  `-------------------------------------------------`;

function resolveVersion(version: string): string {

  if ( ! version ) return chalk.dim('Not Installed');

  return chalk.magenta(version.match(/(?<version>\d.+)$/).groups.version);

}

app
.command('info', 'displays project info')

.on('actions:before', projectGuard)

.action(async () => {

  const data = app.data<SgData>();
  const packageJson = require(path.join(data.projectRoot, 'package.json'));

  console.log(chalk.blueBright.bold(logo));
  console.log();
  console.log(chalk.bold(`Global CLI Version:        `), resolveVersion(data.version));
  console.log(chalk.dim(separator));
  console.log(chalk.bold(`Singular Core Module:      `), resolveVersion(packageJson.dependencies['@singular/core']));
  console.log(chalk.bold(`Singular Validators Module:`), resolveVersion(packageJson.dependencies['@singular/validators']));
  console.log(chalk.bold(`Singular Pipes Module:     `), resolveVersion(packageJson.dependencies['@singular/pipes']));
  console.log(chalk.dim(separator));
  console.log(chalk.bold(`Project Name:              `), chalk.greenBright(data.singular.project.name));
  console.log(chalk.bold(`Project Structure:         `), data.singular.project.flat ? 'Flat' : 'Default');
  console.log(chalk.bold(`Project CLI Version:       `), resolveVersion(data.singular.cli));
  console.log(chalk.bold(`Using Local CLI:           `), data.singular.useLocal ? 'Yes' : chalk.dim('No'));
  console.log(chalk.bold(`Tests Setup:               `), data.singular.project.tests ? 'Yes' : chalk.dim('No'));
  console.log(chalk.bold(`Docs Setup:                `), data.singular.project.docs ? 'Yes': chalk.dim('No'));
  console.log(chalk.bold(`Registered Assets:         `), chalk.yellow(data.singular.project?.assets?.length ?? 0));
  console.log();

});
