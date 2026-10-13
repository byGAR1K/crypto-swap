import type { CSSProperties } from 'react';
const paths: Record<string,string> = {
  trade:'M5 4v16M3 9h4v6H3zM12 2v18M10 5h4v8h-4zM19 6v16M17 11h4v7h-4z',
  markets:'M4 20V12h3v8M10 20V7h3v13M16 20V3h3v17',
  wallet:'M20 8V5H4a2 2 0 0 0 0 4h17v11H4a2 2 0 0 1-2-2V7M21 12h-6v4h6M17 14h.01',
  history:'M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2',
  settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 3 3 1 2 5-2 4-3 1-1 4H9l-1-4-3-1-2-4 2-5 3-1z',
  search:'M21 21l-5-5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14',
  bell:'M6 8a6 6 0 0 1 12 0v6l2 3H4l2-3zM10 21h4',
  chevron:'M7 10l5 5 5-5',plus:'M12 5v14M5 12h14',
  arrow:'M5 12h14M14 7l5 5-5 5',up:'M12 19V5M7 10l5-5 5 5',
  star:'M12 3l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  close:'M6 6l12 12M6 18L18 6', info:'M12 11v6M12 7h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  globe:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2c6 6 6 14 0 20-6-6-6-14 0-20',
  help:'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  check:'M5 12l4 4L19 6', logout:'M10 4H4v16h6M9 12h12M17 8l4 4-4 4', swap:'M4 8h16M16 4l4 4-4 4M20 16H4M8 12l-4 4 4 4',
  expand:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',line:'M3 17l5-7 5 4 8-10',shield:'M12 2l8 4v6c0 5-8 10-8 10S4 17 4 12V6zM8 12l3 3 5-6'
};
export default function Icon({name,size=20,style}:{name:string,size?:number,style?:CSSProperties}) {return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]||paths.info}/></svg>;}
