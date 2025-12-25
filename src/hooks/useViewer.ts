import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'

export type UseViewerOptions = Partial<Viewer.Options>

export function useViewer(
  containerRef: MutableRefObject<HTMLElement | null>,
  options?: UseViewerOptions
) {
  const viewerRef = useRef<Viewer | null>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    viewerRef.current?.destroy()
    viewerRef.current = new Viewer(el, {
      toolbar: true,
      navbar: false,
      title: false,
      movable: true,
      zoomable: true,
      rotatable: true,
      scalable: true,
      fullscreen: true,
      transition: true,
      zIndex: 999999,
      hide() {
        const inst = viewerRef.current as any
        const root: HTMLElement | undefined = inst?.viewer
        const active = document.activeElement as HTMLElement | null
        if (root && active && root.contains(active)) active.blur()
        if (root) root.setAttribute('inert', '')
      },
      hidden() {
        const inst = viewerRef.current as any
        const root: HTMLElement | undefined = inst?.viewer
        if (root) root.removeAttribute('inert')
        const prev = prevFocusRef.current
        if (prev && document.contains(prev)) prev.focus()
        prevFocusRef.current = null
      },
      ...options,
    })

    observerRef.current?.disconnect()
    observerRef.current = new MutationObserver(() => {
      viewerRef.current?.update()
    })
    observerRef.current.observe(el, { childList: true, subtree: true })

    return () => {
      viewerRef.current?.destroy()
      viewerRef.current = null
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [containerRef.current, options])

  const open = (index?: number) => {
    const v = viewerRef.current
    if (!v) return
    prevFocusRef.current = document.activeElement as HTMLElement | null
    if (typeof index === 'number') {
      v.view(index)
    }
    v.show()
  }

  const openByElement = (imgEl?: HTMLImageElement) => {
    const v = viewerRef.current
    const el = containerRef.current
    if (!v || !el || !imgEl) return
    const imgs = Array.from(el.querySelectorAll('img'))
    const idx = imgs.indexOf(imgEl)
    prevFocusRef.current = document.activeElement as HTMLElement | null
    if (idx >= 0) v.view(idx)
    v.show()
  }

  return { open, openByElement, viewer: viewerRef }
}
