import {t} from './i18n.js';
import {runtimeText,terminalOutput} from './runtime-text.js';
import {contextDockerSuggestions} from './command-help.js';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {stringify} from 'yaml';
import {fileDraft,updateFileDraft,parseManifestDraft,commandCompletions,stateChanges,resourceDiagnostics,WORKBENCH_LIMITS,pasteExceedsLimit} from './workbench.js';
import {objects,quantity,suggestionWords} from './engine.js';
import {Icon} from './icons.jsx';
import {IconButton,Modal,Status,download} from './ui.jsx';

export function Terminal({entries,onCommand,command,setCommand,state,inputRef,history,level}) {
 const bottom=useRef(null),[cursor,setCursor]=useState(history.length),[draft,setDraft]=useState(''),[completion,setCompletion]=useState(null);
 useEffect(()=>{const output=bottom.current?.parentElement;if(output)output.scrollTop=output.scrollHeight;},[entries]);
 useEffect(()=>{setCursor(history.length);},[history]);
 const completionMessage=completion?.candidates
  ? completion.candidates.length>1?t('{0}/{1} öneri · Tab değiştirir · Esc kapatır',[completion.index+1,completion.candidates.length]):t('Komut tamamlandı.')
  : completion?.message?t(completion.message):command.length>=WORKBENCH_LIMITS.command?t('Komut 8000 karakter sınırına ulaştı. Daha fazla metin eklemek için kısalt.'):t('Ctrl+L temizle · tek komut / Enter');
 function paste(event){
  if(pasteExceedsLimit(event.target,event.clipboardData.getData('text'),WORKBENCH_LIMITS.command)){
   event.preventDefault();setCompletion({message:'Yapıştırma 8000 karakter sınırını aşıyor; komut değiştirilmedi.'});
  }
 }
 function key(event){
  if(event.key==='ArrowUp'){
   event.preventDefault();setCompletion(null);
   if(cursor===history.length)setDraft(command);
   const next=Math.max(0,cursor-1);setCursor(next);setCommand(history[next]||'');return;
  }
  if(event.key==='ArrowDown'){
   event.preventDefault();setCompletion(null);
   const next=Math.min(history.length,cursor+1);setCursor(next);setCommand(next===history.length?draft:history[next]);return;
  }
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='l'){
   event.preventDefault();setCompletion(null);onCommand('clear');return;
  }
  if(event.ctrlKey&&event.key.toLowerCase()==='c'){
   if(event.target.selectionStart!==event.target.selectionEnd)return;
   event.preventDefault();setCommand('');setCompletion({message:'Giriş temizlendi.'});return;
  }
  if(event.key==='Escape'&&completion){event.preventDefault();setCompletion(null);return;}
  if(event.key!=='Tab')return;
  if(event.shiftKey){setCompletion(null);return;}
  // Editing the middle of a command keeps ordinary keyboard navigation.
  if(event.target.selectionStart!==command.length||event.target.selectionEnd!==command.length)return;
  const cycling=completion?.candidates?.[completion.index]===command;
  if(cycling&&completion.candidates.length===1){setCompletion(null);return;}
  const candidates=cycling?completion.candidates:commandCompletions(command,state,[...contextDockerSuggestions(state),...suggestionWords]);
  if(!candidates.length){setCompletion(null);return;}
  event.preventDefault();
  const index=cycling?(completion.index+1)%candidates.length:0;
  setCommand(candidates[index]);setCompletion({candidates,index});
 }
 function submit(event){event.preventDefault();if(!command.trim())return;onCommand(command.trim());setCommand('');setCompletion(null);setDraft('');}
 const candidateStart=completion?.candidates?Math.max(0,Math.min(completion.index-2,completion.candidates.length-5)):0;
 return <section className="terminal" aria-label={t('Simüle terminal')}>
  <div className="terminal-bar"><span className="terminal-dots"><i/><i/><i/></span><span>learner@{state.context} <b>~</b></span></div>
  <div className="terminal-output" tabIndex={0} aria-label={t('Terminal çıktısı')}>
   <div className="terminal-welcome"><span>learn-k8s / lab {String(level.id).padStart(3,'0')}</span><p>{t('Gerçek shell değil. Güvenle dene, değişimi izle.')}<br/><em>help</em> {t('komutları gösterir.')} <em>↑ ↓</em> {t('geçmiş ·')} <em>Tab</em> {t('tamamlama')}</p>{level.module===0&&<p className="terminal-docker-help">{t('Docker yardımı: help docker · docker run --help')}</p>}</div>
   {entries.map((entry,index)=><div className={`terminal-entry ${entry.error?'terminal-error':''}`} key={index}><div className="echo">{entry.command}</div>{entry.output&&<pre>{terminalOutput(entry)}</pre>}</div>)}
   <span ref={bottom}/>
  </div>
  <form className="terminal-input-row" onSubmit={submit}>
   <label htmlFor="terminal-input" className="sr-only">{t('Terminal komutu')}</label>
   <input id="terminal-input" ref={inputRef} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} maxLength={WORKBENCH_LIMITS.command} value={command} onChange={event=>{setCommand(event.target.value);setCompletion(null);}} onKeyDown={key} onPaste={paste} placeholder={t('Bir komut yaz…')} aria-describedby={completion||command.length>=WORKBENCH_LIMITS.command?'terminal-completion-status':undefined}/>
   <button type="submit" aria-label={t('Komutu çalıştır')}><Icon name="arrow" size={14}/></button>
  </form>
  {completion?.candidates?.length>1&&<div className="terminal-completions" role="group" aria-label={t('Komut önerileri')}>
   {completion.candidates.slice(candidateStart,candidateStart+5).map((candidate,index)=><button type="button" tabIndex={-1} key={candidate} aria-pressed={candidateStart+index===completion.index} onMouseDown={event=>event.preventDefault()} onClick={()=>{setCommand(candidate);setCompletion(null);inputRef.current?.focus();}}><code>{candidate.trimEnd()}</code></button>)}
  </div>}
  <div className="terminal-footer"><span><i/> namespace: {state.namespace}</span><span id="terminal-completion-status" aria-live="polite">{completionMessage}</span></div>
  <div className="sr-only" role="status" aria-live="polite">{entries.at(-1)?.error?t('Komut hatası. '):''}{terminalOutput(entries.at(-1)).slice(0,250)}</div>
 </section>;
}
const resourceLabel=r=>r.status?.reason||r.status?.phase||(r.kind==='Deployment'?t('{0}/{1} hazır',[r.status?.readyReplicas||0,r.spec.replicas??1]):r.kind==='Job'?t('{0} tamamlandı',[r.status?.succeeded||0]):r.kind==='Service'?r.spec.type||'ClusterIP':r.kind==='Node'?(r.spec.unschedulable?'SchedulingDisabled':'Ready'):t('Tanımlı'));
export function Cluster({state,level,traceIndex,sequence,inspect}){
 const active=state.trace[traceIndex]?.actor||'',pods=objects(state,'Pod'),nodes=objects(state,'Node'),deployments=state.objects.filter(r=>['Deployment','StatefulSet','DaemonSet','Job'].includes(r.kind));
 if(level.module===0)return <div className="docker-topology" key={sequence}><div className={`registry-block ${active==='Registry'?'pulse':''}`}><Icon name="cube" size={30}/><b>Registry</b><span>{t('Image kaynağı')}</span></div><div className="diagram-connector"><span>pull</span><Icon name="arrow"/></div><div className="image-store"><div className="node-title"><Icon name="file"/><b>{t('Yerel image deposu')}</b><span>{state.docker.images.length}</span></div>{state.docker.images.length?state.docker.images.map(image=><div className="image-item" key={image}><Icon name="cube" size={16}/><code>{image}</code></div>):<p className="empty-slot">{t('Henüz bir image yok.')}<br/>{t('İlk pull komutunla burası dolacak.')}</p>}</div><div className="diagram-connector"><span>run</span><Icon name="arrow"/></div><div className="container-store"><div className="node-title"><Icon name="terminal"/><b>{t('Container örnekleri')}</b></div>{state.docker.containers.length?state.docker.containers.map(c=><div className={`container-chip pop ${c.status==='Running'?'':'stopped'}`} key={c.name}><span className="pod-dot"/><div><b>{c.name}</b><small>{c.image}</small></div><Status text={c.status} good={c.status==='Running'}/></div>):<p className="empty-slot">{t('Paket ≠ çalışan süreç.')}<br/>{t('Bir container başlat.')}</p>}</div><div className="diagram-caption">{t('Katmanlar yalnız görselleştirilir; hiçbir image indirilmez.')}</div></div>;
 const pending=pods.filter(p=>!p.spec.nodeName),others=state.objects.filter(r=>['PersistentVolumeClaim','ConfigMap','Secret','Ingress','NetworkPolicy','HorizontalPodAutoscaler','PodDisruptionBudget','Role','RoleBinding','CronJob'].includes(r.kind));
 return <div className="cluster-canvas"><div className="control-plane"><div className="plane-label">CONTROL PLANE <span>{t('istenen durumu korur')}</span></div><div className="control-components">{[['API server',t('istek ve doğrulama')],['etcd',t('küme durumu')],['Scheduler',t('node seçimi')],['Controller',t('yakınsama döngüsü')]].map(([name,desc])=><div key={name} className={`control-item ${active===name?'pulse':''}`}><i/><div><b>{name}</b><small>{desc}</small></div></div>)}</div></div><div className="control-wire"><span>{active||'API → reconciliation → node'}</span></div>{deployments.length>0&&<div className="workload-line">{deployments.map(d=><button key={`${d.kind}/${d.metadata.namespace}/${d.metadata.name}`} onClick={()=>inspect(d)} className="workload-chip"><Icon name={d.kind==='Job'?'clock':'grid'} size={14}/><b>{d.metadata.name}</b><span>{d.kind}</span><strong>{d.status?.readyReplicas??d.status?.active??0}/{d.spec.replicas??d.status?.replicas??d.spec.parallelism??1}</strong></button>)}</div>}<div className="nodes">{nodes.map(node=>{const children=pods.filter(p=>p.spec.nodeName===node.metadata.name);const used=children.reduce((sum,p)=>sum+(p.spec.containers||[]).reduce((a,c)=>a+quantity(c.resources?.requests?.cpu,true),0),0);return <section className={`node ${node.spec.unschedulable?'cordoned':''}`} key={node.metadata.name}><button className="node-title" onClick={()=>inspect(node)}><Icon name="server"/><b>{node.metadata.name}</b><span className="node-light"/></button><div className="node-meta"><span>{node.spec.unschedulable?'SchedulingDisabled':`${node.metadata.labels.zone} · 2 CPU / 2 GiB`}</span><span>{children.length} Pod</span></div><div className="cpu-track" title={`CPU requests: ${used}m / 2000m`}><span style={{width:`${Math.min(100,used/20)}%`}}/></div><div className="pod-grid">{children.length?children.map(p=><PodCard key={`${p.metadata.name}-${p._sim?.id}`} pod={p} inspect={inspect}/>):<div className="empty-node">{t('Yeni bir iş yükü için hazır')}</div>}</div><div className="kubelet"><i className={active==='Kubelet'?'pulse':''}/> kubelet <span>↔ runtime</span></div></section>;})}</div>{pending.length>0&&<div className="pending-row"><span>{t('YERLEŞİM BEKLİYOR')}</span>{pending.map(p=><PodCard key={p.metadata.name} pod={p} inspect={inspect}/>)}</div>}{objects(state,'Service').length>0&&<div className="service-layer">{objects(state,'Service').map(svc=>{const ep=state.objects.find(r=>r.kind==='EndpointSlice'&&r.metadata.namespace===svc.metadata.namespace&&r.metadata.labels?.['kubernetes.io/service-name']===svc.metadata.name);return <button className={`service-card ${active==='Service'?'pulse':''}`} key={svc.metadata.namespace+'/'+svc.metadata.name} onClick={()=>inspect(svc)}><Icon name="link"/><div><b>{svc.metadata.name}</b><span>{svc.spec.clusterIP}:{svc.spec.ports[0]?.port}</span></div><strong>{ep?.endpoints?.length||0} endpoint</strong></button>;})}</div>}{others.length>0&&<div className="related-resources">{others.map(r=><button onClick={()=>inspect(r)} key={`${r.kind}/${r.metadata.namespace}/${r.metadata.name}`}><Icon name={r.kind==='Secret'?'lock':r.kind==='PersistentVolumeClaim'?'server':'file'} size={13}/><span>{r.kind==='PersistentVolumeClaim'?'PVC':r.kind==='HorizontalPodAutoscaler'?'HPA':r.kind==='PodDisruptionBudget'?'PDB':r.kind}</span><b>{r.metadata.name}</b></button>)}</div>}<div className="diagram-caption"><span><i/> {t('Hazır')}</span><span><i className="amber"/> {t('Hazır değil')}</span><span>{t('Nesnelere tıklayarak ayrıntılarını aç.')}</span></div></div>;
}
function PodCard({pod:p,inspect}){return <button className={`pod-card pop ${p.status.ready?'ready':'not-ready'}`} onClick={()=>inspect(p)} title={`${p.metadata.name} · ${p.status.reason}`}><span className="pod-dot"/><div><b>{p.metadata.name}</b><small>{p.status.reason}{!p.status.ready&&p.status.reason==='Running'?' · NotReady':''}</small></div><span className="pod-count">{p.status.ready?p.spec.containers.length:0}/{p.spec.containers.length}</span></button>;}
export function Trace({state,index,setIndex,playing,setPlaying,speed,setSpeed}){return <div className="trace-panel"><div className="trace-heading"><div><span className="eyebrow">{t('OLAY AKIŞI')}</span><small>{state.trace.length?`${index+1} / ${state.trace.length}`:t('Komut bekleniyor')}</small></div><div><IconButton icon={playing?'pause':'play'} label={playing?t('Animasyonu duraklat'):t('Animasyonu oynat')} onClick={()=>setPlaying(!playing)}/><select aria-label={t('Animasyon hızı')} value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select><button className="text-button" onClick={()=>setIndex(Math.max(0,state.trace.length-1))}>{t('Sonuca git')}</button></div></div><div className="trace-content" aria-live="off">{state.trace.length?<><span className={`trace-actor ${state.trace[index]?.tone||''}`}>{state.trace[index]?.actor}</span><p>{runtimeText(state.trace[index]?.text)}</p></>:<><span className="trace-actor">{t('Senin sıran')}</span><p>{t('Bir komut çalıştır. API, controller ve node arasındaki adımlar burada görünsün.')}</p></>}</div>{state.trace.length>1&&<input className="trace-range" type="range" min={0} max={state.trace.length-1} value={index} aria-label={t('Olay adımı')} onChange={e=>{setPlaying(false);setIndex(Number(e.target.value));}}/>}</div>;}
const diffValue=value=>value===undefined?'—':typeof value==='string'?value:JSON.stringify(value);
function ChangeFields({fields}) {
 return <div className="change-table-scroll"><table className="change-fields"><thead><tr><th>{t('Alan')}</th><th>{t('Önce')}</th><th>{t('Sonra')}</th></tr></thead><tbody>{fields.slice(0,24).map(field=><tr key={field.path}><th scope="row"><code>{field.path}</code></th><td><code>{diffValue(field.before)}</code></td><td><code>{diffValue(field.after)}</code></td></tr>)}</tbody></table>{fields.length>24&&<p className="fine-print">{t('İlk {0}/{1} alan gösteriliyor. Tam nesne için kaynak ayrıntısını aç.',[24,fields.length])}</p>}</div>;
}
export function CommandChanges({previousState,state,command}) {
 const changes=useMemo(()=>stateChanges(previousState,state),[previousState,state]);
 if(!changes)return null;
 const total=changes.resources.length+changes.context.length;
 const labels={added:t('Eklendi'),removed:t('Silindi'),updated:t('Değişti')};
 return <details className="command-diff">
  <summary><span>{t('Ne değişti?')}</span><small>{total?t('{0} kaynak · {1} oturum alanı',[changes.resources.length,changes.context.length]):t('Değişiklik yok')}</small></summary>
  <div className="command-diff-content" tabIndex={0} role="region" aria-label={t('Kaynak farkları')}>
   {command&&<code className="diff-command">{command}</code>}
   {!total&&<p>{t('Bu komut gözlenen kaynak durumunu değiştirmedi.')}</p>}
   {changes.resources.map(resource=>resource.change==='updated'
    ?<details className="resource-change" key={resource.key}><summary><span><b>{resource.kind}/{resource.name}</b>{resource.namespace&&<small>{resource.namespace}</small>}</span><em className="change-updated">{labels.updated}</em></summary><ChangeFields fields={resource.fields}/></details>
    :<div className="resource-change resource-change-line" key={resource.key}><span><b>{resource.kind}/{resource.name}</b>{resource.namespace&&<small>{resource.namespace}</small>}</span><em className={`change-${resource.change}`}>{labels[resource.change]}</em></div>)}
   {changes.context.length>0&&<section className="session-change"><h3>{t('Oturum')}</h3><ChangeFields fields={changes.context}/></section>}
  </div>
 </details>;
}
export function ResourceDiagnostics({state,resource}) {
 const diagnostic=useMemo(()=>state?resourceDiagnostics(state,resource):null,[state,resource]);
 if(!diagnostic)return null;
 if(diagnostic.type==='scheduling')return <details className="resource-diagnostics">
  <summary>{t('Yerleşim kontrolleri')}</summary>
  {diagnostic.nodes.length?<div className="diagnostic-scroll" tabIndex={0}><table><thead><tr><th>Node</th><th>{t('Gözlenen engeller')}</th></tr></thead><tbody>{diagnostic.nodes.map(node=>{
   const reasons=[];
   if(node.unschedulable)reasons.push(t('Cordon: yeni Pod kabul etmiyor.'));
   if(!node.selectorMatches)reasons.push(t('nodeSelector eşleşmiyor.'));
   if(!node.toleratesTaints)reasons.push(t('Taint için toleration eksik.'));
   if(node.requested.cpu>node.available.cpu)reasons.push(t('CPU request {0}m; kullanılabilir {1}m.',[node.requested.cpu,node.available.cpu]));
   if(node.requested.memory>node.available.memory)reasons.push(t('Bellek request {0} MiB; kullanılabilir {1} MiB.',[node.requested.memory,node.available.memory]));
   return <tr key={node.node}><th scope="row"><code>{node.node}</code></th><td>{reasons.length?<ul>{reasons.map(reason=><li key={reason}>{reason}</li>)}</ul>:t('Bu modelde yerleşim için uygun.')}</td></tr>;
  })}</tbody></table></div>:<p>{t('Kümede node yok.')}</p>}
 </details>;
 return <details className="resource-diagnostics service-diagnostics">
  <summary>{t('Service yolu')}</summary>
  <div className="diagnostic-selector"><span>namespace: <code>{diagnostic.namespace}</code></span><span>selector: <code>{diagnostic.selector?Object.entries(diagnostic.selector).map(([key,value])=>`${key}=${value}`).join(', ')||'{}':t('Tanımlı değil')}</code></span></div>
  {!diagnostic.selector?<p>{t('Selector tanımlı değil; otomatik endpoint seçimi yok.')}</p>:diagnostic.pods.length?<div className="diagnostic-scroll" tabIndex={0}><table><thead><tr><th>Pod</th><th>Readiness</th><th>EndpointSlice</th></tr></thead><tbody>{diagnostic.pods.map(pod=><tr key={pod.name}><th scope="row"><code>{pod.name}</code></th><td>{pod.ready?t('Hazır'):t('Hazır değil')}<small>{pod.reason}</small></td><td>{pod.endpoint?t('Listede'):t('Listede değil')}</td></tr>)}</tbody></table></div>:<p>{t('Bu namespace’te selector ile eşleşen Pod yok.')}</p>}
  {diagnostic.ports.length>0&&<section className="diagnostic-ports"><h3>{t('Port bildirimleri')}</h3>{diagnostic.ports.map((port,index)=><div key={index}><code>Service {port.port} → targetPort {port.targetPort}</code>{port.declarations.filter(item=>item.known&&!item.matches).map(item=><p className="diagnostic-issue" key={item.pod}>{t('{0}: targetPort={1} ile eşleşen container port bildirimi yok.',[item.pod,port.targetPort])}</p>)}{port.declarations.filter(item=>!item.known).map(item=><p key={item.pod}>{t('{0}: container port bilgisi bildirilmemiş.',[item.pod])}</p>)}</div>)}</section>}
  {diagnostic.policies.length>0&&<p>{t('Hedefleri seçen NetworkPolicy: {0}',[diagnostic.policies.join(', ')])}</p>}
  <p className="fine-print">{t('Ulaşılabilirliği kaynak Pod’dan yapılan istekle doğrula.')}</p>
 </details>;
}
export function FileEditor({state,onFiles,notify,drafts,onDrafts,selectedFile,onSelectedFile}) {
 const names=Object.keys(state.files);
 const [localDrafts,setLocalDrafts]=useState({}),[localSelected,setLocalSelected]=useState(names[0]||'');
 const [error,setError]=useState(''),[name,setName]=useState('custom.yaml');
 const storedDrafts=onDrafts?(drafts||{}):localDrafts;
 const requested=selectedFile??localSelected;
 const selected=names.includes(requested)?requested:names[0]||'';
 const {text,dirty}=fileDraft(state.files,storedDrafts,selected);
 const limitMessage=text.length>=WORKBENCH_LIMITS.manifest?'YAML metni 200.000 karakter sınırına ulaştı. Daha fazla metin eklemek için kısalt.':name.length>=WORKBENCH_LIMITS.filename?'Dosya adı en fazla 200 karakter olabilir.':'';
 function selectFile(file){setLocalSelected(file);onSelectedFile?.(file);}
 function writeDraft(value,isDirty=true){
  const next=updateFileDraft(storedDrafts,selected,value,isDirty);
  if(onDrafts)onDrafts(next);else setLocalDrafts(next);
  setError('');
 }
 useEffect(()=>{setError('');if(requested!==selected)selectFile(selected);},[selected,requested]);
 function save(){
  try{
   const result=parseManifestDraft(text);
   onFiles({...state.files,[selected]:result});
   writeDraft(text,false);
   setError('');
   notify(t('Dosya kaydedildi. Küme için terminalde apply çalıştır.'));
  }catch(error){setError(error.message);}
 }
 function add(){
  if(name.length>WORKBENCH_LIMITS.filename){setError('Dosya adı en fazla 200 karakter olabilir.');return;}
  if(!/^[a-zA-Z0-9._-]+\.ya?ml$/.test(name)){setError('Basit bir .yaml veya .yml dosya adı kullan.');return;}
  if(Object.hasOwn(state.files,name)){setError('Bu dosya zaten var.');return;}
  if(names.length>=25){setError('En fazla 25 laboratuvar dosyası oluşturulabilir.');return;}
  onFiles({...state.files,[name]:[{apiVersion:'v1',kind:'Pod',metadata:{name:'custom'},spec:{containers:[{name:'web',image:'nginx:1.27'}]}}]});
  // Each file keeps its own draft; opening a new file never discards the old one.
  selectFile(name);
  setError('');
 }
 function editorKey(event){
  if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();save();}
  if(event.key==='Tab'&&!event.shiftKey){
   event.preventDefault();
   const editor=event.target,start=editor.selectionStart,end=editor.selectionEnd;
   if(pasteExceedsLimit(editor,'  ',WORKBENCH_LIMITS.manifest)){setError('YAML metni 200.000 karakter sınırına ulaştı. Daha fazla metin eklemek için kısalt.');return;}
   writeDraft(text.slice(0,start)+'  '+text.slice(end));
   requestAnimationFrame(()=>{if(editor.isConnected)editor.selectionStart=editor.selectionEnd=start+2;});
  }
 }
 function paste(event,maximum,message){
  if(pasteExceedsLimit(event.target,event.clipboardData.getData('text'),maximum)){
   event.preventDefault();setError(message);
  }
 }
 return <div className="file-editor">
  <div className="file-toolbar">
   <select aria-label={t('Laboratuvar dosyası')} value={selected} onChange={event=>selectFile(event.target.value)}>
    {!names.length&&<option value="">{t('Dosya yok')}</option>}
    {names.map(file=><option key={file}>{file}</option>)}
   </select>
   <span>{dirty?t('Kaydedilmedi'):t('Bellekte kayıtlı')}</span>
   <IconButton icon="download" label={t('Manifesti indir')} disabled={!selected} onClick={()=>download(selected,text,'text/yaml')}/>
  </div>
  {selected?<>
   <textarea aria-label={t('YAML düzenleyici')} className="yaml-editor" spellCheck={false} maxLength={WORKBENCH_LIMITS.manifest} value={text} onChange={event=>writeDraft(event.target.value)} onKeyDown={editorKey} onPaste={event=>paste(event,WORKBENCH_LIMITS.manifest,'Yapıştırma 200.000 karakter sınırını aşıyor; YAML değiştirilmedi.')} aria-describedby={error||limitMessage?'file-editor-message':undefined}/>
   <div className="file-footer"><span>{t('Kaydetmek apply etmez. Gerçek sırlarını buraya yazma.')}</span><button className="button primary small" onClick={save}>{t('Doğrula ve kaydet')}</button></div>
  </>:<div className="empty-files"><Icon name="file" size={32}/><h3>{t('Bu seviyede hazır manifest yok.')}</h3><p>{t('Komutlarla ilerle veya kendi denemen için bir YAML dosyası oluştur.')}</p></div>}
  {(error||limitMessage)&&<p className="inline-error" id="file-editor-message" role="alert">{t(error||limitMessage)}</p>}
  <div className="new-file"><input aria-label={t('Yeni dosya adı')} maxLength={WORKBENCH_LIMITS.filename} value={name} onChange={event=>{setName(event.target.value);setError('');}} onPaste={event=>paste(event,WORKBENCH_LIMITS.filename,'Yapıştırma 200 karakter sınırını aşıyor; dosya adı değiştirilmedi.')} aria-describedby={error||limitMessage?'file-editor-message':undefined}/><button className="text-button" onClick={add}>{t('+ Dosya oluştur')}</button></div>
 </div>;
}
export function ResourceList({state,inspect}){const [kind,setKind]=useState('all');const kinds=[...new Set(state.objects.map(r=>r.kind))].sort();const rows=state.objects.filter(r=>kind==='all'||r.kind===kind);return <div className="resource-list"><div className="file-toolbar"><select aria-label={t('Kaynak türü filtresi')} value={kind} onChange={e=>setKind(e.target.value)}><option value="all">{t('Bütün kaynaklar')}</option>{kinds.map(k=><option key={k}>{k}</option>)}</select><span>{rows.length} {t('nesne')}</span></div><div className="inventory-scroll"><table><thead><tr><th>{t('Kaynak')}</th><th>{t('Ad / namespace')}</th><th>{t('Durum')}</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td><span className="kind-tag">{r.kind}</span></td><td><button onClick={()=>inspect(r)}>{r.metadata.name}</button><small>{r.metadata.namespace||'cluster-scoped'}</small></td><td>{resourceLabel(r)}</td></tr>)}</tbody></table></div></div>;}
export function Inspector({resource,onClose,state}){let clean=resource?structuredClone(resource):null;if(clean)delete clean._sim;return <Modal open={!!resource} onOpenChange={v=>!v&&onClose()} title={resource?`${resource.kind} / ${resource.metadata.name}`:t('Kaynak ayrıntısı')} description={t('Simüle kümenin gözlenen nesnesi. Dahili öğretim alanları gerçek API şeması değildir.')} wide><div className="inspector-body">{resource&&<><div className="inspector-summary"><Status text={resourceLabel(resource)} good={!resource.status||resource.status.ready!==false}/><span>{resource.metadata.namespace||t('Küme kapsamı')}</span><IconButton icon="download" label={t('Nesne YAML dosyasını indir')} onClick={()=>download(`${resource.metadata.name}.yaml`,stringify(clean),'text/yaml')}/></div>{resource._sim?.message&&<p className="inspector-message">{runtimeText(resource._sim.message)}</p>}<ResourceDiagnostics state={state} resource={resource}/><pre className="code-block">{stringify(clean)}</pre><p className="fine-print">{t('status.ready / status.reason bu görselleştirmeye ait sadeleştirilmiş alanlardır. Gerçek Pod API’sinde koşullar ve containerStatuses kullanılır.')}</p></>}</div></Modal>;}
export function Workspace({state,level,sequence,entries,onCommand,command,setCommand,inputRef,history,onFiles,notify,settings,onSetting,drafts,onDrafts,selectedFile,onSelectedFile,previousState,activeTask}){
 const [tab,setTab]=useState('terminal'),[inspect,setInspect]=useState(null),[traceIndex,setTraceIndex]=useState(0),[playing,setPlaying]=useState(true),[infoOpen,setInfoOpen]=useState(false),[topologyOpen,setTopologyOpen]=useState(true);
 const infoRef=useRef(null);
 useEffect(()=>{setTraceIndex(settings.reduced?Math.max(0,state.trace.length-1):0);},[state.trace,settings.reduced]);
 useEffect(()=>{if(!playing||settings.reduced||traceIndex>=state.trace.length-1)return;const id=setTimeout(()=>setTraceIndex(i=>Math.min(i+1,state.trace.length-1)),600/settings.speed);return()=>clearTimeout(id);},[playing,traceIndex,state.trace,settings.speed,settings.reduced]);
 useEffect(()=>{setTab('terminal');setInspect(null);setInfoOpen(false);},[level.id]);
 useEffect(()=>{if(!infoOpen)return;const onPointer=e=>{if(!infoRef.current?.contains(e.target))setInfoOpen(false);};const onKey=e=>{if(e.key==='Escape')setInfoOpen(false);};document.addEventListener('pointerdown',onPointer);document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('pointerdown',onPointer);document.removeEventListener('keydown',onKey);};},[infoOpen]);
 return <section className="workspace" aria-label={t('Canlı laboratuvar ve terminal')}>
  <div className="zone-marker zone-marker-workbench"><span className="workbench-label">02 · WORKBENCH <span className="workbench-info" ref={infoRef}><button className="workbench-info-trigger" type="button" aria-label={t('Gerçek kümede aklında tut')} aria-expanded={infoOpen} aria-controls="real-cluster-note" onClick={()=>setInfoOpen(value=>!value)}><Icon name="info" size={14}/></button>{infoOpen&&<div className="workbench-info-popover" id="real-cluster-note" role="note"><strong>{t('Gerçek kümede')}</strong><p>{level.caution}</p></div>}</span></span><b>{t('Uygula · sonucu izle')}</b></div>
  <div className="workspace-heading"><div><span className="live-dot"/><h2>{t('Canlı laboratuvar')}</h2></div><button type="button" className="text-button topology-toggle" aria-expanded={topologyOpen} aria-controls="workspace-topology" aria-label={topologyOpen?t('Topolojiyi gizle'):t('Topolojiyi göster')} onClick={()=>setTopologyOpen(value=>!value)}>{t('Topoloji')}<Icon name="chevron" size={13}/></button></div>
  <div id="workspace-topology" hidden={!topologyOpen}><Cluster state={state} level={level} sequence={sequence} traceIndex={traceIndex} inspect={setInspect}/><Trace state={state} index={traceIndex} setIndex={setTraceIndex} playing={playing} setPlaying={setPlaying} speed={settings.speed} setSpeed={value=>onSetting('speed',value)}/></div>
  <CommandChanges previousState={previousState} state={state} command={entries.at(-1)?.command}/>
  {activeTask&&<details className="mobile-active-task"><summary><b>{t('Aktif görev')}</b><span>{activeTask}</span></summary><p>{activeTask}</p></details>}
  <Tabs.Root value={tab} onValueChange={setTab} className="lab-tabs">
   <Tabs.List className="tab-list" aria-label={t('Laboratuvar araçları')}><Tabs.Trigger value="terminal"><Icon name="terminal" size={16}/>Terminal</Tabs.Trigger><Tabs.Trigger value="files"><Icon name="file" size={16}/>{t('Dosyalar')} <span>{Object.keys(state.files).length}</span></Tabs.Trigger><Tabs.Trigger value="resources"><Icon name="grid" size={16}/>{t('Kaynaklar')} <span>{state.objects.length}</span></Tabs.Trigger></Tabs.List>
   <Tabs.Content value="terminal" forceMount hidden={tab!=='terminal'}><Terminal {...{entries,onCommand,command,setCommand,state,inputRef,history,level}}/></Tabs.Content>
   <Tabs.Content value="files" forceMount hidden={tab!=='files'}><FileEditor {...{state,onFiles,notify,drafts,onDrafts,selectedFile,onSelectedFile}}/></Tabs.Content>
   <Tabs.Content value="resources"><ResourceList state={state} inspect={setInspect}/></Tabs.Content>
  </Tabs.Root>
  <Inspector resource={inspect} state={state} onClose={()=>setInspect(null)}/>
 </section>;
}
