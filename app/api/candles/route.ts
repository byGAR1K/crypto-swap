import {NextResponse} from 'next/server';
import {tradedSymbols} from '@/lib/quotes';
import {intervals,parseCandles,type Interval,type CandleResponse} from '@/lib/candles';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const cache=new Map<string,CandleResponse>();
const pending=new Map<string,Promise<CandleResponse>>();
async function requestCandles(symbol:string,interval:Interval):Promise<CandleResponse>{
  const query=new URLSearchParams({symbol:`${symbol}USDT`,interval,limit:'120'});
  for(const host of ['https://data-api.binance.vision','https://api.binance.com']){
    try{
      const response=await fetch(`${host}/api/v3/klines?${query}`,{cache:'no-store',signal:AbortSignal.timeout(6500),headers:{Accept:'application/json'}});
      if(!response.ok){if(response.status===429||response.status===418)break;continue;}
      return {source:'Binance',symbol,interval,updatedAt:Date.now(),candles:parseCandles(await response.json())};
    }catch{/* No generated candles on failure. */}
  }
  throw new Error('Candle source unavailable');
}
export async function GET(request:Request){
  const query=new URL(request.url).searchParams,symbol=query.get('symbol')??'',interval=query.get('interval')??'';
  if(!tradedSymbols.some(s=>s===symbol)||!Object.values(intervals).some(i=>i===interval))return NextResponse.json({error:'Неподдерживаемая пара или интервал.'},{status:400});
  const key=`${symbol}:${interval}`;
  try{
    const cached=cache.get(key);
    if(cached&&Date.now()-cached.updatedAt<10000)return NextResponse.json(cached,{headers:{'Cache-Control':'no-store'}});
    let job=pending.get(key);
    if(!job){job=requestCandles(symbol,interval as Interval).then(data=>{cache.set(key,data);return data;}).finally(()=>pending.delete(key));pending.set(key,job);}
    return NextResponse.json(await job,{headers:{'Cache-Control':'no-store'}});
  }catch{return NextResponse.json({error:'Свечи Binance временно недоступны.'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'15'}});}
}
