import app from 'argumental';
import path from 'path';
import fs from 'fs-extra';
import http from 'http';
import { spawn } from '../lib/child-process';
import { loadSingularJson, projectGuard } from '../lib/events';
import { SgData } from '../lib/models';
import ora from 'ora';
import chalk from 'chalk';

app
.command('docs', 'builds the TypeDoc documentation from source code')

.option('-s --serve', 'serves the documentation')
.option('-p --port <number>', 'specifies the port number to serve the documentation on')
.validate(app.NUMBER)
.default(6001)

// Find and load singular.json
.on('validators:before', loadSingularJson)
// Operation can only be performed in a Singular project
.on('actions:before', projectGuard)

.actionDestruct(async ({ opts }) => {

  const spinner = ora().start();

  // If docs is disabled
  if ( ! app.data<SgData>().singular.project.docs ) {

    spinner.fail('TypeDoc is disabled on this project!');
    return;

  }

  // Clean up
  spinner.text = 'Cleaning up';

  await fs.remove(path.resolve(app.data<SgData>().projectRoot, 'docs'));

  // Build the documentation
  spinner.text = 'Building the documentation';

  const child = spawn(
    // Syntax: node <path_to_typedoc> --out <path_to_docs_dir> <path_to_src_dir>
    'node',
    [
      path.join('..', 'node_modules', 'typedoc', 'bin', 'typedoc'),
      '--out',
      path.join('..', 'docs'),
      '.'
    ],
    {
      windowsHide: true,
      cwd: path.join(app.data<SgData>().projectRoot, 'src'),
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

  spinner.succeed('Documentation was built');

  // Serve if asked
  if ( ! opts.serve ) return;

  spinner.start('Serving the documentation')

  http.createServer((req, res) => {

    fs.readFile(path.join(app.data<SgData>().projectRoot, 'docs', req.url === '/' ? '/index.html' : req.url), (error, data) => {

      if ( error ) {

        res.writeHead(404);
        res.end(JSON.stringify(error));

        return;

      }

      res.writeHead(200);
      res.end(data);

    });

  })
  .listen(opts.port)
  .on('listening', () => {

    spinner.succeed(`Documentation is being served on ${chalk.blueBright('localhost')}:${chalk.yellow(opts.port)}`);

  });

});
