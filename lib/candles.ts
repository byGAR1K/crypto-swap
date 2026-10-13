export const intervals={'15м':'15m','1ч':'1h','4ч':'4h','1д':'1d','1н':'1w'} as const;
export type Interval=typeof intervals[keyof typeof intervals];
export type Candle={time:number,closeTime:number,open:number,high:number,low:number,close:number,volume:number};
export type CandleResponse={source:'Binance',symbol:string,interval:Interval,updatedAt:number,candles:Candle[]};
function validCandle(c:Candle){return Number.isSafeInteger(c.time)&&c.time>0&&Number.isSafeInteger(c.closeTime)&&c.closeTime>=c.time&&[c.open,c.high,c.low,c.close].every(v=>Number.isFinite(v)&&v>0)&&c.high>=Math.max(c.open,c.close)&&c.low<=Math.min(c.open,c.close)&&c.high>=c.low&&Number.isFinite(c.volume)&&c.volume>=0;}
export function parseCandles(raw:unknown):Candle[]{
  if(!Array.isArray(raw)||raw.length<2||raw.length>120)throw new Error('Invalid candle count');
  const result=raw.map((row:unknown)=>{
    if(!Array.isArray(row)||row.length<7)throw new Error('Invalid candle row');
    const c={time:Number(row[0]),open:Number(row[1]),high:Number(row[2]),low:Number(row[3]),close:Number(row[4]),volume:Number(row[5]),closeTime:Number(row[6])};
    if(!validCandle(c))throw new Error('Invalid OHLC values');return c;
  });
  if(result.some((c,i)=>i>0&&c.time<=result[i-1].time))throw new Error('Candle times must increase');
  return result;
}
export function validCandleResponse(value:unknown,symbol:string,interval:Interval):value is CandleResponse{
  if(!value||typeof value!=='object')return false;const d=value as CandleResponse;
  return d.source==='Binance'&&d.symbol===symbol&&d.interval===interval&&Number.isFinite(d.updatedAt)&&d.updatedAt>0&&Array.isArray(d.candles)&&d.candles.length>=2&&d.candles.length<=120&&d.candles.every((c,i)=>c&&validCandle(c)&&(i===0||c.time>d.candles[i-1].time));
}
