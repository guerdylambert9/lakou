import React, { useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { isPast } from '../lib/logic.js'
import { Chip, Empty } from '../components/ui.jsx'
import { EventCard } from '../components/cards.jsx'
import { PageHead } from '../components/Layout.jsx'

export default function Events() {
  const { t, s } = useApp()
  const [kind, setKind] = useState('all')
  const sorted = [...s.events].sort((a, b) => (a.start < b.start ? -1 : 1)).filter((e) => kind === 'all' || e.kind === kind)
  const upcoming = sorted.filter((e) => !isPast(e.end || e.start))
  const past = sorted.filter((e) => isPast(e.end || e.start))
  const kinds = [
    ['all', t('all')],
    ['public', t('public')],
    ['invite', t('invite')],
    ['virtual', t('virtual')],
    ['ticketed', t('ticket')],
  ]
  return (
    <div className="stack-16">
      <PageHead title={t('ceremonies')} sub={t('upcoming')} />
      <div className="chips" role="group" aria-label={t('ceremonies')}>
        {kinds.map(([k, label]) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
            {label}
          </Chip>
        ))}
      </div>
      {upcoming.length === 0 && past.length === 0 && <Empty icon="calendar" title={t('nothingYet')} />}
      {upcoming.length > 0 && (
        <div className="grid-events">
          {upcoming.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
      {past.length > 0 && (
        <>
          <h2 className="subhead">{t('past')}</h2>
          <div className="grid-events">
            {past.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
