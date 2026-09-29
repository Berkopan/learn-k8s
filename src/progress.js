import {levels, CURRICULUM_VERSION} from './curriculum.js';
const KEY='learn-k8s:progress:v1';
export const freshProgress=()=>({version:CURRICULUM_VERSION,completed:{},bookmarks:[],notes:{},quiz:{},active:1,days:[],settings:{sound:false,free:false,reduced:false,speed:1}});
const record=x=>x&&typeof x==='object'&&!Array.isArray(x);
const validId=x=>Number.isInteger(Number(x))&&Number(x)>=1&&Number(x)<=levels.length;
/** Treat imported/localStorage content as untrusted. Ignore unknown properties. */
export function validateProgress(input){
  if(!record(input)||input.version!==CURRICULUM_VERSION)throw new Error('Bu dosya desteklenen learn-k8s ilerleme biçiminde değil.');
  const p=freshProgress();
  if(record(input.completed))for(const [id,v] of Object.entries(input.completed))if(validId(id)&&record(v)&&typeof v.date==='string'&&/^\d{4}-\d{2}-\d{2}/.test(v.date)){p.completed[id]={date:v.date.slice(0,30),assisted:!!v.assisted};}
  if(Array.isArray(input.bookmarks))p.bookmarks=[...new Set(input.bookmarks.filter(validId).map(Number))];
  if(record(input.notes))for(const [id,text] of Object.entries(input.notes))if(validId(id)&&typeof text==='string')p.notes[id]=text.slice(0,5000);
  if(record(input.quiz))for(const [id,v] of Object.entries(input.quiz))if(Number.isInteger(Number(id))&&Number(id)>=0&&Number(id)<16&&v===true)p.quiz[id]=true;
  if(validId(input.active))p.active=Number(input.active);
  if(Array.isArray(input.days))p.days=[...new Set(input.days.filter(x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)))].sort().slice(-366);
  if(record(input.settings)){for(const k of ['sound','free','reduced'])p.settings[k]=input.settings[k]===true;if([0.5,1,2].includes(input.settings.speed))p.settings.speed=input.settings.speed;}
  return p;
}
export function loadProgress(storage){try{const raw=storage?.getItem(KEY);return raw?validateProgress(JSON.parse(raw)):freshProgress();}catch{return freshProgress();}}
export function saveProgress(storage,p){try{storage?.setItem(KEY,JSON.stringify(p));return true;}catch{return false;}}
export const today=()=>new Date().toLocaleDateString('sv-SE');
export function completeLevel(progress,id,assisted=false,date=today()){
  if(!validId(id))throw new Error('Geçersiz seviye.');if(progress.completed[id])return progress;
  return {...progress,completed:{...progress.completed,[id]:{date,assisted}},days:[...new Set([...progress.days,date])].sort().slice(-366)};
}
export const xpTotal=p=>levels.reduce((sum,l)=>sum+(p.completed[l.id]?l.xp:0),0);
export const isUnlocked=(p,id)=>id===1||p.settings.free||!!p.completed[id]||!!p.completed[id-1];
export const moduleDone=(p,id)=>levels.filter(l=>l.module===id).every(l=>p.completed[l.id]);
export function streak(p,date=today()){const days=new Set(p.days),d=new Date(date+'T12:00:00');if(!days.has(date))d.setDate(d.getDate()-1);let n=0;while(days.has(d.toLocaleDateString('sv-SE'))){n++;d.setDate(d.getDate()-1);}return n;}
