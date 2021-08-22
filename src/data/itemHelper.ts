import config, { getEvents, getLastBlock } from "./config";
import rewardData from "./rewards.json";
import rawItemData from "./item_data.json";
import { writeFileSync } from "fs";

const itemData: {
  earliestBlockSeen: number;
  rewards: Record<string, string[]>;
} = rawItemData;

config();

type Event<T extends object> = {
  blockId: string;
  transactionId: string;
  data: T;
  blockTimestamp: string;
};

type DepositEvent = Event<{ saleItemID: number; saleItemCollection: string }>;

type PriceEntry = { amount?: string; price?: string; from: string | null };
type PriceEvent = Event<PriceEntry>;
export type EventData = {
  from: string | null;
  to: string | null;
  saleItemId?: number;
  transactionId: string;
  itemLabel?: string;
  serialNumber?: string;
  price?: string;
  time: string;
};

function parsePriceResponse(priceResponse: PriceEvent[]) {
  const priceDic: Record<string, PriceEntry> = {};
  priceResponse.forEach(e => {
    priceDic[e.transactionId] ??= { amount: undefined, from: null };
    priceDic[e.transactionId].amount ??= e.data.amount ?? e.data.price;
    priceDic[e.transactionId].from ??= e.data.from;
  });
  return priceDic;
}

type RewardDic = Record<string, [string, string]>;
function parseDepositResponse(
  depositResponse: DepositEvent[],
  priceDic: Record<string, PriceEntry>,
  extraRewards?: RewardDic
) {
  const list: EventData[] = [];
  depositResponse.forEach(event => {
    const { transactionId, data, blockTimestamp: time } = event;
    const { saleItemID: saleItemId, saleItemCollection: from } = data;
    const { amount: price, from: to } = priceDic[transactionId] ?? {};
    if (!price) return;
    const [rawItemLabel, serialNumber] =
      itemData.rewards[saleItemId] ?? extraRewards?.[saleItemId] ?? [];
    type RewardLabel = keyof typeof rewardData;
    const itemLabel = rewardData[rawItemLabel as RewardLabel];
    // prettier-ignore
    list.push({ from, to, saleItemId, transactionId, itemLabel, serialNumber, price, time });
  });
  return list;
}

function parseResponses(
  responses: [DepositEvent[], PriceEvent[]],
  rewardDic?: RewardDic
): EventData[] {
  return parseDepositResponse(
    responses[0],
    parsePriceResponse(responses[1]),
    rewardDic
  );
}

const MARKETPLACE = "A.64f83c60989ce555.ChainmonstersMarketplace";
export const getMarketplaceEvents = async <T extends any[], U>(
  eventLabels: string[],
  otherRewards: RewardDic | undefined,
  parser: (responses: T, rewardDic?: RewardDic) => U[],
  earliestBlockSeen: number,
  limit = Infinity
): Promise<{ data: U[]; position?: number }> => {
  let data: U[] = [];
  const lastBlock = await getLastBlock();

  if (!lastBlock) return { data };
  const CAP = 250;
  for (
    let position = lastBlock.block.height;
    position > earliestBlockSeen && data.length < limit;
    position -= CAP
  ) {
    try {
      const awaitedResponses = eventLabels.map(e => getEvents(e, position));
      const responses = (await Promise.all(awaitedResponses)) as T;
      data = data.concat(parser(responses, otherRewards));
    } catch (e) {
      console.log(position, e);
    }
  }
  return { data, position: lastBlock.block.height };
};

export const getLatestSales = async (
  otherRewards?: RewardDic
): Promise<EventData[]> => {
  // read from storage
  const storage = require("./sales_data.json");
  if (!storage.earliestBlockSeen) storage.earliestBlockSeen = 17_000_000;

  const depositEvent = `${MARKETPLACE}.CollectionRemovedSaleOffer`;
  const priceEvent = "A.3c5959b568896393.FUSD.TokensWithdrawn";

  const { data, position } = await getMarketplaceEvents(
    [depositEvent, priceEvent],
    otherRewards,
    parseResponses,
    storage.earliestBlockSeen
  );

  // save to storage
  if (!position) return [];
  storage.earliestBlockSeen = position;
  data.forEach(e => (storage.sales[e.transactionId] = e));
  const FILE_NAME = "./src/data/sales_data.json";
  if (writeFileSync) writeFileSync(FILE_NAME, JSON.stringify(storage));

  return Object.values(storage.sales);
};

export const getLatestOffers = async (limit = 5, otherRewards?: RewardDic) => {
  let depositEvent = `${MARKETPLACE}.CollectionInsertedSaleOffer`;
  let priceEvent = `${MARKETPLACE}.SaleOfferCreated`;
  const { data } = await getMarketplaceEvents(
    [depositEvent, priceEvent],
    otherRewards,
    parseResponses,
    17_000_000,
    limit
  );
  return data;
};

export function saveSpreadsheet(jsonData: object[], fileName = "data.xlsx") {
  const json2xls = require("json2xls");
  const xls = json2xls(jsonData);
  writeFileSync(`./src/data/${fileName}`, xls, "binary");
}
