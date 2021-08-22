import { Table } from "antd";
import { ColumnsType } from "antd/lib/table";
import React, { useEffect, useState } from "react";
import { EventData, getLatestSales } from "../data/itemHelper";
import { getRewards } from "../data/rewardHelper";
import rewards from "../data/rewards.json";
import salesData from "../data/sales_data.json";

const salesHistory = Object.entries(salesData.sales).map(([key, value]) => ({
  key,
  ...value
}));

type IndexedEntry = EventData & { key: string };
const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const labelFilters = Object.entries(rewards).map(([key, value]) => ({
  text: value,
  value
}));

const columns = [
  {
    title: "Name",
    dataIndex: "itemLabel",
    filters: labelFilters,
    onFilter: (value: string, data: EventData) =>
      data.itemLabel?.includes(value),
    sorter: (a: EventData, b: EventData) =>
      (a.itemLabel ?? "").localeCompare(b.itemLabel ?? ""),
    render: (name: string, entry) => (
      <a href={`https://flowscan.org/transaction/${entry.transactionId}`}>
        {name ?? "???"}
      </a>
    )
  },
  {
    title: "Serial Number",
    dataIndex: "serialNumber",
    defaultSortOrder: "descend",
    sorter: (a: EventData, b: EventData) =>
      +(a.serialNumber ?? 0) - +(b.serialNumber ?? 0),
    render: (order: number) => <>{order ? `#${order}` : "???"}</>
  },
  {
    title: "Price",
    dataIndex: "price",
    defaultSortOrder: "ascend",
    sorter: (a: EventData, b: EventData) => +(a.price ?? 0) - +(b.price ?? 0),
    render: (price: number) => <>{formatter.format(price)} USD</>
  },
  {
    title: "Date",
    dataIndex: "time",
    defaultSortOrder: "ascend",
    sorter: (a: EventData, b: EventData) =>
      new Date(a.time).getTime() - new Date(b.time).getTime(),
    render: (date: string) => <>{new Date(date).toString()}</>
  },
  {
    title: "From",
    dataIndex: "from",
    render: (address: string) => (
      <a href={`https://flowscan.org/account/${address}`}>{address}</a>
    )
  },
  {
    title: "To",
    dataIndex: "to",
    render: (address: string) => (
      <a href={`https://flowscan.org/account/${address}`}>{address}</a>
    )
  }
] as ColumnsType<IndexedEntry>;

const parseData = (eventData: EventData[]): IndexedEntry[] =>
  eventData
    .map((eventEntry, key) => {
      if (!eventEntry.saleItemId) return null;
      return { key: `${key}`, ...eventEntry };
    })
    .filter(Boolean) as IndexedEntry[];

export default function MyTable() {
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState<IndexedEntry[]>(salesHistory);
  useEffect(() => {
    const fn = async () => {
      const rewardData = await getRewards();
      const salesData = await getLatestSales(rewardData);
      setData(parseData(salesData));
      setLoading(false);
    };
    fn();
  }, []);
  return (
    <Table
      title={() => <h3>Sales History</h3>}
      footer={() => (isLoading ? "Loading..." : "Loaded")}
      columns={columns}
      dataSource={data}
      size="small"
      pagination={{ position: ["bottomCenter"], defaultPageSize: 25 }}
    />
  );
}
