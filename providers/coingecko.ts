// Fetches trending coins and top coins by market cap from CoinGecko

async function fetchJSON(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "aixbt-agent/1.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap_rank: number;
  total_volume: number;
}

export async function getTrending(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  try {
    const data = await fetchJSON(
      "https://api.coingecko.com/api/v3/search/trending"
    );
    data.coins.forEach((c: any, i: number) => {
      map.set(c.item.id, i + 1);
    });
  } catch {}
  return map;
}

export async function getTopCoins(perPage = 50): Promise<MarketCoin[]> {
  try {
    const data = await fetchJSON(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=24h`
    );
    return data;
  } catch {
    return [];
  }
}
