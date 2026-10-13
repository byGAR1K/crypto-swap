'use client';
import {useEffect,useRef,useState} from 'react';
import {validCandleResponse,type CandleResponse,type Interval} from '@/lib/candles';
export function useCandles(symbol:string,interval:Interval){
  const [snapshot,setSnapshot]=useState<CandleResponse|null>(null);
  const [problem,setProblem]=useState<{key:string,message:string}|null>(null);
  const [now,setNow]=useState(0);
  const refreshRef=useRef<()=>void>(()=>{});
  const key=`${symbol}:${interval}`;
  useEffect(()=>{
    let alive=true,busy=false,timer:ReturnType<typeof setTimeout>|undefined,controller:AbortController|undefined;
    async function refresh(){
      if(!alive||busy)return;clearTimeout(timer);
      if(document.visibilityState==='hidden'){timer=setTimeout(refresh,15000);return;}
      busy=true;controller=new AbortController();const timeout=setTimeout(()=>controller?.abort(),15000);
      try{
        const query=new URLSearchParams({symbol,interval});
        const response=await fetch(`/api/candles?${query}`,{cache:'no-store',signal:controller.signal});
        if(!response.ok)throw new Error('Источник свечей временно недоступен');
        const result:unknown=await response.json();
        if(!validCandleResponse(result,symbol,interval))throw new Error('Некорректные данные графика');
        if(alive){setSnapshot(result);setProblem(null);setNow(Date.now());}
      }catch(e){if(alive)setProblem({key,message:e instanceof Error&&e.name!=='AbortError'?e.message:'Превышено время ожидания свечей'});}
      finally{clearTimeout(timeout);busy=false;if(alive)timer=setTimeout(refresh,15000);}
    }
    refreshRef.current=()=>{void refresh();};
    const onVisible=()=>{if(document.visibilityState==='visible')void refresh();};
    document.addEventListener('visibilitychange',onVisible);void refresh();
    const clock=setInterval(()=>setNow(Date.now()),5000);
    return()=>{alive=false;controller?.abort();clearTimeout(timer);clearInterval(clock);document.removeEventListener('visibilitychange',onVisible);};
  },[symbol,interval,key]);
  // A late response or previous pair is never drawn under the newly selected pair.
  const data=snapshot?.symbol===symbol&&snapshot.interval===interval?snapshot:null;
  const error=problem?.key===key?problem.message:'';
  const status=!data?(error?'error':'loading'):error||now-data.updatedAt>45000?'stale':'live';
  return {data,status,error,refresh:()=>refreshRef.current()};
}
