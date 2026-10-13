'use client';
import {useMemo,useState} from 'react';
import {candles,format} from '@/lib/market';
export default function Chart({price,seed,timeframe,line}:{price:number,seed:number,timeframe:string,line:boolean}) {
  const [hover,setHover]=useState<number|null>(null);
  const series=useMemo(()=>candles(seed+['15м','1ч','4ч','1д','1н'].indexOf(timeframe)*4),[seed,timeframe]);
  const min=Math.min(...series.map(c=>c.low))-8,max=Math.max(...series.map(c=>c.high))+8;
  const y=(v:number)=>310-(v-min)/(max-min)*280;
  const px=(i:number)=>22+i*10.6;
  const points=series.map((c,i)=>`${px(i)},${y(c.close)}`).join(' ');
  const last=y(series.at(-1)!.close);
  const value=(v:number)=>price*(.95+(v-min)/(max-min)*.065);
  return <div className="chart-surface"><svg viewBox="0 0 730 405" role="img" aria-label={`${line?'Линейный':'Свечной'} демо-график, период ${timeframe}`} onMouseMove={e=>{const box=e.currentTarget.getBoundingClientRect();setHover(Math.max(0,Math.min(59,Math.round(((e.clientX-box.left)/box.width*730-22)/10.6))));}} onMouseLeave={()=>setHover(null)}>
    <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6edbaa" stopOpacity=".22"/><stop offset="100%" stopColor="#6edbaa" stopOpacity="0"/></linearGradient></defs>
    {[0,1,2,3,4,5].map(i=><g key={i}><line x1="10" y1={35+i*55} x2="645" y2={35+i*55} stroke="#232b30" /><text x="658" y={39+i*55} fill="#74828b" fontSize="12">{format(value(max-i*(max-min)/5),price<1?4:price<10?2:0)}</text></g>)}
    {[0,1,2,3,4,5,6,7].map(i=><line key={i} x1={15+i*90} y1="20" x2={15+i*90} y2="365" stroke="#1d252a"/>)}
    {line?<><polygon points={`22,310 ${points} ${px(59)},310`} fill="url(#area)"/><polyline points={points} fill="none" stroke="#7bdeb1" strokeWidth="2"/></>:series.map((c,i)=><g key={i} fill={c.close>=c.open?'#79deb1':'#e78087'} stroke={c.close>=c.open?'#79deb1':'#e78087'}><line x1={px(i)} x2={px(i)} y1={y(c.high)} y2={y(c.low)} strokeWidth="1"/><rect x={px(i)-3} y={y(Math.max(c.open,c.close))} width="6" height={Math.max(2,Math.abs(y(c.open)-y(c.close)))} stroke="none" rx=".6"/></g>)}
    <line x1="10" x2="645" y1={last} y2={last} stroke="#83dfb8" strokeDasharray="4 4" strokeOpacity=".6"/><rect x="650" y={last-11} width="78" height="22" rx="4" fill="#b5f4d3"/><text x="689" y={last+4} textAnchor="middle" fill="#10271e" fontSize="12" fontWeight="700">{format(price,price<1?4:2)}</text>
    {series.map((c,i)=><rect key={i} x={px(i)-3} y={366-c.volume} width="6" height={c.volume} fill={c.close>=c.open?'#79deb1':'#e78087'} opacity=".3"/>)}
    {['09:00','10:00','11:00','12:00','13:00','14:00','15:00'].map((t,i)=><text key={t} x={22+i*99} y="391" fill="#74828b" fontSize="12">{t}</text>)}
    {hover!==null&&<g><line x1={px(hover)} x2={px(hover)} y1="15" y2="368" stroke="#a2acb2" strokeDasharray="3 5"/><circle cx={px(hover)} cy={y(series[hover].close)} r="4" fill="#b5f4d3"/><rect x={Math.min(px(hover),495)} y="12" width="146" height="27" rx="5" fill="#263137"/><text x={Math.min(px(hover),495)+10} y="30" fill="#dce9e1" fontSize="12">Демо: {format(value(series[hover].close),price<1?4:2)}</text></g>}
  </svg><span className="chart-watermark">NORDEX</span></div>;
}
