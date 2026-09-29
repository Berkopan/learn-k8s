import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import {Icon} from './icons.jsx';
export function Tip({label,children}){return <Tooltip.Root delayDuration={400}><Tooltip.Trigger asChild>{children}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="tooltip" sideOffset={7}>{label}<Tooltip.Arrow/></Tooltip.Content></Tooltip.Portal></Tooltip.Root>;}
export function IconButton({icon,label,...props}){return <Tip label={label}><button type="button" className="icon-button" aria-label={label} {...props}><Icon name={icon}/></button></Tip>;}
export function Modal({open,onOpenChange,title,description,children,wide=false}){return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className={`dialog ${wide?'dialog-wide':''}`}><div className="dialog-heading"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div><Dialog.Close asChild><IconButton icon="close" label="Kapat"/></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;}
export function download(name,content,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function Status({text,good=true}){return <span className={`status ${good?'good':'warn'}`}><i/>{text}</span>;}
export function ProgressBar({value,max,label}){return <div className="progress-track" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><span style={{width:`${Math.min(100,100*value/max)}%`}}/></div>;}
export class Boundary extends React.Component{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<main className="error-boundary"><Icon name="info" size={40}/><h1>Atölye durakladı.</h1><p>İlerleme tarayıcıda korunur. Sayfayı yenileyerek laboratuvarı yeniden açabilirsin.</p><button onClick={()=>location.reload()}>Sayfayı yenile</button></main>:this.props.children;}}
