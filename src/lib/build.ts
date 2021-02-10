import path from 'path';
import fs from 'fs-extra';
import terser from 'terser';
import glob from 'glob';
import Spinner from './spinner';
import chalk from 'chalk';
import { spawn } from './child-process';
import { SgData } from './models';

/** Builds the source code into dist. */
export async function build(singularData: SgData, minify?: boolean, standalone?: boolean, profile?: string) {

  const spinner = new Spinner();

  // Clean up
  spinner.start('Cleaning up');

  await fs.remove(path.join(singularData.projectRoot, 'dist'));

  spinner.succeed();

  // Build the source code
  spinner.start('Building the server');

  const child = spawn(
    'node',
    [
      path.join('.', 'node_modules', 'typescript', 'bin', 'tsc'),
      '-p',
      path.join('.', 'src', 'tsconfig.json')
    ],
    {
      windowsHide: true,
      cwd: singularData.projectRoot,
      stdio: ['ignore', 'ignore', 'pipe']
    }
  );

  const stderrCache: string[] = [];
  child.ref.stderr.on('data', data => stderrCache.push(chalk.redBright(data)));

  const results = await child.promise;

  if ( results.code !== 0 ) {

    spinner.fail(chalk.redBright('Build failed!'));
    console.error(stderrCache.join('\n'));

    process.exit(1);

  }

  spinner.succeed();

  // Copy the assets
  if ( singularData.singular.project.assets && singularData.singular.project.assets.length ) {

    spinner.start('Copying assets');

    for ( const asset of singularData.singular.project.assets ) {

      await fs.copy(
        path.resolve(singularData.projectRoot, 'src', asset),
        path.resolve(singularData.projectRoot, 'dist', asset)
      );

    }

    spinner.succeed();

  }

  // Force config profile if asked
  if ( profile ) {

    spinner.start(`Forcing config profile "${profile}"`);

    // Edit main.ts (before minification)
    const main = await fs.readFile(path.join(singularData.projectRoot, 'dist', 'main.js'), { encoding: 'utf-8' });
    const match = main.match(/^(?<before>.+Singular\s+.*\.launch\()(?<profile>.*?)(?<after>\).+)$/s);

    if ( ! match ) {

      spinner.fail();
      spinner.warn(`Could not update "${path.join('dist', 'main.js')}"!`);

    }
    else {

      // Update main.js
      await fs.writeFile(
        path.join(singularData.projectRoot, 'dist', 'main.js'),
        match.groups.before + `'${profile}'` + match.groups.after
      );

      spinner.succeed();

    }

  }

  // Make standalone if asked
  if ( standalone ) {

    spinner.start('Making build standalone');

    // Load package.json
    const packageJson = await fs.readJson(path.join(singularData.projectRoot, 'package.json'));
    // Create new package.json
    const standalonePackageJson = {
      name: packageJson.name,
      version: packageJson.version,
      main: 'main.js',
      dependencies: packageJson.dependencies
    };

    // Write new package.json
    await fs.writeJson(path.join(singularData.projectRoot, 'dist', 'package.json'), standalonePackageJson, { spaces: 2 });

    // Write .gitignore
    await fs.writeFile(path.join(singularData.projectRoot, 'dist', '.gitignore'), 'node_modules');

    spinner.succeed();

  }

  // Minify if asked
  if ( minify ) {

    spinner.start('Minifying the build');

    // Scan for all .js files inside dist directory
    const jsFiles = glob.sync('**/*.js', { cwd: path.resolve(singularData.projectRoot, 'dist') });

    // Minify each file
    for ( const file of jsFiles ) {

      const filepath = path.resolve(singularData.projectRoot, 'dist', file);
      const code = await fs.readFile(filepath, { encoding: 'utf-8' });
      const results = await terser.minify(code, {
        sourceMap: { content: 'inline', url: 'inline' },
        mangle: { toplevel: true },
        ecma: 2018
      });

      await fs.writeFile(filepath, results.code);

    }

    // Scan for all .json files inside dist directory
    const jsonFiles = glob.sync('**/*.json', { cwd: path.resolve(singularData.projectRoot, 'dist') });

    // Minify each file
    for ( const file of jsonFiles ) {

      const filepath = path.resolve(singularData.projectRoot, 'dist', file);
      let data = await fs.readJson(filepath, { encoding: 'utf-8' });

      // Further minify tsconfig.json
      if ( file === 'tsconfig.json' ) {

        data = { compilerOptions: { paths: data.compilerOptions.paths } };

      }

      await fs.writeJson(filepath, data);

    }

    spinner.succeed();

  }

  spinner.succeed('Build successfull')

}
