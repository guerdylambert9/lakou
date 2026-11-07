import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

// A small path router. In the normal web build it keeps the URL in sync with
// history.pushState, so shop pages get real links (/shop/ginen). In the artifact
// build it stays in memory, because the hosting frame owns the address bar.
// Swap for React Router (as in Rové) once the app has a server.

const MEMORY = import.meta.env.MODE === 'artifact'
const RouterCtx = createContext(null)

function currentPath() {
  if (MEMORY || typeof window === 'undefined') return '/'
  return window.location.pathname || '/'
}

function scrollTop() {
  try {
    window.scrollTo({ top: 0 })
  } catch {
    /* ignore */
  }
}

export function RouterProvider({ children }) {
  const [stack, setStack] = useState(() => [currentPath()])
  const stackRef = useRef(stack)
  stackRef.current = stack
  const path = stack[stack.length - 1]

  useEffect(() => {
    if (MEMORY) return undefined
    const onPop = () => {
      const now = currentPath()
      setStack((s) => (s.length > 1 && s[s.length - 2] === now ? s.slice(0, -1) : [...s.slice(0, -1), now]))
      scrollTop()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to, { replace = false } = {}) => {
    if (!MEMORY) {
      try {
        window.history[replace ? 'replaceState' : 'pushState']({}, '', to)
      } catch {
        /* the frame may refuse history changes; memory still works */
      }
    }
    setStack((s) => (replace ? [...s.slice(0, -1), to] : [...s, to]))
    scrollTop()
  }, [])

  const back = useCallback(
    (fallback = '/') => {
      const s = stackRef.current
      if (s.length > 1) {
        if (!MEMORY) {
          try {
            window.history.back()
            return
          } catch {
            /* fall through to memory */
          }
        }
        setStack(s.slice(0, -1))
        scrollTop()
      } else {
        navigate(fallback, { replace: true })
      }
    },
    [navigate],
  )

  const value = useMemo(() => ({ path, navigate, back }), [path, navigate, back])
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>
}

export const useRouter = () => useContext(RouterCtx)

/** match('/shop/:id', '/shop/ginen') -> { id: 'ginen' } or null */
export function match(pattern, path) {
  const a = pattern.split('/').filter(Boolean)
  const b = path.split('/').filter(Boolean)
  if (a.length !== b.length) return null
  const params = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return params
}

export function Link({ to, children, className, ...rest }) {
  const { navigate } = useRouter()
  return (
    <a
      href={MEMORY ? undefined : to}
      role={MEMORY ? 'link' : undefined}
      tabIndex={MEMORY ? 0 : undefined}
      className={className}
      onClick={(e) => {
        if (!MEMORY && (e.metaKey || e.ctrlKey)) return
        e.preventDefault()
        navigate(to)
      }}
      onKeyDown={(e) => {
        if (MEMORY && e.key === 'Enter') navigate(to)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}
