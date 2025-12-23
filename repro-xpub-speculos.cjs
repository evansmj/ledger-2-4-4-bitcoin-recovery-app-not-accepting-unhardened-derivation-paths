const SpeculosTransport = require('@ledgerhq/hw-transport-node-speculos').default;
const { AppClient } = require('ledger-bitcoin');

const apduPort = 9999;
const baseURL = 'http://127.0.0.1:5000';

const path = process.argv[2] || 'm/49/0/0';
const display = (process.argv[3] || 'true') !== 'false';

function fmtSw(sw) {
  if (typeof sw !== 'number') return String(sw);
  return '0x' + sw.toString(16).padStart(4, '0');
}

(async () => {
  const transport = await SpeculosTransport.open({ apduPort, baseURL });
  const app = new AppClient(transport);

  try {
    const info = await app.getAppAndVersion();
    console.log('App:', info);

    console.log(`Requesting xpub at path=${path} display=${display}`);
    if (display) {
      console.log('Approve the request in the emulator UI to continue.');
    }

    const xpub = await app.getExtendedPubkey(path, display);
    console.log('xpub =', xpub);
    console.log('xpub.length =', xpub.length);
  } catch (e) {
    console.error('ERROR:', e?.message || e);
    if (typeof e?.statusCode === 'number') console.error('statusCode:', fmtSw(e.statusCode));
    if (e?.statusCode === 0x6901) {
      console.error('Hint: Speculos/app is stuck in a pending UX screen; restart Speculos or clear the screen, then retry.');
    }
  } finally {
    await transport.close();
  }
})();
