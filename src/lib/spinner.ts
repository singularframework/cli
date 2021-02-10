import ora from 'ora';
import chalk from 'chalk';

export default class Spinner {

  private _ora = ora({ stream: process.stdout });

  public start(text?: string): this {

    this._ora.start(text);

    return this;

  }

  public stop(): this {

    this._ora.stop();

    return this;

  }

  public fail(text?: string): this {

    const currentText = text ?? this._ora.text;

    this._ora.stop();
    this._ora = ora({ stream: process.stderr });
    this._ora.fail(currentText);
    this._ora = ora({ stream: process.stdout });

    return this;

  }

  public warn(text?: string): this {

    const currentText = text ?? this._ora.text;

    this._ora.stop();
    this._ora = ora({ stream: process.stderr });
    this._ora.stopAndPersist({
      text: currentText,
      symbol: chalk.yellow('!')
    });
    this._ora = ora({ stream: process.stdout });

    return this;

  }

  public info(text?: string): this {

    this._ora.stopAndPersist({
      text: text ?? this._ora.text,
      symbol: chalk.blueBright('i')
    });

    return this;

  }

  public succeed(text?: string): this {

    this._ora.succeed(text);

    return this;

  }

  public get text(): string { return this._ora.text; }
  public set text(value: string) { this._ora.text = value; }

}
