import { writeFileSync } from "fs";
import config, { getEvents, getLastBlock } from "./config";

config();

export const getRewards = async () => {
  const storage = require("./item_data.json");
  const downloadedRewards: Record<string, [string, string]> = {};

  const lastBlock = await getLastBlock();
  if (!lastBlock) return;
  if (!storage.earliestBlockSeen) storage.earliestBlockSeen = 11_250_000;

  const eventType = `A.93615d25d14fa337.ChainmonstersRewards.NFTMinted`;
  const CAP = 250;
  for (
    let position = lastBlock.block.height;
    position > storage.earliestBlockSeen;
    position -= CAP
  ) {
    try {
      const response = await getEvents(eventType, position);
      response.forEach((event: any) => {
        const { NFTID, rewardID, serialNumber } = event.data;
        storage.rewards[NFTID] = [`${rewardID}`, `${serialNumber}`];
        downloadedRewards[NFTID] = [`${rewardID}`, `${serialNumber}`];
      });
    } catch (e) {
      console.log(position, e);
    }
  }
  storage.earliestBlockSeen = lastBlock.block.height;
  const FILE_NAME = "./src/data/item_data.json";
  if (writeFileSync) writeFileSync(FILE_NAME, JSON.stringify(storage));
  return downloadedRewards;
};

export const getItemType = async (itemId: string): Promise<null | object> => {
  const eventType = "A.93615d25d14fa337.ChainmonstersRewards.NFTMinted";
  const lastBlock = await getLastBlock();

  if (!lastBlock) return null;
  for (let position = lastBlock.block.height; position > 0; position -= 250) {
    const response = await getEvents(eventType, position);
    if (response.events.length > 0) {
      let itemFound;
      response.events.some((event: any) => {
        const { fields } = event.payload.value;
        const { value } = fields[0].value;
        if (value === itemId) itemFound = fields;
        return value === itemId;
      });
      if (itemFound) return itemFound;
    }
  }

  return null;
};
