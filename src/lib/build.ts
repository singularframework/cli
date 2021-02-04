import path from 'path';
import fs from 'fs-extra';
import terser from 'terser';
import glob from 'glob';
import ora from 'ora';
import chalk from 'chalk';
import { spawn } from './child-process';
import { SgData } from './models';

/** Builds the source code into dist. */
export async function build(singularData: SgData, minify?: boolean) {

  const spinner = ora();

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
