import React, { useId } from 'react'
import { dayShort, monthShort } from '../i18n.js'
import { dowOf, splitLocal } from '../lib/logic.js'

// Drawn product and shop art, so the prototype needs no photos.
// Shapes are simple on purpose; real shops will upload their own pictures.

const GOLD = '#E3A21A'
const FLAME = '#F6B93B'
const FLAME_IN = '#FFF1BF'
const SEVEN = ['#C0392B', '#E67E22', '#F1C40F', '#27AE60', '#2980B9', '#8E44AD', '#F2EFE6']

const Shadow = ({ rx = 26 }) => <ellipse cx="60" cy="107" rx={rx} ry="4.5" fill="#000" opacity=".13" />

const Flame = ({ x = 60, y = 10, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0c7 9 9 15 0 21-9-6-7-12 0-21z" fill={FLAME} />
    <path d="M0 8c3.5 4 4 8 0 11-4-3-3.5-7 0-11z" fill={FLAME_IN} />
  </g>
)

function Candle({ c }) {
  return (
    <>
      <Shadow />
      <rect x="36" y="36" width="48" height="70" rx="7" fill={c} />
      <rect x="36" y="36" width="48" height="70" rx="7" fill="none" stroke="#000" strokeOpacity=".12" />
      <rect x="42" y="41" width="6" height="58" rx="3" fill="#fff" opacity=".3" />
      <rect x="36" y="58" width="48" height="28" fill="#fff" opacity=".92" />
      <path d="M60 63l8 9-8 9-8-9z" fill={c} stroke="#000" strokeOpacity=".15" />
      <rect x="59" y="30" width="2" height="7" rx="1" fill="#3B2A12" />
      <Flame y={10} />
    </>
  )
}

function Candle7() {
  return (
    <>
      <Shadow />
      {SEVEN.map((col, i) => (
        <rect key={col} x="36" y={36 + i * 10} width="48" height="10" fill={col} />
      ))}
      <rect x="36" y="36" width="48" height="70" rx="3" fill="none" stroke="#000" strokeOpacity=".15" />
      <rect x="42" y="41" width="6" height="58" rx="3" fill="#fff" opacity=".3" />
      <rect x="59" y="30" width="2" height="7" rx="1" fill="#3B2A12" />
      <Flame y={10} />
    </>
  )
}

function Novena({ c }) {
  return (
    <>
      <Shadow rx={20} />
      <rect x="42" y="26" width="36" height="80" rx="5" fill={c} />
      <rect x="46" y="42" width="28" height="44" rx="3" fill="#fff" opacity=".92" />
      <path d="M60 48a9 9 0 0 1 9 9v25H51V57a9 9 0 0 1 9-9z" fill="#7FA6D9" opacity=".75" />
      <circle cx="60" cy="56" r="5" fill={GOLD} />
      <rect x="59" y="20" width="2" height="7" rx="1" fill="#3B2A12" />
      <Flame y={2} s={0.9} />
    </>
  )
}

function Bottle({ c }) {
  return (
    <>
      <Shadow rx={22} />
      <rect x="51" y="10" width="18" height="12" rx="3" fill={GOLD} />
      <path d="M53 22h14v10c0 4 13 7 13 20v48a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6V52c0-13 13-16 13-20z" fill={c} />
      <path d="M53 22h14v10c0 4 13 7 13 20v48a6 6 0 0 1-6 6H46a6 6 0 0 1-6-6V52c0-13 13-16 13-20z" fill="none" stroke="#000" strokeOpacity=".12" />
      <path d="M47 56v38" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".3" />
      <rect x="44" y="62" width="32" height="26" rx="3" fill="#fff" opacity=".93" />
      <path d="M51 70h18M51 76h12M51 82h15" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
    </>
  )
}

function Rum({ c }) {
  return (
    <>
      <Shadow rx={22} />
      <rect x="53" y="8" width="14" height="12" rx="2" fill="#2B1B0E" />
      <path d="M54 20h12v16c8 4 12 10 12 18v46a6 6 0 0 1-6 6H48a6 6 0 0 1-6-6V54c0-8 4-14 12-18z" fill="#5C3A16" />
      <path d="M48 58v36" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".2" />
      <rect x="46" y="60" width="28" height="30" rx="3" fill={c} />
      <path d="M52 70h16M52 76h10" stroke="#3B2A12" strokeWidth="2.4" strokeLinecap="round" />
    </>
  )
}

function Herbs({ c }) {
  return (
    <>
      <Shadow rx={20} />
      <g fill={c}>
        <ellipse cx="60" cy="40" rx="9" ry="27" />
        <ellipse cx="44" cy="48" rx="8" ry="22" transform="rotate(-24 44 48)" />
        <ellipse cx="76" cy="48" rx="8" ry="22" transform="rotate(24 76 48)" />
        <ellipse cx="33" cy="63" rx="7" ry="17" transform="rotate(-50 33 63)" />
        <ellipse cx="87" cy="63" rx="7" ry="17" transform="rotate(50 87 63)" />
      </g>
      <g stroke="#fff" strokeOpacity=".45" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M60 18v44" />
        <path d="M44 30l8 34" />
        <path d="M76 30l-8 34" />
      </g>
      <path d="M55 64h10l-2 41h-6z" fill="#6B4E2E" />
      <rect x="51" y="72" width="18" height="6" rx="2" fill={GOLD} />
    </>
  )
}

function Saint({ c }) {
  return (
    <>
      <Shadow rx={30} />
      <rect x="28" y="14" width="64" height="90" rx="4" fill={GOLD} />
      <rect x="34" y="20" width="52" height="78" rx="2" fill={c} />
      <path d="M60 30a16 16 0 0 1 16 16v44H44V46a16 16 0 0 1 16-16z" fill="#fff" opacity=".2" />
      <circle cx="60" cy="50" r="11" fill={GOLD} opacity=".9" />
      <circle cx="60" cy="52" r="6" fill="#F3E3C8" />
      <path d="M47 90c1-17 25-17 26 0z" fill="#F3E3C8" opacity=".85" />
    </>
  )
}

function Flag({ c }) {
  const dots = []
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++)
      dots.push(<circle key={`${i}-${j}`} cx={23.5 + i * 10.4} cy={23.5 + j * 10.4} r="2.6" fill={(i + j) % 2 ? '#F2C14E' : '#fff'} opacity=".55" />)
  const fringe = []
  for (let k = 0; k < 11; k++) fringe.push(<path key={k} d={`M${22 + k * 7.6} 102v7`} />)
  return (
    <>
      <rect x="18" y="18" width="84" height="84" rx="4" fill={c} />
      {dots}
      <path d="M60 30l30 30-30 30-30-30z" fill="none" stroke="#F2C14E" strokeWidth="3" />
      <path d="M60 44l16 16-16 16-16-16z" fill="#fff" opacity=".9" />
      <path d="M60 52l8 8-8 8-8-8z" fill={c} />
      <g stroke={GOLD} strokeWidth="2" strokeLinecap="round">{fringe}</g>
    </>
  )
}

function Beads({ c }) {
  const beads = []
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2 - Math.PI / 2
    beads.push(<circle key={k} cx={60 + 33 * Math.cos(a)} cy={56 + 33 * Math.sin(a)} r="5" fill={k % 2 ? c : '#fff'} stroke={c} strokeWidth="1.5" />)
  }
  return (
    <>
      {beads}
      <path d="M60 89l7 9-7 9-7-9z" fill={GOLD} />
    </>
  )
}

function Scarf({ c }) {
  return (
    <>
      <Shadow rx={34} />
      <path d="M14 38h92L60 100z" fill={c} />
      <path d="M14 38h92l-8 10H22z" fill="#000" opacity=".14" />
      <path d="M30 52l30 36 30-36" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="2" strokeDasharray="3 4" />
    </>
  )
}

function Dress({ c }) {
  return (
    <>
      <Shadow rx={34} />
      <path d="M48 14h24l4 14-6 7 23 67H27l23-67-6-7z" fill={c} stroke="#8F877A" strokeOpacity=".6" />
      <path d="M50 35h20" stroke="#8F877A" strokeOpacity=".5" strokeWidth="2.5" />
    </>
  )
}

function Kit({ c }) {
  return (
    <>
      <Shadow rx={36} />
      <rect x="30" y="36" width="12" height="30" rx="3" fill="#6B3FA0" />
      <rect x="54" y="30" width="12" height="36" rx="3" fill="#1F1A24" />
      <rect x="78" y="36" width="12" height="30" rx="3" fill="#6B3FA0" />
      <Flame x={36} y={16} s={0.8} />
      <Flame x={60} y={10} s={0.8} />
      <Flame x={84} y={16} s={0.8} />
      <rect x="22" y="56" width="76" height="49" rx="6" fill={c} />
      <rect x="22" y="56" width="76" height="12" rx="6" fill="#000" opacity=".2" />
      <rect x="56" y="56" width="8" height="49" fill={GOLD} />
      <path d="M60 74l8 8-8 8-8-8z" fill="#fff" opacity=".92" />
    </>
  )
}

function Cigars({ c }) {
  return (
    <>
      <Shadow rx={36} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={18 + i * 4} y={38 + i * 20} width="80" height="13" rx="6.5" fill={c} />
          <rect x={18 + i * 4} y={38 + i * 20} width="9" height="13" rx="4.5" fill="#A89E92" />
          <rect x={70 + i * 4} y={38 + i * 20} width="11" height="13" fill={GOLD} />
        </g>
      ))}
    </>
  )
}

function Chalk() {
  return (
    <>
      <Shadow rx={34} />
      {[
        [44, 58],
        [76, 54],
        [50, 86],
        [80, 84],
      ].map(([x, y]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx="15" ry="18" fill="#F4F1EA" stroke="#B9B0A0" />
      ))}
    </>
  )
}

const ART = { candle: Candle, candle7: Candle7, novena: Novena, bottle: Bottle, rum: Rum, herbs: Herbs, image: Saint, flag: Flag, beads: Beads, scarf: Scarf, dress: Dress, kit: Kit, cigars: Cigars, chalk: Chalk }

export function ProductArt({ product, className = '' }) {
  const Comp = ART[product.art] || Candle
  return (
    <div className={`art ${className}`} style={{ '--c': product.color }}>
      <svg viewBox="0 0 120 120" role="img" aria-label={product.name}>
        <Comp c={product.color} />
      </svg>
    </div>
  )
}

/** Banner in the shop's colors: sequin dots and a row of diamonds, like the border of a drapo. */
export function ShopBanner({ shop, className = '' }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const dots = `d${uid}`
  const zig = `z${uid}`
  return (
    <svg className={`banner ${className}`} viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <pattern id={dots} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="1.8" fill={shop.banner.dot} opacity=".4" />
        </pattern>
        <pattern id={zig} width="20" height="20" patternUnits="userSpaceOnUse" y="100">
          <path d="M10 3l7 7-7 7-7-7z" fill={shop.banner.dot} opacity=".8" />
        </pattern>
      </defs>
      <rect width="400" height="120" fill={shop.banner.base} />
      <rect width="400" height="120" fill={`url(#${dots})`} />
      <circle cx="338" cy="30" r="64" fill={shop.banner.dot} opacity=".12" />
      <rect y="100" width="400" height="20" fill={`url(#${zig})`} />
    </svg>
  )
}

/** Calendar stub: month, day number, weekday. */
export function DateStub({ start, lang, muted }) {
  const { ymd } = splitLocal(start)
  const [, m, d] = ymd.split('-').map(Number)
  return (
    <div className={`datestub ${muted ? 'is-muted' : ''}`} aria-hidden="true">
      <span className="ds-m">{monthShort(lang, m - 1)}</span>
      <span className="ds-d">{d}</span>
      <span className="ds-w">{dayShort(lang, dowOf(ymd))}</span>
    </div>
  )
}

export function Wordmark({ sub }) {
  return (
    <span className="wordmark-wrap">
      <span className="wordmark">Lakou</span>
      {sub && <span className="wordmark-sub">{sub}</span>}
    </span>
  )
}
