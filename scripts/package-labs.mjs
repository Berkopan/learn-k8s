#!/usr/bin/env node
import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const LAB_IDS=Object.freeze(['deployment-repair','service-selector','configmap-refresh']);
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../public/labs');
const crcTable=Array.from({length:256},(_,value)=>{
  for(let bit=0;bit<8;bit++)value=value&1?(value>>>1)^0xedb88320:value>>>1;
  return value>>>0;
});
function crc32(data){let value=0xffffffff;for(const byte of data)value=crcTable[(value^byte)&0xff]^(value>>>8);return (value^0xffffffff)>>>0;}

// ZIP's stored method keeps these small text packages byte-for-byte stable
// across zlib versions. Entry order, timestamps and Unix permissions are fixed.
export function buildLabArchive(id){
  if(!LAB_IDS.includes(id))throw new Error(`Unknown lab: ${id}`);
  const directory=join(root,id),locals=[],central=[];
  let offset=0;
  const files=readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0);
  for(const file of files){
    if(!file.isFile()||!(/\.(?:md|yaml|sh)$/).test(file.name))throw new Error(`Unsupported lab source: ${id}/${file.name}`);
    const name=Buffer.from(`${id}/${file.name}`,'utf8'),data=readFileSync(join(directory,file.name)),crc=crc32(data);
    const local=Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x0800,6);
    local.writeUInt16LE(0x0021,12); // 1980-01-01, midnight; stored compression.
    local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
    locals.push(local,name,data);
    const entry=Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50,0);entry.writeUInt16LE((3<<8)|20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x0800,8);
    entry.writeUInt16LE(0x0021,14);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(data.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(name.length,28);
    const mode=file.name.endsWith('.sh')?0o100755:0o100644;
    entry.writeUInt32LE((mode<<16)>>>0,38);entry.writeUInt32LE(offset,42);
    central.push(entry,name);offset+=local.length+name.length+data.length;
  }
  const directoryBytes=Buffer.concat(central),end=Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directoryBytes.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,directoryBytes,end]);
}

export const archivePath=id=>join(root,`${id}.zip`);
function main(){
  const arguments_=process.argv.slice(2);
  if(arguments_.some(value=>value!=='--check'))throw new Error('Usage: node scripts/package-labs.mjs [--check]');
  const check=arguments_.includes('--check');
  let stale=false;
  for(const id of LAB_IDS){
    const data=buildLabArchive(id),path=archivePath(id);
    if(check){
      if(!existsSync(path)||!data.equals(readFileSync(path))){process.stderr.write(`Outdated lab archive: ${id}.zip\n`);stale=true;}
    }else writeFileSync(path,data);
  }
  if(stale){process.exitCode=1;return;}
  process.stdout.write(`${LAB_IDS.length} lab archives ${check?'are up to date':'written'}.\n`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{main();}catch(error){process.stderr.write(`${error.message}\n`);process.exitCode=1;}
}
