import {available,type DemoState} from './market';
export const PROMO_DEPOSIT=30,PROMO_STAKE=30,PROMO_BONUS=10;
export function promoState(state:DemoState){return state.promo??{deposited:0,staked:0,bonusClaimed:false};}
export function addDemoFunds(state:DemoState,amount:number,withdraw=false):DemoState{
  if(!Number.isFinite(amount)||amount<=0||amount>1e8)throw new Error('Введите сумму от 0 до 100 000 000 USDT.');
  if(withdraw&&amount>available(state,'USDT'))throw new Error('Недостаточно свободного баланса.');
  const promo=promoState(state);
  return {...state,balances:{...state.balances,USDT:state.balances.USDT+(withdraw?-amount:amount)},promo:{...promo,deposited:promo.deposited+(withdraw?0:amount)}};
}
export function activatePromo(state:DemoState):DemoState{
  const promo=promoState(state);
  if(promo.bonusClaimed)throw new Error('Бонус по этой акции уже получен.');
  if(promo.deposited<PROMO_DEPOSIT)throw new Error('Сначала пополните кошелёк суммарно на 30 USDT.');
  if(available(state,'USDT')<PROMO_STAKE)throw new Error('Для стейкинга нужны 30 свободных USDT.');
  return {...state,balances:{...state.balances,USDT:state.balances.USDT+PROMO_BONUS},promo:{...promo,staked:PROMO_STAKE,bonusClaimed:true}};
}
export function releasePromoStake(state:DemoState):DemoState{
  const promo=promoState(state);if(!promo.staked)throw new Error('Нет активного стейкинга.');
  // Unlock the reserve, do not credit the principal again: it's already in total balance.
  return {...state,promo:{...promo,staked:0}};
}
