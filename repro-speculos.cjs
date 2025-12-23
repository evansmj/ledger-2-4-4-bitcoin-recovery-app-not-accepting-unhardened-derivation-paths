const SpeculosTransport = require('@ledgerhq/hw-transport-node-speculos').default;
const ledgerBitcoin = require('ledger-bitcoin');

const apduPort = 9999;
const baseURL = 'http://127.0.0.1:5000';

// XPUB_A is fetched from Speculos at runtime at path m/49/0/0 (unhardened) and tagged with the device fingerprint.
const XPUB_B = 'xpub6CM193jdoYRwyqymZiupoYJxpNRsL7HEzNz6axSbSVWf6aRKJ7i3SxX77T67zDCv4W9VKQ6tJDCjNCbgYGTrrJZoq7uYuSiBxV51fxNrfYG';
const XPUB_C = 'xpub6DSBY13mSthGm2KCnzMnyQhMomQA58En7yWeJrbpFQqn7NtxS8iUTF6owXFeKiBU37Rh5f3q9R1miLF64NVULcpmH126upSA82mtqcLv2ac';

function hex(buf) {
  return Buffer.from(buf).toString('hex');
}

function swFromResponse(resp) {
  if (!resp || resp.length < 2) return null;
  return resp.readUInt16BE(resp.length - 2);
}

function fmtSw(sw) {
  if (typeof sw !== 'number') return String(sw);
  return '0x' + sw.toString(16).padStart(4, '0');
}

// try to register a wallet policy
(async () => {
  const transport = await SpeculosTransport.open({ apduPort, baseURL });

  const originalExchange = transport.exchange.bind(transport);
  transport.exchange = async (apdu) => {
    const resp = await originalExchange(apdu);
    const sw = swFromResponse(resp);
    console.log(
      `APDU ${hex(apdu)} -> RESP ${hex(resp)} (sw=${sw != null ? fmtSw(sw) : 'n/a'})`
    );
    return resp;
  };

  const appClient = new ledgerBitcoin.AppClient(transport);

  try {
    const deviceFpr = await appClient.getMasterFingerprint();
    console.log('Device master fingerprint:', deviceFpr);

    const deviceXpub = await appClient.getExtendedPubkey('m/49/0/0', true);
    console.log('Device xpub (m/49/0/0):', deviceXpub);

    const walletPolicy = new ledgerBitcoin.WalletPolicy(
      'DerPathTest',
      'sh(wsh(sortedmulti(2,@0/**,@1/**,@2/**)))',
      [`[${deviceFpr}/49/0/0]${deviceXpub}`, `[1b6531cf/49/0/0]${XPUB_B}`, `[6e35d0d2/49/0/0]${XPUB_C}`]
    );

    const [policyId, policyHmac] = await appClient.registerWallet(walletPolicy);
    console.log('policyId =', policyId.toString('hex'));
    console.log('policyHmac =', policyHmac.toString('hex'));
  } catch (e) {
    console.error('ERROR:', e && e.message ? e.message : e);
    if (typeof e?.statusCode === 'number') console.error('statusCode:', fmtSw(e.statusCode));
    if (typeof e?.status === 'number') console.error('status:', fmtSw(e.status));
  } finally {
    await transport.close();
  }
})();
