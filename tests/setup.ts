// Suppress known dependency warnings
const originalEmitWarning = process.emitWarning.bind(process);
process.emitWarning = (warning, ...args) => {
  if (typeof warning === 'string' && warning.includes('INVALID_ALT_NUMBER')) {
    return;
  }
  if (
    typeof warning === 'object' &&
    warning.message &&
    warning.message.includes('INVALID_ALT_NUMBER')
  ) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  return originalEmitWarning(warning, ...(args as any[]));
};
