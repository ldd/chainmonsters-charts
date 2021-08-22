import { getRewards } from "./rewardHelper";
import { getLatestSales, saveSpreadsheet } from "./itemHelper";

export async function updateAll() {
  const extraRewards = await getRewards();
  const sales = await getLatestSales(extraRewards);
  saveSpreadsheet(sales, "sales_data.xlsx");
}
