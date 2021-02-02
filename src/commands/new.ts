import app from 'argumental';
import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import { spawn } from '../common/child-process';
import mustache from 'mustache';
import { pathDoesntExist } from '../common/validators';
import { SgData } from '../common/models';

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
.option('--skip-npm', 'avoids configuring npm and installing dependencies')
.option('--flat', 'configures the project to use a flat file structure')

.action(async (args, opts) => {

  // Create project directory
  console.log(`Creating project directory...`);

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

  // Generate src
  console.log('Scaffolding project...');

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

  // Create tsconfig.json
  console.log('Configuring TypeScript...');

  const tsconfigTemplate = await fs.readFile(
    path.resolve(__dirname, '..', '..', 'template', 'src', 'tsconfig.json.mustache'),
    { encoding: 'utf-8' }
  );
  const tsconfig = mustache.render(tsconfigTemplate, {
    projectName: args.name,
    servicePathPrefix: opts.flat ? '' : 'services/'
  });

  await fs.writeFile(path.resolve(process.cwd(), args.name, 'src', 'tsconfig.json'), tsconfig);

  // Initialize npm
  if ( ! opts.skipNpm ) {

    console.log('Configuring npm...');

    // Generate package.json
    const template = await fs.readFile(path.resolve(__dirname, '..', '..', 'template', 'package.json.mustache'), { encoding: 'utf-8' });
    const packageJson = mustache.render(template, {
      projectName: args.name,
      testDependencies: ! opts.skipTests,
      docsScript: ! opts.skipDocs,
      docsDependencies: ! opts.skipDocs
    });

    await fs.writeFile(path.resolve(process.cwd(), args.name, 'package.json'), packageJson);

    // npm install
    const response = await spawn('npm', ['install'], {
      windowsHide: true,
      cwd: path.join(process.cwd(), args.name),
      stdio: 'inherit'
    });

    if ( response.code !== 0 ) throw new Error(`Could not create project due to an error!`);

  }

  // Initialize git
  if ( ! opts.skipGit ) {

    console.log(`Configuring git...`);

    // git init
    const initResponse = await spawn('git', ['init'], {
      windowsHide: true,
      cwd: path.join(process.cwd(), args.name),
      stdio: 'inherit'
    });

    if ( initResponse.code !== 0 ) throw new Error(`Could not create project due to an error!`);

    // Generate .gitignore
    const template = await fs.readFile(path.resolve(__dirname, '..', '..', 'template', '.gitignore.mustache'), { encoding: 'utf-8' });
    const gitignore = mustache.render(template, { docsIgnore: ! opts.skipDocs });

    await fs.writeFile(path.resolve(process.cwd(), args.name, '.gitignore'), gitignore);

    // Commit
    const addResponse = await spawn('git', ['add', '.'], {
      windowsHide: true,
      cwd: path.join(process.cwd(), args.name),
      stdio: 'inherit'
    });

    if ( addResponse.code !== 0 ) throw new Error(`Could not create project due to an error!`);

    const commitResponse = await spawn('git', ['commit', '-m', '"Singular commit"'], {
      windowsHide: true,
      cwd: path.join(process.cwd(), args.name),
      stdio: 'inherit'
    });

    if ( commitResponse.code !== 0 ) throw new Error(`Could not create project due to an error!`);

  }

  console.log('Done!');

});
