import app from 'argumental';

/** Exits the app and displays a stylized error message (if provided). */
export function exit(error?: string|Error) {

  if ( error ) app.error(error);

  process.exit();

}
