import app from 'argumental';
import { ChildProcess, spawn } from './child-process';
import path from 'path';
import fs from 'fs-extra';
import kill from 'tree-kill';
import { build } from './build';
import { SgData } from './models';

export class Server {

  private _instance: ChildProcess;
  private _reloading: boolean = false;
  private _needsNewReload: boolean = false;

  get build() { return build; }

  kill(): Promise<void> {

    return new Promise((resolve, reject) => {

      // Kill previous server if any
      if ( this._instance && ! this._instance.killed ) {

        kill(this._instance.pid, error => {

          if ( error ) return reject(error);

          this._instance = null;

          resolve();

        });

      }

    });

  }

  launch() {

    const projectFound = !! app.data<SgData>().singular;

    // Launch the server
    this._instance = spawn(
      'node',
      [projectFound ? path.join('.', 'dist', 'main.js') : path.join('.', 'main.js')],
      {
        windowsHide: true,
        cwd: projectFound ? app.data<SgData>().projectRoot : process.cwd(),
        stdio: 'inherit'
      }
    ).ref;

  }

  async reload(rebuild: boolean) {

    // Mark for a newer reload if changes were detected while reload was in process
    if ( this._reloading ) {

      this._needsNewReload = true;
      return;

    }

    this._reloading = true;

    // Kill the running server (if any)
    await this.kill();

    // If rebuilding, reload singular.json and build
    if ( rebuild ) {

      app.data<SgData>().singular = await fs.readJson(path.join(app.data<SgData>().projectRoot, 'singular.json'));

      await this.build(app.data<SgData>());

    }

    // Relaunch the server
    this.launch();

    this._reloading = false;

    // If newer reload was requested midway
    if ( this._needsNewReload ) {

      this._needsNewReload = false;
      await this.reload(rebuild);

    }

  }

}
