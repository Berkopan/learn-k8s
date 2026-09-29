import React from 'react';
const paths={
 cube:<><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9M8 5.3l8 4.5"/></>,
 arrow:<><path d="M5 12h14m-5-5 5 5-5 5"/></>,check:<path d="m5 12 4 4L19 6"/>,lock:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
 search:<><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,book:<><path d="M12 6C9 3 5 3 3 4v15c4-1 6-1 9 1 3-2 5-2 9-1V4c-2-1-6-1-9 2Zm0 0v14"/></>,
 terminal:<><path d="m5 6 5 6-5 6m8 0h6"/></>,grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
 trophy:<><path d="M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 14v6m-5 1h10"/></>,
 bookmark:<path d="M6 3h12v18l-6-4-6 4V3Z"/>,close:<path d="m6 6 12 12M6 18 18 6"/>,settings:<><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/></>,
 reset:<><path d="M3 5v6h6M4 10a8 8 0 1 1 2 8"/></>,play:<path d="m8 4 12 8-12 8V4Z"/>,pause:<><path d="M8 5v14M16 5v14"/></>,
 file:<><path d="M5 2h9l5 5v15H5V2Z"/><path d="M14 2v6h5M8 13h8M8 17h6"/></>,hint:<><path d="M8 16c0-3-3-4-3-7a7 7 0 0 1 14 0c0 3-3 4-3 7M8 18h8M9 21h6"/></>,
 external:<><path d="M14 3h7v7m0-7L10 14M10 4H4v16h16v-6"/></>,volume:<><path d="M3 9h4l5-5v16l-5-5H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/></>,
 info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>,chevron:<path d="m9 5 7 7-7 7"/>,download:<><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,upload:<><path d="M12 15V3m-5 5 5-5 5 5M4 16v5h16v-5"/></>,
 server:<><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M6 6h.1M6 17h.1M10 6h7M10 17h7"/></>,link:<><path d="m8 16 8-8m-6-3 1-1a5 5 0 0 1 7 7l-1 1m-7 7-1 1a5 5 0 0 1-7-7l1-1"/></>,moon:<path d="M21 13A9 9 0 0 1 11 3 9 9 0 1 0 21 13Z"/>,code:<><path d="m7 6-6 6 6 6m10-12 6 6-6 6m-4-14-2 16"/></>,menu:<path d="M4 6h16M4 12h16M4 18h16"/>,flag:<><path d="M5 21V3m0 1c5-5 9 5 15 0v10c-6 5-10-5-15 0"/></>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,zap:<path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z"/>,
};
export function Icon({name,size=18,...props}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]||paths.cube}</svg>;}
