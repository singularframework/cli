/** Resolves the returned promise after the given milliseconds. */
export function wait(ms: number) {

  return new Promise(resolve => setTimeout(resolve, ms));

}
