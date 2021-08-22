// @ts-ignore
const fcl = require("@onflow/fcl");

// https://forum.onflow.org/t/flow-js-sdk-error-response-closed-without-headers/1889/5
const ACCESS_NODE = "https://access-mainnet-beta.onflow.org";

export default function config() {
  fcl
    .config()
    .put("grpc.metadata", { api_key: process.env.REACT_APP_ALCHEMY_API_KEY })
    .put("accessNode.api", process.env.REACT_APP_ACCESS_NODE ?? ACCESS_NODE); // Configure FCL's Alchemy Access Node
  //   .put("challenge.handshake", process.env.REACT_APP_WALLET_DISCOVERY) // Configure FCL's Wallet Discovery mechanism
  //   .put("0xProfile", process.env.REACT_APP_CONTRACT_PROFILE); // Will let us use `0xProfile` in our Cadence
}

export const getLastBlock = async (sealed = true) =>
  fcl.send(await fcl.build([fcl.getBlock(sealed)]));

const CAP = 250;
export const getEvents = async (
  eventType: string,
  max: number,
  min = max - CAP + 1
) =>
  fcl
    .send(
      await fcl.build([fcl.getEventsAtBlockHeightRange(eventType, min, max)])
    )
    .then(fcl.decode);
