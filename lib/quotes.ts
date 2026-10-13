import {markets,type Symbol} from './market';
export const tradedSymbols=markets.filter(m=>m.symbol!=='USDT').map(m=>m.symbol);
export type Quote={symbol:Symbol,price:number,change:number,volume:number,exchangeTime:number};
export type QuotesResponse={source:'Binance',updatedAt:number,quotes:Quote[]};
// Reject malformed/partial responses instead of substituting demo prices.
export function parseTickers(raw:unknown):Quote[]{
  if(!Array.isArray(raw))throw new Error('Invalid ticker response');
  return tradedSymbols.map(symbol=>{
    const item=raw.find(v=>v&&typeof v==='object'&&v.symbol===`${symbol}USDT`);
    if(!item)throw new Error(`Missing ${symbol}USDT`);
    const price=Number(item.lastPrice),change=Number(item.priceChangePercent),volume=Number(item.quoteVolume),exchangeTime=Number(item.closeTime);
    if(!Number.isFinite(price)||price<=0||!Number.isFinite(change)||!Number.isFinite(volume)||volume<0||!Number.isFinite(exchangeTime)||exchangeTime<=0)throw new Error(`Invalid ${symbol}USDT`);
    return {symbol,price,change,volume,exchangeTime};
  });
}
export function validQuotes(value:unknown):value is QuotesResponse{
  if(!value||typeof value!=='object')return false;
  const d=value as QuotesResponse;
  return d.source==='Binance'&&Number.isFinite(d.updatedAt)&&d.updatedAt>0&&Array.isArray(d.quotes)&&d.quotes.length===tradedSymbols.length&&tradedSymbols.every(s=>d.quotes.some(q=>q.symbol===s&&Number.isFinite(q.price)&&q.price>0&&Number.isFinite(q.change)&&Number.isFinite(q.volume)&&q.volume>=0&&Number.isFinite(q.exchangeTime)&&q.exchangeTime>0));
}
export function volumeLabel(value:number){if(!Number.isFinite(value))return '—';return new Intl.NumberFormat('ru-RU',{notation:'compact',maximumFractionDigits:2}).format(value);}
