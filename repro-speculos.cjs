const SpeculosTransport = require('@ledgerhq/hw-transport-node-speculos').default;
const ledgerBitcoin = require('ledger-bitcoin');

const apduPort = 40000;
const baseURL = 'http://127.0.0.1:5000';

// XPUB_A will be tagged with the speculos device fingerprint at runtime.
const XPUB_A = 'xpub6Dg9Y1YV8vKUJaBjWVXyNYcwEbj9cMu6SmnANQaKKPeP2qJoj7YLwc9f6BAhcRsWMU6EmgFRPqWA6imwftveyAYX3CwDBv99BjwgHTAPKbkUb3';
const XPUB_B = 'xpub6C92h9BRnATnHMEMQ1885FWavHrDJ2buQmQusSFktV9XKgyC18JcSWFPPK7RtuqFWot4UHHHa4AF5BPV25ZMzYhDMBqBk2eaPv9djqN7Atw';
const XPUB_C = 'xpub6CFfy1RWVBSqbQkPKNiY1eipHiZUs1f4JwvaiHrK7FNGRWVqhU2SdidHkCpUevSeSUpV3WnGRVMjhgt516Yjk64Hvt6Ka8rxPQ6t6WX4VG2';

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
    console.log(`APDU ${hex(apdu)} -> RESP ${hex(resp)} (sw=${sw != null ? fmtSw(sw) : 'n/a'})`);
    return resp;
  };

  const appClient = new ledgerBitcoin.AppClient(transport);

  try {
    const deviceFpr = await appClient.getMasterFingerprint();
    console.log('Device master fingerprint:', deviceFpr);

    // Force the internal-key check to attempt derivation at unhardened m/49/0/0
    // by matching the key origin fingerprint to the device fingerprint.
    const walletPolicy = new ledgerBitcoin.WalletPolicy(
      'DerPathTest',
      'sh(wsh(sortedmulti(2,@0/**,@1/**,@2/**)))',
      [
        `[${deviceFpr}/49/0/0]${XPUB_A}`,
        `[1b6531cf/49/0/0]${XPUB_B}`,
        `[6e35d0d2/49/0/0]${XPUB_C}`,
      ],
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
