import { existsSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { openssl } from 'src/index';

describe('openssl', () => {
  const outputFile = join(tmpdir(), 'output.key');
  beforeEach(() => {
    delete process.env.OPENSSL_PATH;
    if (existsSync(outputFile)) {
      unlinkSync(outputFile);
    }
  });

  describe('when invalid flags are used', () => {
    it('should throw if flags are empty', async () => {
      await expect(openssl([])).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should throw if flags are not string', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await expect(openssl([1])).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should throw if flags are not string', async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await expect(openssl('genrsa')).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('when openssl binary is not found', () => {
    it('should throw if openSSLPath is invalid', async () => {
      await expect(
        openssl(['someflag'], {
          openSSLPath: 'openSSLPath-not-a-real-openssl-binary',
        }),
      ).rejects.toThrowErrorMatchingSnapshot();
    });

    it('should throw if OPENSSL_PATH env is invalid', async () => {
      process.env.OPENSSL_PATH = 'OPENSSL_PATH-not-a-real-openssl-binary';
      await expect(
        openssl(['someflag']),
      ).rejects.toThrowErrorMatchingSnapshot();
    });
  });

  describe('should execute openssl without errors', () => {
    it('should execute openssl without errors', async () => {
      const result = await openssl(['exit'], {
        openSSLPath: 'openssl',
      });
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toMatchSnapshot();
    });
    describe('genrsa', () => {
      it('should support genrsa action as stdout output', async () => {
        const pass = '123456';
        const rsa = await openssl([
          'genrsa',
          '-des3',
          '-passout',
          `pass:${pass}`,
          '1048',
        ]);
        expect(
          rsa
            .toString()
            .includes(
              'Generating RSA private key, 1048 bit long modulus (2 primes)',
            ),
        ).toBeTruthy();
        expect(
          rsa.toString().includes('-----BEGIN RSA PRIVATE KEY-----'),
        ).toBeTruthy();
        expect(
          rsa.toString().includes('-----END RSA PRIVATE KEY-----'),
        ).toBeTruthy();
      });
      it('should support genrsa action as stdout output', async () => {
        const pass = '123456';
        const rsa = await openssl([
          'genrsa',
          '-des3',
          '-out',
          outputFile,
          '-passout',
          `pass:${pass}`,
          '1048',
        ]);
        expect(
          rsa
            .toString()
            .includes(
              'Generating RSA private key, 1048 bit long modulus (2 primes)',
            ),
        ).toBeTruthy();
        expect(
          rsa.toString().includes('-----BEGIN RSA PRIVATE KEY-----'),
        ).toBeFalsy();
        expect(
          rsa.toString().includes('-----END RSA PRIVATE KEY-----'),
        ).toBeFalsy();
        expect(existsSync(outputFile)).toBeTruthy();
        const content = readFileSync(outputFile, 'utf8');
        expect(
          content.startsWith('-----BEGIN RSA PRIVATE KEY-----'),
        ).toBeTruthy();
        expect(content.includes('-----END RSA PRIVATE KEY-----')).toBeTruthy();
      });
    });
    describe('smime verify', () => {
      it('should support smime verify action', async () => {
        const output = await openssl([
          'smime',
          '-verify',
          '-inform',
          'DER',
          '-in',
          `${__dirname}/__resources__/signed.mobileprovision`,
          '-noverify',
        ]);
        expect(output.toString()).toMatchSnapshot();
      });
      it('should support smime verify action using stdin', async () => {
        const buffer = readFileSync(
          `${__dirname}/__resources__/signed.mobileprovision`,
        );
        const output = await openssl(
          ['smime', '-verify', '-inform', 'DER', '-noverify'],
          { stdin: buffer },
        );
        expect(output.toString()).toMatchSnapshot();
      });
    });
    describe('x509', () => {
      it('should support x509 action', async () => {
        const output = await openssl([
          'x509',
          '-in',
          `${__dirname}/__resources__/AppleIncRootCertificate.cer`,
          '-subject',
          '-noout',
          '-inform',
          'DER',
        ]);
        expect(output.toString()).toMatchSnapshot();
      });
      it('should support x509 action using stdin', async () => {
        const buffer = readFileSync(
          `${__dirname}/__resources__/AppleIncRootCertificate.cer`,
        );
        const output = await openssl(
          ['x509', '-subject', '-noout', '-inform', 'DER'],
          { stdin: buffer },
        );
        expect(output.toString()).toMatchSnapshot();
      });
    });
  });

  describe('should support cms action', () => {
    it('without stdin', async () => {
      const output = await openssl([
        'cms',
        '-sign',
        '-signer',
        `${__dirname}/__resources__/domain.crt`,
        '-inkey',
        `${__dirname}/__resources__/domain.key`,
        '-nodetach',
        '-outform',
        'der',
        '-in',
        `${__dirname}/__resources__/signme.xml`,
      ]);
      expect(
        output
          .toString('base64')
          .startsWith(
            'MIIFyQYJKoZIhvcNAQcCoIIFujCCBbYCAQExDTALBglghkgBZQMEAgEwggE5BgkqhkiG9w0BBwGgggEqBIIBJjxsb2dpblRpY2tldFJlcXVlc3QgdmVyc2lvbj0iMS4wIj4NCiAgPGhlYWRlcj4NCiAgICA8dW5pcXVlSWQ+MTY0NjMxNjI4ODwvdW5pcXVlSWQ+DQogICAgPGdlbmVyYXRpb25UaW1lPjIwMjItMDMtMDNUMTA6MzQ6NDguODUzLTAzOjAwPC9nZW5lcmF0aW9uVGltZT4NCiAgICA8ZXhwaXJhdGlvblRpbWU+MjAyMi0wMy0wM1QxMTozNDo0OC44NTUtMDM6MDA8L2V4cGlyYXRpb25UaW1lPg0KICA8L2hlYWRlcj4NCiAgPHNlcnZpY2U+d3Nfc3JfcGFkcm9uX2ExMzwvc2VydmljZT4NCjwvbG9naW5UaWNrZXRSZXF1ZXN0PqCCAnAwggJsMIIB0qADAgECAhRm9+mmWM7kzqxuMMl+xA8G7/KBBjANBgkqhkiG9w0BAQsFADBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMB4XDTIyMDMwMzE0MzQ1NFoXDTIzMDMwMzE0MzQ1NFowRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDCBojANBgkqhkiG9w0BAQEFAAOBkAAwgYwCgYQAzF0Hw/TnOlgsYzbR3iOMFgCPnQ6h0e85E21PXtNzMS//6Yez22fg4jI4GAj5ho2M7YjHz0BvVyxbp4pT4riqT2LnSb0x1wNVfHymdx7j1ygq7AlpZYc0pw+',
          ),
      ).toBeTruthy();
    });
    it('with stdin', async () => {
      const stdin = readFileSync(`${__dirname}/__resources__/signme.xml`);
      const output = await openssl(
        [
          'cms',
          '-sign',
          '-signer',
          `${__dirname}/__resources__/domain.crt`,
          '-inkey',
          `${__dirname}/__resources__/domain.key`,
          '-nodetach',
          '-outform',
          'der',
        ],
        {
          stdin,
        },
      );
      expect(
        output
          .toString('base64')
          .startsWith(
            'MIIFyQYJKoZIhvcNAQcCoIIFujCCBbYCAQExDTALBglghkgBZQMEAgEwggE5BgkqhkiG9w0BBwGgggEqBIIBJjxsb2dpblRpY2tldFJlcXVlc3QgdmVyc2lvbj0iMS4wIj4NCiAgPGhlYWRlcj4NCiAgICA8dW5pcXVlSWQ+MTY0NjMxNjI4ODwvdW5pcXVlSWQ+DQogICAgPGdlbmVyYXRpb25UaW1lPjIwMjItMDMtMDNUMTA6MzQ6NDguODUzLTAzOjAwPC9nZW5lcmF0aW9uVGltZT4NCiAgICA8ZXhwaXJhdGlvblRpbWU+MjAyMi0wMy0wM1QxMTozNDo0OC44NTUtMDM6MDA8L2V4cGlyYXRpb25UaW1lPg0KICA8L2hlYWRlcj4NCiAgPHNlcnZpY2U+d3Nfc3JfcGFkcm9uX2ExMzwvc2VydmljZT4NCjwvbG9naW5UaWNrZXRSZXF1ZXN0PqCCAnAwggJsMIIB0qADAgECAhRm9+mmWM7kzqxuMMl+xA8G7/KBBjANBgkqhkiG9w0BAQsFADBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMB4XDTIyMDMwMzE0MzQ1NFoXDTIzMDMwMzE0MzQ1NFowRTELMAkGA1UEBhMCQVUxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoMGEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDCBojANBgkqhkiG9w0BAQEFAAOBkAAwgYwCgYQAzF0Hw/TnOlgsYzbR3iOMFgCPnQ6h0e85E21PXtNzMS//6Yez22fg4jI4GAj5ho2M7YjHz0BvVyxbp4pT4riqT2LnSb0x1wNVfHymdx7j1ygq7AlpZYc0pw+',
          ),
      ).toBeTruthy();
    });
  });
});
