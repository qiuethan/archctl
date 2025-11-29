export type ParsedArgs = {
    [key: string]: string | boolean;
  };
  
  export function parseArgs() {
    const [, , cmd, ...rest] = process.argv;
    const args: ParsedArgs = {};
    let currentKey: string | null = null;
  
    for (const token of rest) {
      if (token.startsWith('--')) {
        const [rawFlag, value] = token.split('=');
        const key = (rawFlag ?? '').slice(2); // strip leading "--" safely
  
        if (value !== undefined) {
          // --flag=value
          args[key] = value;
          currentKey = null;
        } else {
          // --flag (value might come in the next token)
          currentKey = key;
          args[key] = true; // default boolean true
        }
      } else if (currentKey) {
        // token is the value for the previous flag
        args[currentKey] = token;
        currentKey = null;
      } else if (!('_' in args)) {
        // first positional argument (if we ever want it)
        args._ = token;
      }
    }
  
    return { cmd, args };
  }
  