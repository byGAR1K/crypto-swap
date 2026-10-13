'use client';
import {useId,useState} from 'react';
import {format} from '@/lib/market';
import {intervals} from '@/lib/candles';
import {useCandles} from '@/hooks/use-candles';

export default function Chart({symbol,timeframe,line}:{symbol:string,timeframe:string,line:boolean}){
  const interval=intervals[timeframe as keyof typeof intervals]??'1h';
  const feed=useCandles(symbol,interval),gradient=useId();
  const [hover,setHover]=useState<number|null>(null);
  const series=feed.data?.candles??[];
  const round=(n:number)=>Number(n.toFixed(3));
  const axis=(n:number)=>format(n,n<1?Math.min(8,Math.max(4,Math.ceil(-Math.log10(n))+2)):2);
  const clock=(t:number,long=false)=>new Intl.DateTimeFormat('ru-RU',{timeZone:'UTC',day:long||interval==='1d'||interval==='1w'?'2-digit':undefined,month:long||interval==='1d'||interval==='1w'?'2-digit':undefined,hour:interval==='1d'||interval==='1w'?undefined:'2-digit',minute:interval==='1d'||interval==='1w'?undefined:'2-digit'}).format(t);
  const label=feed.status==='live'?'Свечи Binance':feed.status==='loading'?'Загрузка графика…':feed.status==='stale'?'Свечи устарели':'График недоступен';
  if(!series.length)return <div className="real-chart-placeholder" role="status"><span className="chart-placeholder-symbol">{symbol}/USDT</span><b>{label}</b><p>{feed.error||'Получаем реальные свечи и объёмы торгов'}</p>{feed.status==='error'&&<button className="secondary" onClick={feed.refresh}>Повторить запрос</button>}</div>;
  const bottom=Math.min(...series.map(c=>c.low)),top=Math.max(...series.map(c=>c.high));
  const padding=Math.max((top-bottom)*.09,top*.0001),min=Math.max(0,bottom-padding),max=top+padding;
  const y=(price:number)=>round(302-(price-min)/(max-min)*271),x=(i:number)=>round(17+i*815/(series.length-1));
  const width=round(Math.max(2,Math.min(8,815/series.length*.65)));
  const last=series.at(-1)!;
  const maxVolume=Math.max(...series.map(c=>c.volume),1),points=series.map((c,i)=>`${x(i)},${y(c.close)}`).join(' ');
  const selected=series[Math.min(hover??series.length-1,series.length-1)];
  return <div className="real-chart"><div className={`real-chart-status ${feed.status}`} role="status"><span className="dot"/><b>{label}</b><span>{clock(feed.data!.updatedAt,true)} UTC · 15 сек</span>{feed.status==='stale'&&<button onClick={feed.refresh}>Обновить ↻</button>}</div><div className="chart-ohlc"><span>{clock(selected.time,true)} UTC</span><span>O <b>{axis(selected.open)}</b></span><span>H <b>{axis(selected.high)}</b></span><span>L <b>{axis(selected.low)}</b></span><span>C <b className={selected.close>=selected.open?'positive':'negative'}>{axis(selected.close)}</b></span><span>V <b>{format(selected.volume,2)} {symbol}</b></span></div>
  <svg viewBox="0 0 980 425" role="img" aria-label={`${line?'Линейный':'Свечной'} график Binance ${symbol}/USDT, интервал ${timeframe}`} onPointerMove={e=>{const svg=e.currentTarget,matrix=svg.getScreenCTM();if(!matrix)return;const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const local=p.matrixTransform(matrix.inverse());setHover(Math.max(0,Math.min(series.length-1,Math.round((local.x-17)/815*(series.length-1)))));}} onPointerLeave={()=>setHover(null)}>
  <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#83dfb8" stopOpacity=".22"/><stop offset="100%" stopColor="#83dfb8" stopOpacity="0"/></linearGradient></defs>
  {[0,1,2,3,4,5].map(i=>{const value=max-(max-min)*i/5,gy=y(value);return <g key={i}><line x1="8" x2="850" y1={gy} y2={gy} stroke="#233039"/><text x="865" y={round(gy+4)} fill="#8c9ea9" fontSize="13">{axis(value)}</text></g>;})}
  {[0,1,2,3,4,5,6].map(i=><line key={i} x1={round(17+i*815/6)} x2={round(17+i*815/6)} y1="16" y2="377" stroke="#1d2b31"/>)}
  {line?<><polygon points={`17,302 ${points} ${x(series.length-1)},302`} fill={`url(#${gradient})`}/><polyline points={points} fill="none" stroke="#83dfb8" strokeWidth="2"/></>:series.map((c,i)=>{const color=c.close>=c.open?'#83dfb8':'#e78087';return <g key={c.time} fill={color} stroke={color}><line x1={x(i)} x2={x(i)} y1={y(c.high)} y2={y(c.low)} strokeWidth="1"/><rect x={round(x(i)-width/2)} y={y(Math.max(c.open,c.close))} width={width} height={round(Math.max(1,Math.abs(y(c.open)-y(c.close))))} stroke="none" rx=".5"/></g>;})}
  <line x1="8" x2="850" y1={y(last.close)} y2={y(last.close)} stroke="#83dfb8" strokeDasharray="4 4" strokeOpacity=".65"/><rect x="858" y={round(y(last.close)-12)} width="120" height="24" rx="4" fill="#94f0cb"/><text x="918" y={round(y(last.close)+4)} textAnchor="middle" fill="#143727" fontSize="13" fontWeight="750">{axis(last.close)}</text>
  <text x="10" y="329" fill="#647f72" fontSize="11">Объём, {symbol}</text>
  {series.map((c,i)=>{const h=round(c.volume/maxVolume*38);return <rect key={c.time} x={round(x(i)-width/2)} y={round(377-h)} width={width} height={h} fill={c.close>=c.open?'#83dfb8':'#e78087'} opacity=".38"/>;})}
  {[0,1,2,3,4,5,6].map(i=>{const index=Math.round(i*(series.length-1)/6);return <text key={i} x={x(index)} y="410" textAnchor={i===0?'start':i===6?'end':'middle'} fill="#849aa5" fontSize="12">{clock(series[index].time,series.at(-1)!.time-series[0].time>=86400000)}</text>;})}
  {hover!==null&&hover<series.length&&<g><line x1={x(hover)} x2={x(hover)} y1="16" y2="377" stroke="#acbcb5" strokeDasharray="3 5"/><circle cx={x(hover)} cy={y(selected.close)} r="4" fill="#94f0cb" stroke="#111d17" strokeWidth="2"/></g>}
  </svg><div className="real-chart-caption">Интервал свечи: {timeframe} · Последняя свеча может быть незавершённой{feed.error&&<span>{feed.error}</span>}</div></div>;
}
