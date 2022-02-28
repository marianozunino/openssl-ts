import { spawn } from 'child_process';
import util from 'util';

const debuglog = util.debuglog('openssl');

const executeCommand = (
  command: string,
  flags: string[],
  stdinContent?: Buffer,
): Buffer | PromiseLike<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const output: Buffer[] = [];
    debuglog(`Executing command: ${command} ${flags.join(' ')}`);
    const childProcess = spawn(command, flags);

    if (stdinContent) {
      debuglog(`Sending stdin content: ${stdinContent.toString()}`);
      childProcess.stdin.cork();
      childProcess.stdin.write(stdinContent);
      childProcess.stdin.uncork();
    }

    childProcess.stderr.on('data', (data: Buffer) => {
      output.push(data);
    });

    childProcess.stdout.on('data', (data: Buffer) => {
      output.push(data);
    });

    childProcess.on('error', (err) => {
      return reject(err);
    });

    childProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(
          new Error(
            `openssl exited with code ${code}.\n${Buffer.concat(
              output,
            ).toString()}`,
          ),
        );
      } else {
        return resolve(Buffer.concat(output));
      }
    });
  });
};

export const openssl = async (
  flags: Array<string>,
  options?: {
    openSSLPath?: string;
    stdin?: Buffer;
  },
): Promise<Buffer> => {
  if (!Array.isArray(flags)) {
    throw new Error("'flags' must be a string array");
  }

  flags.forEach((flag) => {
    if (typeof flag !== 'string') {
      throw new Error(`'flags' must be a string array`);
    }
  });

  if (flags.length === 0) {
    throw new Error("'flags' must not be empty");
  }

  const opensslBin =
    options?.openSSLPath || process.env.OPENSSL_PATH || 'openssl';

  return executeCommand(opensslBin, flags, options?.stdin);
};
