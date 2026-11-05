window.__ModuleLoader__.load({
  id: 'dsh-deep-work',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'deepWork'

    const en = {
      'action.start': 'New Deep Work task',
      'action.startShort': 'Deep Work',
      'action.hint': 'Start a new session in Deep Work mode',
    }

    const zh = {
      'action.start': '新建深度工作任务',
      'action.startShort': '深度工作',
      'action.hint': '以深度工作模式开始新会话',
    }

    function DeepWorkGlyph({ size = 16 }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
        focusable: false,
      },
      h('path', {
        d: 'M3 3.25h5.2c2.8 0 4.55 1.85 4.55 5s-1.75 5-4.55 5H3v-10Z',
        stroke: 'currentColor',
        strokeWidth: '1.35',
        strokeLinejoin: 'round',
      }),
      h('path', {
        d: 'M3 8.25h4.4',
        stroke: 'currentColor',
        strokeWidth: '1.35',
        strokeLinecap: 'round',
      }),
      h('circle', { cx: '12.25', cy: '11.75', r: '2.4', fill: 'currentColor', opacity: '0.9' }),
      )
    }

    function baseButtonStyle(extra) {
      return Object.assign({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        border: '1px solid var(--dsw-alias-border-l1)',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        borderRadius: '8px',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: '12px',
        lineHeight: '1.2',
        padding: '6px 9px',
        whiteSpace: 'nowrap',
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
      }, extra)
    }

    function useStart(ctx) {
      const [busy, setBusy] = React.useState(false)
      const start = React.useCallback(() => {
        if (busy) return
        setBusy(true)
        try {
          ctx.uiWorkspace.startSession(undefined, { agentPreset: 'deep-work' })
        } catch {
          setBusy(false)
        }
      }, [busy, ctx])
      return [busy, start]
    }

    function createFooterAction(ctx) {
      function FooterAction({ wide, t }) {
        const [busy, start] = useStart(ctx)
        return h('button', {
          type: 'button',
          title: t('action.hint'),
          'aria-label': t('action.start'),
          'data-deep-work-action': 'footer',
          disabled: busy,
          onClick: start,
          onMouseEnter: event => {
            event.currentTarget.style.background = 'var(--dsw-alias-interactive-bg-hover)'
            event.currentTarget.style.color = 'var(--dsw-alias-label-primary)'
          },
          onMouseLeave: event => {
            event.currentTarget.style.background = 'transparent'
            event.currentTarget.style.color = 'var(--dsw-alias-label-secondary)'
          },
          style: baseButtonStyle({
            width: wide ? 'auto' : '32px',
            height: wide ? '30px' : '32px',
            padding: wide ? '6px 9px' : '0',
            marginLeft: wide ? '2px' : '0',
            justifyContent: wide ? 'flex-start' : 'center',
          }),
        }, h(DeepWorkGlyph, { size: 15 }), wide ? h('span', null, t('action.startShort')) : null)
      }
      return FooterAction
    }

    function createHeroAction(ctx) {
      function HeroAction({ t }) {
        const [busy, start] = useStart(ctx)
        return h('button', {
          type: 'button',
          title: t('action.hint'),
          'aria-label': t('action.start'),
          'data-deep-work-action': 'hero',
          disabled: busy,
          onClick: start,
          onMouseEnter: event => {
            event.currentTarget.style.background = 'var(--dsw-alias-interactive-bg-hover)'
            event.currentTarget.style.color = 'var(--dsw-alias-label-primary)'
            event.currentTarget.style.borderColor = 'var(--dsw-alias-border-l2)'
          },
          onMouseLeave: event => {
            event.currentTarget.style.background = 'transparent'
            event.currentTarget.style.color = 'var(--dsw-alias-label-secondary)'
            event.currentTarget.style.borderColor = 'var(--dsw-alias-border-l1)'
          },
          style: baseButtonStyle({
            borderRadius: '999px',
            height: '30px',
            padding: '5px 11px',
          }),
        }, h(DeepWorkGlyph, { size: 14 }), h('span', null, t('action.startShort')))
      }
      return HeroAction
    }

    function createHeaderBadge() {
      function HeaderBadge({ useSession, t }) {
        const preset = useSession(session => session && (
          session.header?.agentPreset
          ?? session.agentPreset
          ?? session.preset
          ?? session.session?.agentPreset
        ))
        if (preset !== 'deep-work') return null
        return h('span', {
          title: t('action.hint'),
          'data-deep-work-badge': 'active',
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--dsw-alias-label-secondary)',
            border: '1px solid var(--dsw-alias-border-l1)',
            borderRadius: '999px',
            padding: '3px 7px',
            fontSize: '11px',
            lineHeight: '1.2',
            whiteSpace: 'nowrap',
          },
        }, h(DeepWorkGlyph, { size: 12 }), h('span', null, t('action.startShort')))
      }
      return HeaderBadge
    }

    return {
      inject: ['slots', 'locale', 'uiWorkspace'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'deep-work: dictionaries')
        ctx.effect(() => ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
          name: 'sidebar.footer.action',
          id: 'deep-work',
          order: 20,
          locale: NS,
        }, createFooterAction(ctx))), 'deep-work: footer action')
        ctx.effect(() => ctx.slots.inject('conversation.hero.options', () => ctx.slots.register({
          name: 'conversation.hero.options',
          id: 'deep-work',
          order: 20,
          locale: NS,
        }, createHeroAction(ctx))), 'deep-work: hero action')
        ctx.effect(() => ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
          name: 'conversation.session.header.actions',
          id: 'deep-work',
          order: 15,
          locale: NS,
        }, createHeaderBadge())), 'deep-work: header badge')
      },
    }
  },
})
