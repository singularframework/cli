import app from 'argumental';
import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import Spinner from '../lib/spinner';
import chalk from 'chalk';
import mustache from 'mustache';
import { pathDoesntExist } from '../lib/validators';
import { projectGuard, reverseProjectGuard } from '../lib/events';
import { generateComponent } from '../lib/components';
import { spawn } from '../lib/child-process';
import { SgData } from '../lib/models';

app
.command('generate plugin', 'generates a new plugin')
.alias('g p')

.argument('<name>', 'plugin name')
// To kebab case
.sanitize(value => _.kebabCase(value.trim()))
// File shouldn't already exist (if local plugin)
.validate(value => {

  if ( app.data<SgData>().singular ) return pathDoesntExist(
    path.resolve(process.cwd(), 'src', app.data<SgData>()?.singular.project.flat ? '.' : 'plugins'),
    '.plugin.ts'
  )(value);

})
// Directory shouldn't already exist (if plugin package)
.validate(value => {

  if ( ! app.data<SgData>().singular ) return pathDoesntExist(process.cwd())(`singular-plugin-${value}`);

})

.option('-p --package', 'generates a plugin package that can be installed through npm')
.option('--skip-git', 'avoids creating a git repository (only when creating a plugin package)')
.option('--skip-npm', 'avoids installing npm dependencies (only when creating a plugin package)')

// Operation can only be performed in a Singular project
// Unless --package is provided where the exact opposite is true
.on('validators:before', data => {

  if ( ! data.opts.package ) return projectGuard(data);
  else return reverseProjectGuard(data);

})

// Will only run for local plugin
.actionDestruct(async ({ args, opts, suspend }) => {

  // Skip action handler if --package is provided
  if ( opts.package ) return;

  await generateComponent('plugin', args.name);

  // Update src/main.ts
  const main = await fs.readFile(path.resolve(app.data<SgData>().projectRoot, 'src', 'main.ts'), { encoding: 'utf-8' });
  const pluginPath = `./${app.data<SgData>().singular.project.flat ? '' : 'plugins/'}${args.name}.plugin`;
  const pluginClassName = _.flow(_.camelCase, _.upperFirst)(args.name) + 'Plugin';
  const pluginImportSyntax = `\nimport { ${pluginClassName} } from '${pluginPath}';`;
  const pluginInstallSyntax = `.install(${pluginClassName})\n`;
  const updatedMain = main
  .replace(
    /^(.*import[^;]+?from[^;]+?;(?!.*import))(.*Singular[^;]*)(\.launch\(.*?\).*)/s,
    `$1${pluginImportSyntax}$2${pluginInstallSyntax}$3`
  );

  // If regex failed
  if ( main === updatedMain ) {

    new Spinner().warn(chalk.yellow(`Could not update "${path.join('src', 'main.ts')}"! Plugin must be manually installed.`));

  }

  await fs.writeFile(
    path.resolve(app.data<SgData>().projectRoot, 'src', 'main.ts'),
    updatedMain
  );

  // Skip next action handler
  suspend();

})
// Will only run for plugin package
.action(async (args, opts) => {

  const spinner = new Spinner().start('Scaffolding plugin package');

  // Setup project
  await fs.mkdirp(path.resolve(process.cwd(), `singular-plugin-${args.name}`));
  await fs.copy(
    path.resolve(__dirname, '..', '..', 'template', 'plugin-package', 'tsconfig.json.mustache'),
    path.resolve(process.cwd(), `singular-plugin-${args.name}`, 'tsconfig.json')
  );

  // Write package.json
  await fs.writeFile(
    path.resolve(process.cwd(), `singular-plugin-${args.name}`, 'package.json'),
    mustache.render(
      await fs.readFile(
        path.resolve(__dirname, '..', '..', 'template', 'plugin-package', 'package.json.mustache'),
        { encoding: 'utf-8' }
      ),
      { componentName: args.name }
    )
  );

  // Write plugin.ts
  await fs.writeFile(
    path.resolve(process.cwd(), `singular-plugin-${args.name}`, 'plugin.ts'),
    mustache.render(
      await fs.readFile(
        path.resolve(__dirname, '..', '..', 'template', 'components', 'plugin.ts.mustache'),
        { encoding: 'utf-8' }
      ),
      {
        componentName: args.name,
        componentNamePascalCased: _.flow(_.camelCase, _.upperFirst)(args.name)
      }
    )
  );

  spinner.succeed();

  // Initialize npm
  if ( ! opts.skipNpm ) {

    // npm install
    spinner.start('Installing dependencies');

    const child = spawn('npm', ['install'], {
      windowsHide: true,
      cwd: path.join(process.cwd(), `singular-plugin-${args.name}`),
      stdio: ['ignore', 'ignore', 'pipe']
    });

    const stderrCache: string[] = [];
    child.ref.stderr.on('data', data => stderrCache.push(chalk.redBright(data)));

    const results = await child.promise;

    if ( results.code !== 0 ) {

      spinner.fail(chalk.redBright('Could not create project due to an error!'));
      console.error(stderrCache.join('\n'));

      process.exit(1);

    }

    spinner.succeed();

  }

  // Initialize git
  if ( ! opts.skipGit ) {

    spinner.start(`Configuring git`);

    // git init
    const initChild = spawn('git', ['init'], {
      windowsHide: true,
      cwd: path.join(process.cwd(), `singular-plugin-${args.name}`),
      stdio: ['ignore', 'ignore', 'pipe']
    });

    const initStderrCache: string[] = [];
    initChild.ref.stderr.on('data', data => initStderrCache.push(chalk.redBright(data)));

    const initResults = await initChild.promise;

    if ( initResults.code !== 0 ) {

      spinner.fail(chalk.redBright('Could not create project due to an error!'));
      console.error(initStderrCache.join('\n'));

      process.exit(1);

    }

    // Generate .gitignore
    await fs.copy(
      path.join(__dirname, '..', '..', 'template', 'plugin-package', '.gitignore.mustache'),
      path.join(process.cwd(), `singular-plugin-${args.name}`, '.gitignore')
    );

    // Commit
    const addChild = spawn('git', ['add', '.'], {
      windowsHide: true,
      cwd: path.join(process.cwd(), `singular-plugin-${args.name}`),
      stdio: ['ignore', 'ignore', 'pipe']
    });

    const addStderrCache: string[] = [];
    addChild.ref.stderr.on('data', data => addStderrCache.push(chalk.redBright(data)));

    const addResults = await addChild.promise;

    if ( addResults.code !== 0 ) {

      spinner.fail(chalk.redBright('Could not create project due to an error!'));
      console.error(addStderrCache.join('\n'));
      process.exit(1);

    }

    const commitChild = spawn('git', ['commit', '-m', '"Singular commit"'], {
      windowsHide: true,
      cwd: path.join(process.cwd(), `singular-plugin-${args.name}`),
      stdio: ['ignore', 'ignore', 'pipe']
    });

    const commitStderrCache: string[] = [];
    commitChild.ref.stderr.on('data', data => commitStderrCache.push(chalk.redBright(data)));

    const commitResults = await commitChild.promise;

    if ( commitResults.code !== 0 ) {

      spinner.fail(chalk.redBright('Could not create project due to an error!'));
      console.error(commitStderrCache.join('\n'));
      process.exit(1);

    }

    spinner.succeed();

  }

  spinner.succeed(`Plugin package ${chalk.blueBright(`singular-plugin-${args.name}`)} was created`);

});
