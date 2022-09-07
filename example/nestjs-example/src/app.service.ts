import { Injectable } from '@nestjs/common';
import { openssl } from 'openssl-ts';

@Injectable()
export class AppService {
  public async example(): Promise<void> {
    const buffer = await openssl(['genrsa', '2048']);

    const opensslOutput = buffer.toString();
    const privateKey = opensslOutput
      .split('-----BEGIN RSA PRIVATE KEY-----')[1]
      .split('-----END RSA PRIVATE KEY-----')[0];

    const key = `-----BEGIN RSA PRIVATE KEY-----${privateKey}-----END RSA PRIVATE KEY-----\n`;

    const verifyOutput = await openssl(['rsa', '-check'], {
      stdin: Buffer.from(key),
    });

    console.log(verifyOutput.toString());
  }
}
