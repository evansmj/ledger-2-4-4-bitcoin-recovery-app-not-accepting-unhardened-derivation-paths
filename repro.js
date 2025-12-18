const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;

function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

(async () => {
  const transport = await TransportNodeHid.create();

  // This test requests unhardened m/49/0/0.
  const display = 1;
  const path = [49, 0, 0];
  const data = Buffer.concat([
    Buffer.from([display, path.length]),
    ...path.map(u32be),
  ]);

  const apduHex = Buffer.concat([
    Buffer.from([0xE1, 0x00, 0x00, 0x01, data.length]),
    data,
  ]).toString("hex");

  console.log("APDU:", apduHex);

  try {
    const resp = await transport.send(0xE1, 0x00, 0x00, 0x01, data, [0x9000]);
    console.log("XPUB (ascii):", resp.toString("ascii"));
  } catch (e) {
    console.log("ERROR:", e && e.message ? e.message : e);
    if (e && typeof e.statusCode === "number") {
      console.log("SW=", "0x" + e.statusCode.toString(16));
    }
  } finally {
    await transport.close();
  }
})();
