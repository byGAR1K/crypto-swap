// Browser-only demo accounts. These are not server authentication or access control.
export type User={id:string,name:string,email:string,createdAt:string};
type StoredUser=User&{salt:string,passwordHash:string};
const ACCOUNTS='nordex-local-accounts-v1',SESSION='nordex-local-session-v1';
const hex=(bytes:ArrayBuffer|Uint8Array)=>Array.from(new Uint8Array(bytes)).map(n=>n.toString(16).padStart(2,'0')).join('');
function readAccounts():StoredUser[]{
  const raw=localStorage.getItem(ACCOUNTS);if(!raw)return [];
  const data:unknown=JSON.parse(raw);
  if(!Array.isArray(data)||!data.every(u=>u&&typeof u.id==='string'&&typeof u.name==='string'&&typeof u.email==='string'&&typeof u.createdAt==='string'&&/^[a-f0-9]{32}$/.test(u.salt)&&/^[a-f0-9]{64}$/.test(u.passwordHash)))throw new Error('Не удалось прочитать локальные аккаунты.');
  return data as StoredUser[];
}
function profile(u:StoredUser):User{return {id:u.id,name:u.name,email:u.email,createdAt:u.createdAt};}
async function hashPassword(password:string,salt:string){
  if(!globalThis.crypto?.subtle)throw new Error('Для локального входа откройте сайт через HTTPS или localhost.');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const saltBytes=new Uint8Array(salt.match(/.{2}/g)!.map(n=>parseInt(n,16)));
  return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:saltBytes,iterations:120000,hash:'SHA-256'},key,256));
}
function startSession(id:string,remember:boolean){
  if(remember){localStorage.setItem(SESSION,id);sessionStorage.removeItem(SESSION);}else{sessionStorage.setItem(SESSION,id);localStorage.removeItem(SESSION);}
}
export function currentUser():User|null{
  const id=sessionStorage.getItem(SESSION)||localStorage.getItem(SESSION);
  if(!id)return null;
  const user=readAccounts().find(u=>u.id===id);return user?profile(user):null;
}
export async function registerUser({name,email,password,remember}:{name:string,email:string,password:string,remember:boolean}):Promise<User>{
  name=name.trim();email=email.trim().toLowerCase();
  if(name.length<2||name.length>40)throw new Error('Имя должно содержать от 2 до 40 символов.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new Error('Укажите корректный email.');
  if(password.length<8||password.length>128)throw new Error('Пароль должен содержать от 8 до 128 символов.');
  const salt=hex(crypto.getRandomValues(new Uint8Array(16))),passwordHash=await hashPassword(password,salt);
  // Re-read after async hashing so concurrent registrations don't overwrite an account.
  const users=readAccounts();if(users.some(u=>u.email===email))throw new Error('Этот email уже зарегистрирован в этом браузере. Войдите в аккаунт.');
  const user:StoredUser={id:crypto.randomUUID(),name,email,createdAt:new Date().toISOString(),salt,passwordHash};
  localStorage.setItem(ACCOUNTS,JSON.stringify([...users,user]));startSession(user.id,remember);return profile(user);
}
export async function loginUser({email,password,remember}:{email:string,password:string,remember:boolean}):Promise<User>{
  const user=readAccounts().find(u=>u.email===email.trim().toLowerCase());
  if(!user||password.length>128||await hashPassword(password,user.salt)!==user.passwordHash)throw new Error('Неверный email или пароль.');
  startSession(user.id,remember);return profile(user);
}
export function logoutUser(){localStorage.removeItem(SESSION);sessionStorage.removeItem(SESSION);}
export function accountStateKey(userId:string){return `nordex-demo-account-v1:${userId}`;}
export function initials(user:User){return user.name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();}
