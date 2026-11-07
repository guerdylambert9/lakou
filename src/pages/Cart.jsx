import React from 'react'
import { useApp } from '../lib/store.jsx'
import { useRouter } from '../lib/router.jsx'
import { cartLines, groupByShop, canShip, shopTotals, cartTotals, methodFor, money, price, newId, pickupCode, shopNow, SHIPPING_FLAT } from '../lib/logic.js'
import { Button, Empty, Icon, Stepper, Toggle } from '../components/ui.jsx'
import { ProductArt } from '../components/Art.jsx'
import { PageHead } from '../components/Layout.jsx'

export default function Cart() {
  const { t, s, dispatch, shop, customerLabel, toast } = useApp()
  const { navigate } = useRouter()
  const groups = groupByShop(cartLines(s.cart, s.products))
  const totals = cartTotals(groups, s.methods)

  if (!groups.length) {
    return (
      <div className="stack-16">
        <PageHead title={t('cart')} />
        <Empty icon="bag" title={t('emptyCart')}>
          <Button onClick={() => navigate('/')}>{t('browseSupplies')}</Button>
        </Empty>
      </div>
    )
  }

  const placeOrder = () => {
    const today = shopNow().ymd
    const orders = groups.map((g) => {
      const method = methodFor(g, s.methods)
      const id = newId('A')
      return {
        id,
        shopId: g.shopId,
        customerId: 'you',
        customerName: customerLabel,
        lines: g.lines.map((l) => ({ productId: l.productId, name: l.product.name, price: l.product.price, qty: l.qty })),
        method,
        discreet: s.discreet,
        totals: shopTotals(g.lines, method),
        status: 'placed',
        createdAt: today,
        code: pickupCode(id),
      }
    })
    dispatch({ type: 'order/place', orders })
    toast(t('orderPlaced'))
    navigate(`/order/${orders.map((o) => o.id).join(',')}`, { replace: true })
  }

  return (
    <div className="cart-layout">
      <div className="stack-16">
        <PageHead title={t('cart')} sub={t('perShop')} />
        {groups.map((g) => {
          const sh = shop(g.shopId)
          const shipOk = canShip(g.lines)
          const method = methodFor(g, s.methods)
          const st = shopTotals(g.lines, method)
          return (
            <section key={g.shopId} className="card pad stack-12" aria-label={sh.name}>
              <div className="row between">
                <h2 className="h3">{sh.name}</h2>
                <span className="muted small">{sh.area}</span>
              </div>
              <ul className="cart-lines">
                {g.lines.map((l) => (
                  <li key={l.productId} className="cart-line">
                    <ProductArt product={l.product} className="art-thumb" />
                    <div className="cart-line-main">
                      <p className="strong">{l.product.name}</p>
                      <p className="muted small">{price(l.product.price)}</p>
                    </div>
                    <Stepper id={`qty-${l.productId}`} value={l.qty} min={0} max={l.product.stock} label={t('qty')} onChange={(qty) => dispatch({ type: 'cart/qty', productId: l.productId, qty })} />
                  </li>
                ))}
              </ul>
              <fieldset className="radio-group">
                <legend className="sr-only">{t('shipping')}</legend>
                <label className={`radio ${method === 'pickup' ? 'is-on' : ''}`}>
                  <input type="radio" name={`m-${g.shopId}`} checked={method === 'pickup'} onChange={() => dispatch({ type: 'cart/method', shopId: g.shopId, method: 'pickup' })} />
                  <Icon name="store" size={18} />
                  <span>
                    {t('pickupAt')}
                    <span className="muted small block">{sh.area}</span>
                  </span>
                  <span className="radio-price">{t('free')}</span>
                </label>
                <label className={`radio ${method === 'ship' ? 'is-on' : ''} ${!shipOk || !sh.ships ? 'is-disabled' : ''}`}>
                  <input type="radio" name={`m-${g.shopId}`} disabled={!shipOk || !sh.ships} checked={method === 'ship'} onChange={() => dispatch({ type: 'cart/method', shopId: g.shopId, method: 'ship' })} />
                  <Icon name="truck" size={18} />
                  <span>
                    {t('shipToMe')}
                    {!shipOk && <span className="muted small block">{t('freshPickupOnly')}</span>}
                  </span>
                  <span className="radio-price">{money(SHIPPING_FLAT)}</span>
                </label>
              </fieldset>
              <p className="row between small">
                <span className="muted">{t('subtotal')}</span>
                <span className="num">{money(st.subtotal)}</span>
              </p>
            </section>
          )
        })}
      </div>

      <aside className="card pad stack-12 summary">
        <Toggle id="discreet" checked={s.discreet} onChange={(v) => dispatch({ type: 'set', patch: { discreet: v } })} label={t('discreet')} hint={t('discreetHint')} />
        <dl className="totals">
          <dt>{t('subtotal')}</dt>
          <dd>{money(totals.subtotal)}</dd>
          <dt>{t('shipping')}</dt>
          <dd>{totals.shipping ? money(totals.shipping) : t('free')}</dd>
          <dt>{t('tax')}</dt>
          <dd>{money(totals.tax)}</dd>
          <dt className="total">{t('total')}</dt>
          <dd className="total">{money(totals.total)}</dd>
        </dl>
        <Button block size="lg" onClick={placeOrder}>
          {t('placeOrder', { p: money(totals.total) })}
        </Button>
        <p className="muted small center">
          <Icon name="lock" size={14} /> {t('demoCard')}
        </p>
      </aside>
    </div>
  )
}

export function OrderDone({ ids }) {
  const { t, s, shop } = useApp()
  const { navigate } = useRouter()
  const orders = ids
    .split(',')
    .map((id) => s.orders.find((o) => o.id === id))
    .filter(Boolean)
  return (
    <div className="stack-16 narrow">
      <div className="done-head">
        <span className="done-icon">
          <Icon name="check" size={26} />
        </span>
        <h1>{t('orderPlaced')}</h1>
        <p className="muted">{t('readyNotice')}</p>
      </div>
      {orders.map((o) => (
        <div key={o.id} className="card pad stack-12">
          <div className="row between">
            <p className="strong">{shop(o.shopId).name}</p>
            <span className="muted small">{o.id}</span>
          </div>
          <ul className="plain small">
            {o.lines.map((l) => (
              <li key={l.productId} className="row between">
                <span>
                  {l.qty} × {l.name}
                </span>
                <span className="num">{money(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          {o.method === 'pickup' ? (
            <div className="pickup-code">
              <span className="muted small">{t('pickupCode')}</span>
              <span className="code">{o.code}</span>
            </div>
          ) : (
            <p className="small">
              <Icon name="truck" size={16} /> {t('shipToMe')}
              {o.discreet ? ` · ${t('discreet')}` : ''}
            </p>
          )}
          <p className="row between">
            <span className="muted">{t('total')}</span>
            <strong className="num">{money(o.totals.total)}</strong>
          </p>
        </div>
      ))}
      <Button variant="outline" onClick={() => navigate('/me')}>
        {t('orders')}
      </Button>
    </div>
  )
}
