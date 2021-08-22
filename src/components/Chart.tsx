import React from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

import rawSalesData from "../data/sales_data.json";
import { EventData } from "../data/itemHelper";

const salesData: Record<string, EventData> = rawSalesData.sales;

function prepareData(itemLabel: string, filter?: (t: EventData) => boolean) {
  const dic: Record<string, EventData[]> = {};
  Object.values(salesData).forEach(t => {
    if (t.itemLabel !== itemLabel) return;
    if (filter && !filter(t)) return;
    const day = t.time.split("T")[0];
    dic[day] ??= [];
    dic[day].push(t);
  });

  return Object.entries(dic).map(([k, v]) => ({
    x: new Date(k),
    y: v
      .reduce(([o, h, l, c]: EventData[], n) => {
        if (o === undefined || n.time < o.time) o = n;
        if (h === undefined || +n.price! > +h.price!) h = n;
        if (l === undefined || +n.price! < +l.price!) l = n;
        if (c === undefined || n.time > c.time) c = n;
        return [o, h, l, c];
      }, [])
      .map(e => +e.price!)
  }));
}

const chartOptions: ApexOptions = {
  chart: {
    height: 350,
    type: "candlestick"
  },
  title: {
    text: "CandleStick Chart - Category X-axis",
    align: "left"
  },
  annotations: {
    xaxis: [
      {
        // x: "Aug 14",
        borderColor: "#00E396",
        label: {
          borderColor: "#00E396",
          style: { fontSize: "12px", color: "#fff", background: "#00E396" },
          orientation: "horizontal",
          offsetY: 7,
          text: "Marketplace Opens"
        }
      }
    ]
  },
  tooltip: {
    enabled: true
  },
  xaxis: {
    labels: { formatter: value => value?.split?.("2021")[0] }
  },
  yaxis: { tooltip: { enabled: true } }
};

export default function ApexChart() {
  // const filter = (e: EventData) => !!(e.serialNumber && +e.serialNumber > 0);
  const data = prepareData("Mystery Berry").sort(
    (a, b) => a.x.getTime() - b.x.getTime()
  );
  return (
    <div id="chart">
      <ReactApexChart
        options={chartOptions}
        series={[{ name: "candle", data }]}
        type="candlestick"
        height={550}
      />
    </div>
  );
}
