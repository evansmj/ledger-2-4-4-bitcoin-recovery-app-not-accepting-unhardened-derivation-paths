## Ledger Bitcoin Recovery App not accepting unhardened path (Node HID)

It seems like we were told that we must use the "Bitcoin Recovery App" to
sign unhardened derivation paths.  This repository is to demonstrate that ledger
still rejects these.

This is using unhardened m/49/0/0.

With a ledger nano s plus using the "Bitcoin Recovery App", run this command:

```bash
node repro.js

```

```text
node repro.js
APDU: e10000010e0103000000310000000000000000
ERROR: Ledger device: UNKNOWN_ERROR (0x6a82)
SW= 0x6a82
```

With speculos, run this command:

```bash
node repro-speculos.cjs
```

```text
node repro-speculos.cjs
APDU e105000100 -> RESP f5acc2fd9000 (sw=0x9000)
Device master fingerprint: f5acc2fd
APDU e10000010e0103000000310000000000000000 -> RESP 6a82 (sw=0x6a82)
ERROR: Ledger device: UNKNOWN_ERROR (0x6a82)
statusCode: 0x6a82
```

With speculos, run this command:

```bash
node repro-xpub-speculos.cjs
```

```text
node repro-xpub-speculos.cjs
App: { name: 'Bitcoin', version: '2.4.4', flags: <Buffer 00> }
Requesting xpub at path=m/49/0/0 display=true
Approve the request in the emulator UI to continue.
ERROR: Ledger device: UNKNOWN_ERROR (0x6a82)
statusCode: 0x6a82
```
