'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {validQuotes,type QuotesResponse} from '@/lib/quotes';
export function useQuotes():{data:QuotesResponse|null,error:string,status:'loading'|'live'|'stale'|'error',refresh:()=>void}{
  const [data,setData]=useState<QuotesResponse|null>(null);
  const [error,setError]=useState('');
  const [now,setNow]=useState(0);
  const refreshRef=useRef<()=>void>(()=>{});
  useEffect(()=>{
    let alive=true,busy=false;
    let timer:ReturnType<typeof setTimeout>|undefined;
    let controller:AbortController|undefined;
    async function refresh(){
      if(busy||!alive)return;
      clearTimeout(timer);
      if(document.visibilityState==='hidden'){timer=setTimeout(refresh,15000);return;}
      busy=true;controller=new AbortController();
      const timeout=setTimeout(()=>controller?.abort(),15000);
      try{
        const response=await fetch('/api/quotes',{cache:'no-store',signal:controller.signal});
        if(!response.ok)throw new Error('Источник котировок временно недоступен');
        const result:unknown=await response.json();
        if(!validQuotes(result))throw new Error('Некорректный ответ источника котировок');
        if(alive){setData(result);setError('');setNow(Date.now());}
      }catch(err){if(alive)setError(err instanceof Error&&err.name!=='AbortError'?err.message:'Источник котировок не ответил вовремя');}
      finally{clearTimeout(timeout);busy=false;if(alive)timer=setTimeout(refresh,15000);}
    }
    refreshRef.current=()=>{void refresh();};
    const onVisible=()=>{if(document.visibilityState==='visible')void refresh();};
    document.addEventListener('visibilitychange',onVisible);
    void refresh();
    const clock=setInterval(()=>setNow(Date.now()),5000);
    return()=>{alive=false;controller?.abort();clearTimeout(timer);clearInterval(clock);document.removeEventListener('visibilitychange',onVisible);};
  },[]);
  const status=!data?(error?'error':'loading'):error||now-data.updatedAt>45000?'stale':'live';
  const refresh=useCallback(()=>refreshRef.current(),[]);
  return {data,error,status,refresh};
}
