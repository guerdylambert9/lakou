import React, { useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { openStatus } from '../lib/logic.js'
import { Chip, Empty } from '../components/ui.jsx'
import { ShopCard, shopOffers } from '../components/cards.jsx'
import { PageHead } from '../components/Layout.jsx'

export default function Shops() {
  const { t, shops, s } = useApp()
  const [filter, setFilter] = useState('all')
  const filters = [
    ['all', t('all')],
    ['open', t('openNow')],
    ['readings', t('readings')],
    ['baths', t('baths')],
    ['ships', t('ships')],
    ['kreyol', t('kreyol')],
    ['santeria', 'Santería'],
  ]
  const list = shops.filter((sh) => {
    const o = shopOffers(sh.id, s.services)
    switch (filter) {
      case 'open':
        return openStatus(sh.hours).open
      case 'readings':
        return o.readings
      case 'baths':
        return o.baths
      case 'ships':
        return sh.ships
      case 'kreyol':
        return sh.languages.includes('Kreyòl')
      case 'santeria':
        return sh.traditions.includes('Santería')
      default:
        return true
    }
  })
  return (
    <div className="stack-16">
      <PageHead title={t('shops')} sub={t('shopsNear')} />
      <div className="chips" role="group" aria-label={t('shops')}>
        {filters.map(([k, label]) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>
            {label}
          </Chip>
        ))}
      </div>
      {list.length ? (
        <div className="grid-shops">
          {list.map((sh) => (
            <ShopCard key={sh.id} shop={sh} />
          ))}
        </div>
      ) : (
        <Empty icon="store" title={t('nothingYet')} />
      )}
    </div>
  )
}
