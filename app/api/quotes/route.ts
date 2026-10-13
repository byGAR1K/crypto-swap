import {NextResponse} from 'next/server';
import {parseTickers,tradedSymbols,type QuotesResponse} from '@/lib/quotes';
export const runtime='nodejs';
export const dynamic='force-dynamic';
// Short server cache and one in-flight request per process reduce upstream load.
let cached:QuotesResponse|null=null;
let pending:Promise<QuotesResponse>|null=null;
async function requestQuotes():Promise<QuotesResponse>{
  const query=new URLSearchParams({symbols:JSON.stringify(tradedSymbols.map(s=>`${s}USDT`))});
  for(const host of ['https://data-api.binance.vision','https://api.binance.com']){
    try{
      const response=await fetch(`${host}/api/v3/ticker/24hr?${query}`,{cache:'no-store',signal:AbortSignal.timeout(6500),headers:{Accept:'application/json'}});
      if(!response.ok){if(response.status===429||response.status===418)break;continue;}
      const quotes=parseTickers(await response.json());
      return {source:'Binance',updatedAt:Date.now(),quotes};
    }catch{/* Try the other official public endpoint; no mock-price fallback. */}
  }
  throw new Error('Market feed unavailable');
}
export async function GET(){
  try{
    if(!cached||Date.now()-cached.updatedAt>12000){
      if(!pending)pending=requestQuotes().then(result=>{cached=result;return result;}).finally(()=>{pending=null;});
      const result=await pending;
      return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
    }
    return NextResponse.json(cached,{headers:{'Cache-Control':'no-store'}});
  }catch{
    // Never return cached data as a successful fresh response on upstream failure.
    return NextResponse.json({error:'Не удалось получить котировки Binance. Повторим автоматически.'},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'15'}});
  }
}
