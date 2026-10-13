// Asset metadata and demo balances. UI prices come from useQuotes; fixture prices are never shown as live.
export const markets = [
  {symbol:'BTC',name:'Bitcoin',icon:'₿',color:'#f5a623',price:67432.8,change:2.84,volume:'1,24 млрд',balance:.125},
  {symbol:'ETH',name:'Ethereum',icon:'Ξ',color:'#8093df',price:3521.45,change:1.62,volume:'648,2 млн',balance:1.5},
  {symbol:'SOL',name:'Solana',icon:'≋',color:'#9a79ef',price:148.72,change:5.21,volume:'210,8 млн',balance:12},
  {symbol:'TON',name:'Toncoin',icon:'◇',color:'#37a8ee',price:6.84,change:-.91,volume:'42,1 млн',balance:250},
  {symbol:'USDT',name:'Tether',icon:'₮',color:'#48b99a',price:1,change:.01,volume:'2,18 млрд',balance:12450},
  {symbol:'XRP',name:'XRP',icon:'×',color:'#bcc7d3',price:.5248,change:-1.35,volume:'78,4 млн',balance:0},
  {symbol:'ADA',name:'Cardano',icon:'⁙',color:'#438ee9',price:.4526,change:3.12,volume:'36,7 млн',balance:0},
  {symbol:'DOGE',name:'Dogecoin',icon:'Ð',color:'#c8ad68',price:.1427,change:4.42,volume:'91,2 млн',balance:0}
] as const;
export type Symbol = typeof markets[number]['symbol'];
export type Side = 'buy'|'sell';
export type Order = {id:string,symbol:Symbol,side:Side,type:'limit'|'market',price:number,amount:number,status:'open'|'filled'|'cancelled',time:string};
export type DemoState = {balances:Record<Symbol,number>,orders:Order[],favorites:Symbol[],promo?:{deposited:number,staked:number,bonusClaimed:boolean}};
export const initialState:DemoState = {balances:Object.fromEntries(markets.map(m=>[m.symbol,m.balance])) as Record<Symbol,number>, orders:[], favorites:['BTC','ETH','TON']};
export function format(value:number,digits=2) {if(!Number.isFinite(value))return "—";return new Intl.NumberFormat('ru-RU',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);}
export function available(state:DemoState,symbol:Symbol) {
  const reserved = state.orders.filter(o=>o.status==='open').reduce((sum,o)=>sum+(symbol==='USDT'&&o.side==='buy'?o.price*o.amount:symbol===o.symbol&&o.side==='sell'?o.amount:0),0);
  return Math.max(0,state.balances[symbol]-reserved-(symbol==='USDT'?(state.promo?.staked??0):0));
}
export function placeOrder(state:DemoState,order:Order):DemoState {
  if (!Number.isFinite(order.amount)||!Number.isFinite(order.price)||!Number.isFinite(order.amount*order.price)||order.amount<=0||order.price<=0) throw new Error('Укажите корректную цену и количество.');
  const spendSymbol = order.side==='buy'?'USDT':order.symbol;
  const spend = order.side==='buy'?order.price*order.amount:order.amount;
  if (spend>available(state,spendSymbol)+1e-9) throw new Error('Недостаточно свободного баланса.');
  const balances={...state.balances};
  if(order.type==='market') {
    balances[spendSymbol]-=spend;
    balances[order.side==='buy'?order.symbol:'USDT']+=order.side==='buy'?order.amount:order.price*order.amount;
  }
  return {...state,balances,orders:[{...order,status:order.type==='market'?'filled':'open'},...state.orders]};
}
// Deterministic series avoids hydration mismatches and makes fixtures reproducible.
export function candles(seed=1,count=60) {return buildCandles(seed,count);}
function buildCandles(seed:number,count:number){
// Round trigonometric results before they reach SVG: engines can differ at ~1e-15.
  const stable=(value:number)=>Number(value.toFixed(6));
  let previous=20; return Array.from({length:count},(_,i)=>{
    const open=previous, close=stable(Math.max(8,open+Math.sin(i*1.71+seed)*5.6+1.12));
    previous=close; return {open,close,high:stable(Math.max(open,close)+2+Math.abs(Math.sin(i))*3),low:stable(Math.min(open,close)-2-Math.abs(Math.cos(i))*3),volume:stable(8+Math.abs(Math.sin(i*2.3+seed))*30)};
  });
}
export function isDemoState(v:unknown):v is DemoState {
  if (!v||typeof v!=='object') return false;
  const s=v as DemoState;
  return (s.promo===undefined||(!!s.promo&&Number.isFinite(s.promo.deposited)&&s.promo.deposited>=0&&[0,30].includes(s.promo.staked)&&typeof s.promo.bonusClaimed==='boolean'&&(s.promo.staked===0||s.promo.bonusClaimed)))&&!!s.balances&&markets.every(m=>Number.isFinite(s.balances[m.symbol])&&s.balances[m.symbol]>=0)&&Array.isArray(s.favorites)&&s.favorites.every(x=>markets.some(m=>m.symbol===x))&&Array.isArray(s.orders)&&s.orders.every(o=>o&&typeof o.id==='string'&&typeof o.time==='string'&&markets.some(m=>m.symbol===o.symbol)&&o.symbol!=='USDT'&&['buy','sell'].includes(o.side)&&['limit','market'].includes(o.type)&&['open','filled','cancelled'].includes(o.status)&&Number.isFinite(o.price)&&o.price>0&&Number.isFinite(o.amount)&&o.amount>0);
}
