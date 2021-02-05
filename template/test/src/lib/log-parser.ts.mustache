import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { URL } from 'url';
import { DateTime } from 'luxon';

export class LogParserClass extends EventEmitter {

  private _serverStarted: boolean = false;
  private _timezone = DateTime.local().zone.name;

  constructor(child: ChildProcess, timezone?: string) {

    super();

    // Set timezone
    if ( ! DateTime.local().setZone(timezone).isValid ) {

      console.warn(`WARNING: Invalid timezone ${timezone} for log parser!`);

    }
    else {

      this._timezone = timezone;

    }

    // Subscribe to warnings and errors
    child.stderr.on('data', data => {

      const parsed = this._parse(data + '', 'stderr');

      // Emit parsed log
      this.emit(parsed.level, parsed);
      this.emit('all', parsed);

    });

    // Subscribe to all other
    child.stdout.on('data', data => {

      const parsed = this._parse(data + '', 'stdout');

      // If server started notice
      if ( parsed.level === 'notice' && parsed.text.match(/^Server started on port \d+$/) )
        this._serverStarted = true;

      // Emit parsed log
      this.emit(parsed.level, parsed);
      this.emit('all', parsed);

    });

  }

  private _parse(log: string, stream: 'stderr'|'stdout'): ParsedLog {

    const match = log.match(/^\[(?<time>.+?)\] (?<level>(NOTICE)|(DEBUG)|(WARN)|(ERROR)|(INFO)) +(\[(?<sessionId>.+?)\] )?(?<text>.+)$/s);

    // If not a Singular log
    if ( ! match ) return {
      type: this._serverStarted ? 'other' : 'startup',
      time: null,
      level: stream === 'stderr' ? 'error' : 'info',
      text: log,
      singularLog: false,
      raw: log
    };

    // Sanitize level
    match.groups.level = match.groups.level.toLowerCase();

    // If headers log
    const headersMatch = match.groups.text.trim().match(/^HEADERS\s*\n(?<headers>[^:\s]+?:\s*[^\n]+.*)$/s);

    if ( match.groups.level === 'debug' && headersMatch ) {

      const headers = {};
      const rawHeaders = headersMatch.groups.headers.split('\n');

      for ( const raw of rawHeaders ) {

        const segments = raw.split(':');

        headers[segments[0].trim()] = segments.slice(1).join(':').trim();

      }

      return {
        type: 'headers',
        time: DateTime.fromFormat(match.groups.time, 'dd-LL-yyyy HH:mm:ss:u').setZone(this._timezone),
        level: 'debug',
        singularLog: true,
        text: match.groups.text.trim(),
        sessionId: match.groups.sessionId,
        headers,
        raw: log
      };

    }

    // If request log
    const requestMatch = match.groups.text.trim().match(/^(?<httpMethod>(GET)|(POST)|(PUT)|(DELETE)|(PATCH)|(CHECKOUT)|(COPY)|(HEAD)|(LOCK)|(MERGE)|(MKACTIVITY)|(MKCOL)|(MOVE)|(M-SEARCH)|(NOTIFY)|(OPTIONS)|(PURGE)|(REPORT)|(SEARCH)|(SUBSCRIBE)|(TRACE)|(UNLOCK)|(UNSUBSCRIBE)) (?<url>https?:\/\/.+)$/);

    if ( match.groups.level === 'debug' && requestMatch ) {

      return {
        type: 'request',
        time: DateTime.fromFormat(match.groups.time, 'dd-LL-yyyy HH:mm:ss:u').setZone(this._timezone),
        level: 'debug',
        singularLog: true,
        text: match.groups.text.trim(),
        sessionId: match.groups.sessionId,
        httpMethod: requestMatch.groups.httpMethod,
        url: new URL(requestMatch.groups.url),
        raw: log
      };

    }

    // Other logs
    return {
      type: this._serverStarted ? 'message' : 'startup',
      time: DateTime.fromFormat(match.groups.time, 'dd-LL-yyyy HH:mm:ss:u').setZone(this._timezone),
      level: <any>match.groups.level,
      text: match.groups.text.trim(),
      sessionId: match.groups.sessionId,
      singularLog: true,
      raw: log
    };

  }

  /** Returns a promise which will be resolved on the next specified event emission. */
  public toPromise(event: 'all'|'debug'|'info'|'notice'|'warn'|'error'): Promise<ParsedLog> {

    return new Promise(resolve => this.once(event, resolve));

  }

  /** Returns a promise which will be resolved on the next log emission of the specified type and level. */
  public next(logType: 'request'): Promise<RequestLog>;
  public next(logType: 'headers'): Promise<HeadersLog>;
  public next(logType: 'other'|'startup', logLevel?: 'info'|'error'): Promise<OtherLog>;
  public next(logType: 'message'|'startup', logLevel?: 'debug'|'info'|'notice'|'warn'|'error'): Promise<MessageLog>;
  public next(logType: 'message'|'startup'|'request'|'headers'|'other', logLevel?: 'debug'|'info'|'notice'|'warn'|'error'): Promise<ParsedLog> {

    return new Promise(resolve => {

      const listener = (log: ParsedLog) => {

        if ( log.type === logType && (log.level === (logLevel ?? log.level)) ) {

          this.off(logLevel ?? 'all', listener);
          resolve(log);

        }

      };

      this.on(logLevel ?? 'all', listener);

    });

  }

}

export interface ParsedLog {

  /** The log type. */
  type: 'message'|'startup'|'request'|'headers'|'other';
  /** Parsed timestamp of the log. */
  time: DateTime;
  /** The log level. */
  level: 'debug'|'info'|'notice'|'warn'|'error';
  /** The session ID of the log (if any). */
  sessionId?: string;
  /** The text of the log. */
  text: string;
  /** Indicates if this log was produced by Singular's logger. */
  singularLog: boolean;
  /**
  * Only on logs of type 'request'.
  * The HTTP method of the request log.
  */
  httpMethod?: string;
  /**
  * Only on logs of type 'request'.
  * The parsed url of the request log.
  */
  url?: URL;
  /**
  * Only on logs of type 'headers'.
  * The parsed headers of the headers log (key-value pair).
  */
  headers?: { [name: string]: string; };
  /** The raw log. */
  raw: string;

}

export interface MessageLog {

  /** The log type. */
  type: 'message'|'startup';
  /** Parsed timestamp of the log. */
  time: DateTime;
  /** The log level. */
  level: 'debug'|'info'|'notice'|'warn'|'error';
  /** The session ID of the log (if any). */
  sessionId?: string;
  /** The text of the log. */
  text: string;
  /** Indicates if this log was produced by Singular's logger. */
  singularLog: true;
  /** The raw log. */
  raw: string;

}

export interface RequestLog {

  /** The log type. */
  type: 'request';
  /** Parsed timestamp of the log. */
  time: DateTime;
  /** The log level. */
  level: 'debug';
  /** The session ID of the log (if any). */
  sessionId?: string;
  /** The text of the log. */
  text: string;
  /** Indicates if this log was produced by Singular's logger. */
  singularLog: true;
  /** The HTTP method of the request log. */
  httpMethod?: string;
  /** The parsed url of the request log. */
  url?: URL;
  /** The raw log. */
  raw: string;

}

export interface HeadersLog {

  /** The log type. */
  type: 'headers';
  /** Parsed timestamp of the log. */
  time: DateTime;
  /** The log level. */
  level: 'debug';
  /** The session ID of the log (if any). */
  sessionId?: string;
  /** The text of the log. */
  text: string;
  /** Indicates if this log was produced by Singular's logger. */
  singularLog: true;
  /** The parsed headers of the headers log (key-value pair). */
  headers?: { [name: string]: string; };
  /** The raw log. */
  raw: string;

}

export interface OtherLog {

  /** The log type. */
  type: 'startup'|'other';
  /** Parsed timestamp of the log. */
  time: null;
  /** The log level. */
  level: 'info'|'error';
  /** The text of the log. */
  text: string;
  /** Indicates if this log was produced by Singular's logger. */
  singularLog: false;
  /** The raw log. */
  raw: string;

}

export interface LogParser extends LogParserClass {

  on(event: 'all'|'debug'|'info'|'notice'|'warn'|'error', listener: (log: ParsedLog) => void): this;
  on(event: string|symbol, listener: (...args: any[]) => void): this;

  once(event: 'all'|'debug'|'info'|'notice'|'warn'|'error', listener: (log: ParsedLog) => void): this;
  once(event: string|symbol, listener: (...args: any[]) => void): this;

  addListener(event: 'all'|'debug'|'info'|'notice'|'warn'|'error', listener: (log: ParsedLog) => void): this;
  addListener(event: string|symbol, listener: (...args: any[]) => void): this;

}
