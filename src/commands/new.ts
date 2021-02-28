import app from 'argumental';
import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { spawn } from '../lib/child-process';
import mustache from 'mustache';
import { pathDoesntExist } from '../lib/validators';
import { SgData } from '../lib/models';
import Spinner from '../lib/spinner';
import chalk from 'chalk';
import glob from 'glob';

app
.command('new', 'creates a new Singular project')
.alias('n')

.argument('<name>', 'project name')
// To kebab case
.sanitize(value => _.kebabCase(value.trim()))
// Directory shouldn't already exist
.validate(pathDoesntExist(process.cwd()))

.option('--skip-tests', 'avoids configuring unit tests')
.option('--skip-docs', 'avoids configuring TypeDoc')
.option('--skip-git', 'avoids creating a git repository')
.option('--skip-npm', 'avoids installing npm dependencies')
.option('--flat', 'configures the project to use a flat file structure')

.action(async (args, opts) => {

  const spinner = new Spinner().start();

  // Create project directory
  spinner.text = `Creating project directory`;

  await fs.ensureDir(path.resolve(process.cwd(), args.name));

  // Generate singular.json
  await fs.writeJson(path.resolve(process.cwd(), args.name, 'singular.json'), {
    cli: app.data<SgData>().version,
    project: {
      name: args.name,
      tests: ! opts.skipTests,
      docs: ! opts.skipDocs,
      flat: opts.flat,
      assets: []
    }
  }, { spaces: 2 });

  spinner.succeed();

  // Generate src
  spinner.start('Scaffolding project');

  await fs.ensureDir(path.resolve(process.cwd(), args.name, 'src'));
  await fs.copyFile(
    path.resolve(__dirname, '..', '..', 'template', 'src', 'main.ts.mustache'),
    path.resolve(process.cwd(), args.name, 'src', 'main.ts')
  );
  await fs.copyFile(
    path.resolve(__dirname, '..', '..', 'template', 'src', 'server.config.ts.mustache'),
    path.resolve(process.cwd(), args.name, 'src', 'server.config.ts')
  );
  await fs.copyFile(
    path.resolve(__dirname, '..', '..', 'template', 'README.md.mustache'),
    path.resolve(process.cwd(), args.name, 'README.md')
  );

  // Generate package.json
  const template = await fs.readFile(path.resolve(__dirname, '..', '..', 'template', 'package.json.mustache'), { encoding: 'utf-8' });
  const packageJson = mustache.render(template, {
    projectName: args.name,
    testDependencies: ! opts.skipTests,
    docsScript: ! opts.skipDocs,
    docsDependencies: ! opts.skipDocs
  });

  await fs.writeFile(path.resolve(process.cwd(), args.name, 'package.json'), packageJson);

  spinner.succeed();

  // Create tsconfig.json
  spinner.start('Configuring TypeScript');

  const tsconfigTemplate = await fs.readFile(
    path.resolve(__dirname, '..', '..', 'template', 'src', 'tsconfig.json.mustache'),
    { encoding: 'utf-8' }
  );
  const tsconfig = mustache.render(tsconfigTemplate, {
    projectName: args.name,
    servicePathPrefix: opts.flat ? '' : 'services/',
    routerPathPrefix: opts.flat ? '' : 'routers/',
    interceptorPathPrefix: opts.flat ? '' : 'interceptors/',
    pluginPathPrefix: opts.flat ? '' : 'plugins/'
  });

  await fs.writeFile(path.resolve(process.cwd(), args.name, 'src', 'tsconfig.json'), tsconfig);

  spinner.succeed();

  // Setup tests
  if ( ! opts.skipTests ) {

    spinner.start('Setting up tests');

    // Scan all .mustache files in template/test
    const files = glob.sync('**/*.mustache', { cwd: path.resolve(__dirname, '..', '..', 'template', 'test'), dot: true });

    // Copy all files
    for ( const file of files ) {

      await fs.copy(
        path.resolve(__dirname, '..', '..', 'template', 'test', file),
        path.resolve(process.cwd(), args.name, 'test', file.replace('.mustache', ''))
      );

    }

    spinner.succeed();

  }

  // Initialize npm
  if ( ! opts.skipNpm ) {

    // npm install
    spinner.start('Installing dependencies');

    const child = spawn('npm', ['install'], {
      windowsHide: true,
      cwd: path.join(process.cwd(), args.name),
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
      cwd: path.join(process.cwd(), args.name),
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
    const template = await fs.readFile(path.resolve(__dirname, '..', '..', 'template', '.gitignore.mustache'), { encoding: 'utf-8' });
    const gitignore = mustache.render(template, { docsIgnore: ! opts.skipDocs });

    await fs.writeFile(path.resolve(process.cwd(), args.name, '.gitignore'), gitignore);

    // Commit
    const addChild = spawn('git', ['add', '.'], {
      windowsHide: true,
      cwd: path.join(process.cwd(), args.name),
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
      cwd: path.join(process.cwd(), args.name),
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

  spinner.succeed(`Project ${chalk.blueBright(args.name)} was created`);

});
