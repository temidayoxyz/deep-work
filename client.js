window.__ModuleLoader__.load({
  id: 'dsh-deep-work',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'deepWork'

    const TAB_ID = 'dsh-deep-work/cockpit'
    const TAB_ADDRESS = 'dsh-resource://deep-work/cockpit'
    const TASK_PATH = '.deep-work/task.md'
    const PLAN_PATH = '.deep-work/plan.md'
    const SOURCES_PATH = '.deep-work/sources.md'
    const DELIVERABLES_PATH = 'deliverables'

    const en = {
      'tab.title': 'Deep Work',
      'guide.title': 'Deep Work',
      'guide.description': 'Task progress, plan, artifacts, and sources',
      'state.loading': 'Reading workspace…',
      'state.empty': 'No Deep Work task yet',
      'state.emptyHint': 'Start a substantial task and ask Deep Work to keep its brief and plan in .deep-work/.',
      'section.task': 'Task',
      'section.plan': 'Plan',
      'section.artifacts': 'Artifacts',
      'section.context': 'Context',
      'field.status': 'Status',
      'field.deliverable': 'Deliverable',
      'field.next': 'Next step',
      'field.objective': 'Objective',
      'plan.empty': 'No plan written yet.',
      'artifacts.empty': 'No deliverables yet.',
      'context.sources': 'sources',
      'context.files': 'working files',
      'action.refresh': 'Refresh',
      'badge.hint': 'Open the Deep Work cockpit',
    }

    const zh = {
      'tab.title': '深度工作',
      'guide.title': '深度工作',
      'guide.description': '任务进度、计划、交付物与来源',
      'state.loading': '正在读取工作区…',
      'state.empty': '还没有深度工作任务',
      'state.emptyHint': '开始一项较大的任务，让深度工作把任务说明和计划保存到 .deep-work/。',
      'section.task': '任务',
      'section.plan': '计划',
      'section.artifacts': '交付物',
      'section.context': '上下文',
      'field.status': '状态',
      'field.deliverable': '交付物',
      'field.next': '下一步',
      'field.objective': '目标',
      'plan.empty': '还没有写计划。',
      'artifacts.empty': '还没有交付物。',
      'context.sources': '来源',
      'context.files': '工作文件',
      'action.refresh': '刷新',
      'badge.hint': '打开深度工作面板',
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

    function RefreshGlyph({ size = 14 }) {
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
        d: 'M13 6a5.25 5.25 0 1 0 .25 4.3M13 2.75V6h-3.25',
        stroke: 'currentColor',
        strokeWidth: '1.35',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }))
    }

    function sectionStyle() {
      return {
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: '10px',
        background: 'var(--dsw-alias-bg-layer-1)',
        overflow: 'hidden',
      }
    }

    function labelStyle() {
      return {
        fontSize: '10px',
        fontWeight: 650,
        letterSpacing: '0.075em',
        textTransform: 'uppercase',
        color: 'var(--dsw-alias-label-tertiary)',
      }
    }

    function parseSection(markdown, heading) {
      if (typeof markdown !== 'string') return undefined
      const pattern = new RegExp(`^##\\s+${heading}\\s*$`, 'im')
      const match = pattern.exec(markdown)
      if (match === null) return undefined
      const rest = markdown.slice(match.index + match[0].length)
      const next = /^##\s+/m.exec(rest)
      const body = (next === null ? rest : rest.slice(0, next.index)).trim()
      return body.length === 0 ? undefined : body
    }

    function firstLine(value) {
      return typeof value === 'string' ? value.split(/\r?\n/).map(line => line.trim()).find(Boolean) : undefined
    }

    function parseChecklist(markdown) {
      if (typeof markdown !== 'string') return []
      const items = []
      for (const line of markdown.split(/\r?\n/)) {
        const match = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line)
        if (match !== null) items.push({ done: match[1].toLowerCase() === 'x', text: match[2].trim() })
      }
      return items
    }

    function countSources(markdown) {
      if (typeof markdown !== 'string') return 0
      return markdown.split(/\r?\n/).filter(line => /https?:\/\//.test(line) || /^\s*[-*]\s+/.test(line)).length
    }

    async function readText(ctx, sessionId, path, signal) {
      try {
        const result = await ctx.remote.workspaceFiles.read(sessionId, path, { offset: 0, limit: 400 }, signal)
        return result.ok ? result.value.text : undefined
      } catch {
        return undefined
      }
    }

    async function listDir(ctx, sessionId, path, signal) {
      try {
        const result = await ctx.remote.workspaceFiles.list(sessionId, path, signal)
        return result.ok ? result.value.entries : []
      } catch {
        return []
      }
    }

    function fileAddress(sessionId, path) {
      const segments = path.split('/').map(segment => encodeURIComponent(segment))
      return `dsh-resource://file/session/${encodeURIComponent(sessionId)}/${segments.join('/')}`
    }

    function Pill({ children, tone = 'neutral' }) {
      const map = {
        neutral: { color: 'var(--dsw-alias-label-secondary)', border: 'var(--dsw-alias-border-l1)' },
        good: { color: 'var(--dsw-alias-state-success-primary)', border: 'var(--dsw-alias-state-success-primary)' },
        warn: { color: 'var(--dsw-alias-state-warn-primary)', border: 'var(--dsw-alias-state-warn-primary)' },
      }
      const style = map[tone] ?? map.neutral
      return h('span', {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          border: `1px solid ${style.border}`,
          color: style.color,
          borderRadius: '999px',
          padding: '2px 7px',
          fontSize: '10px',
          lineHeight: '1.3',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        },
      }, children)
    }

    function Field({ label, value }) {
      if (value === undefined || value.length === 0) return null
      return h('div', { style: { display: 'grid', gap: '3px', padding: '9px 12px', borderTop: '1px solid var(--dsw-alias-border-l1)' } },
        h('span', { style: labelStyle() }, label),
        h('span', { style: { fontSize: '12px', lineHeight: '1.5', color: 'var(--dsw-alias-label-primary)', overflowWrap: 'anywhere' } }, value),
      )
    }

    function CardHeader({ title, count, action }) {
      return h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '9px 12px',
          borderBottom: '1px solid var(--dsw-alias-border-l1)',
          background: 'var(--dsw-alias-bg-layer-2)',
        },
      },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '7px' } },
        h('span', { style: { ...labelStyle(), color: 'var(--dsw-alias-label-secondary)' } }, title),
        count === undefined ? null : h(Pill, null, String(count)),
      ),
      action ?? null)
    }

    function FileRow({ sessionId, path, label, detail, icon, onOpen }) {
      return h('button', {
        type: 'button',
        onClick: () => onOpen(fileAddress(sessionId, path)),
        title: label,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '7px 12px',
          border: 'none',
          borderTop: '1px solid var(--dsw-alias-border-l1)',
          background: 'transparent',
          color: 'var(--dsw-alias-label-primary)',
          textAlign: 'left',
          cursor: 'pointer',
          font: 'inherit',
        },
        onMouseEnter: event => { event.currentTarget.style.background = 'var(--dsw-alias-interactive-bg-hover)' },
        onMouseLeave: event => { event.currentTarget.style.background = 'transparent' },
      },
      h('span', {
        style: {
          width: '22px',
          height: '22px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          background: 'var(--dsw-alias-bg-layer-3)',
          color: 'var(--dsw-alias-label-secondary)',
          flex: 'none',
        },
      }, icon),
      h('span', { style: { minWidth: 0, display: 'grid', gap: '1px' } },
        h('span', { style: { fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, label),
        detail === undefined ? null : h('span', { style: { fontSize: '10px', color: 'var(--dsw-alias-label-tertiary)' } }, detail),
      ))
    }

    function createCockpit(ctx) {
      function Cockpit({ sessionId, t }) {
        const [state, setState] = React.useState({ loading: true, task: undefined, planText: '', sourcesText: '', artifacts: [], working: [] })
        const [nonce, setNonce] = React.useState(0)

        React.useEffect(() => {
          if (typeof sessionId !== 'string') return undefined
          const controller = new AbortController()
          let cancelled = false

          const load = async () => {
            const [task, planText, sourcesText, deliverableEntries, workEntries] = await Promise.all([
              readText(ctx, sessionId, TASK_PATH, controller.signal),
              readText(ctx, sessionId, PLAN_PATH, controller.signal),
              readText(ctx, sessionId, SOURCES_PATH, controller.signal),
              listDir(ctx, sessionId, DELIVERABLES_PATH, controller.signal),
              listDir(ctx, sessionId, '.deep-work', controller.signal),
            ])
            if (cancelled) return
            setState({
              loading: false,
              task,
              planText: planText ?? '',
              sourcesText: sourcesText ?? '',
              artifacts: deliverableEntries.filter(entry => entry.type === 'file'),
              working: workEntries.filter(entry => entry.type === 'file'),
            })
          }

          void load()
          const timer = setInterval(() => { void load() }, 4000)
          return () => {
            cancelled = true
            controller.abort()
            clearInterval(timer)
          }
        }, [sessionId, nonce])

        const task = state.task
        const status = firstLine(parseSection(task, 'Status'))
        const deliverable = firstLine(parseSection(task, 'Deliverable'))
        const next = firstLine(parseSection(task, 'Next step'))
        const objective = firstLine(parseSection(task, 'Objective'))
        const checklist = parseChecklist(state.planText)
        const done = checklist.filter(item => item.done).length
        const sources = countSources(state.sourcesText)
        const hasTask = typeof task === 'string' && task.trim().length > 0
        const statusTone = status !== undefined && /complete|done|finished|verified/i.test(status) ? 'good' : status !== undefined && /blocked|waiting|error/i.test(status) ? 'warn' : 'neutral'

        const open = path => {
          try { ctx.sidebarRight.openResource(fileAddress(sessionId, path)) } catch { /* surface stays usable */ }
        }

        return h('div', {
          'data-deep-work-cockpit': '',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '12px',
            height: '100%',
            overflow: 'auto',
            background: 'var(--dsw-alias-bg-base)',
            color: 'var(--dsw-alias-label-primary)',
            boxSizing: 'border-box',
          },
        },
        h('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' } },
          h('div', { style: { display: 'flex', gap: '9px', alignItems: 'center', minWidth: 0 } },
            h('span', {
              style: {
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--dsw-alias-brand-primary)',
                color: 'var(--dsw-alias-label-primary-inverted)',
                flex: 'none',
              },
            }, h(DeepWorkGlyph, { size: 16 })),
            h('div', { style: { display: 'grid', gap: '2px', minWidth: 0 } },
              h('span', { style: { fontSize: '13px', fontWeight: 650 } }, t('tab.title')),
              h('span', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-tertiary)' } }, 'Task cockpit'),
            ),
          ),
          h('button', {
            type: 'button',
            title: t('action.refresh'),
            'aria-label': t('action.refresh'),
            onClick: () => { setNonce(value => value + 1) },
            style: {
              width: '26px',
              height: '26px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--dsw-alias-border-l1)',
              borderRadius: '7px',
              background: 'transparent',
              color: 'var(--dsw-alias-label-secondary)',
              cursor: 'pointer',
            },
          }, h(RefreshGlyph, { size: 13 })),
        ),

        state.loading
          ? h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)', padding: '8px 2px' } }, t('state.loading'))
          : null,

        !state.loading && !hasTask
          ? h('div', { style: { ...sectionStyle(), padding: '16px 14px', display: 'grid', gap: '7px' } },
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                h(DeepWorkGlyph, { size: 16 }),
                h('span', { style: { fontSize: '13px', fontWeight: 650 } }, t('state.empty')),
              ),
              h('span', { style: { fontSize: '12px', lineHeight: '1.55', color: 'var(--dsw-alias-label-secondary)' } }, t('state.emptyHint')),
            )
          : null,

        hasTask
          ? h('div', { style: sectionStyle() },
              h(CardHeader, {
                title: t('section.task'),
                action: status === undefined ? null : h(Pill, { tone: statusTone }, status),
              }),
              h(Field, { label: t('field.objective'), value: objective }),
              h(Field, { label: t('field.deliverable'), value: deliverable }),
              h(Field, { label: t('field.next'), value: next }),
            )
          : null,

        checklist.length > 0
          ? h('div', { style: sectionStyle() },
              h(CardHeader, { title: t('section.plan'), count: `${done}/${checklist.length}` }),
              h('div', { style: { padding: '0 12px', paddingTop: '10px' } },
                h('div', { style: { height: '5px', borderRadius: '999px', background: 'var(--dsw-alias-bg-layer-3)', overflow: 'hidden' } },
                  h('div', { style: { width: `${Math.round((done / checklist.length) * 100)}%`, height: '100%', background: 'var(--dsw-alias-state-success-primary)', borderRadius: '999px', transition: 'width 180ms ease' } }),
                ),
              ),
              h('div', { style: { display: 'grid', gap: '0', padding: '5px 0 7px' } },
                checklist.slice(0, 10).map((item, index) => h('div', {
                  key: `${index}-${item.text}`,
                  style: { display: 'flex', gap: '8px', padding: '5px 12px', fontSize: '11.5px', lineHeight: '1.45', color: item.done ? 'var(--dsw-alias-label-tertiary)' : 'var(--dsw-alias-label-secondary)' },
                },
                h('span', {
                  style: {
                    width: '13px',
                    height: '13px',
                    flex: 'none',
                    marginTop: '1px',
                    borderRadius: '4px',
                    border: item.done ? '1px solid var(--dsw-alias-state-success-primary)' : '1px solid var(--dsw-alias-border-l2)',
                    background: item.done ? 'var(--dsw-alias-state-success-primary)' : 'transparent',
                    color: 'var(--dsw-alias-label-primary-inverted)',
                    fontSize: '9px',
                    textAlign: 'center',
                    lineHeight: '13px',
                  },
                }, item.done ? '✓' : ''),
                h('span', { style: { textDecoration: item.done ? 'line-through' : 'none' } }, item.text)),
                )),
            )
          : null,

        h('div', { style: sectionStyle() },
          h(CardHeader, { title: t('section.artifacts'), count: state.artifacts.length }),
          state.artifacts.length === 0
            ? h('div', { style: { padding: '11px 12px', fontSize: '12px', color: 'var(--dsw-alias-label-tertiary)' } }, t('artifacts.empty'))
            : state.artifacts.map(file => h(FileRow, {
                key: file.name,
                sessionId,
                path: `${DELIVERABLES_PATH}/${file.name}`,
                label: file.name,
                detail: file.size === undefined ? 'deliverable' : `${Math.max(1, Math.round(file.size / 1024))} KiB`,
                icon: h('span', { style: { fontSize: '9px', fontWeight: 700 } }, (file.name.split('.').pop() ?? 'file').slice(0, 4).toUpperCase()),
                onOpen: open,
              })),
        ),

        (sources > 0 || state.working.length > 0)
          ? h('div', { style: sectionStyle() },
              h(CardHeader, { title: t('section.context'), count: sources > 0 ? `${sources}` : state.working.length }),
              sources > 0
                ? h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '9px 12px', fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } },
                    h('span', null, t('context.sources')),
                    h('span', { style: { color: 'var(--dsw-alias-label-primary)', fontWeight: 600 } }, String(sources)),
                  )
                : null,
              state.working.slice(0, 6).map(file => h(FileRow, {
                key: file.name,
                sessionId,
                path: `.deep-work/${file.name}`,
                label: file.name,
                detail: t('context.files'),
                icon: h('span', { style: { fontSize: '9px', fontWeight: 700 } }, 'MD'),
                onOpen: open,
              })),
            )
          : null,

        h('div', { style: { marginTop: 'auto', paddingTop: '2px', fontSize: '10px', color: 'var(--dsw-alias-label-tertiary)', lineHeight: '1.45' } },
          'Reads .deep-work/ and deliverables/ from this workspace.'),
        )
      }
      return Cockpit
    }

    function createHeaderBadge(ctx) {
      function HeaderBadge({ useSession, sessionId, t }) {
        const preset = useSession(session => session && (
          session.header?.agentPreset
          ?? session.agentPreset
          ?? session.preset
          ?? session.session?.agentPreset
        ))

        React.useEffect(() => {
          if (preset !== 'deep-work' || typeof sessionId !== 'string') return
          const key = `dsh-deep-work:opened:${sessionId}`
          try {
            if (sessionStorage.getItem(key) === '1') return
            sessionStorage.setItem(key, '1')
            ctx.sidebarRight.openResource(TAB_ADDRESS)
          } catch {
            /* storage or sidebar unavailable: the badge remains the entry point */
          }
        }, [preset, sessionId])

        if (preset !== 'deep-work') return null

        return h('button', {
          type: 'button',
          title: t('badge.hint'),
          'aria-label': t('badge.hint'),
          'data-deep-work-badge': 'active',
          onClick: () => {
            try { ctx.sidebarRight.openResource(TAB_ADDRESS) } catch { /* ignore */ }
          },
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            color: 'var(--dsw-alias-label-secondary)',
            border: '1px solid var(--dsw-alias-border-l1)',
            borderRadius: '999px',
            padding: '3px 7px',
            background: 'transparent',
            fontSize: '11px',
            lineHeight: '1.2',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            font: 'inherit',
          },
          onMouseEnter: event => {
            event.currentTarget.style.background = 'var(--dsw-alias-interactive-bg-hover)'
            event.currentTarget.style.color = 'var(--dsw-alias-label-primary)'
          },
          onMouseLeave: event => {
            event.currentTarget.style.background = 'transparent'
            event.currentTarget.style.color = 'var(--dsw-alias-label-secondary)'
          },
        }, h(DeepWorkGlyph, { size: 12 }), h('span', null, t('tab.title')))
      }
      return HeaderBadge
    }

    function createDefinition(t) {
      return {
        id: TAB_ID,
        kind: 'deep-work',
        patterns: ['dsh-resource://deep-work/**'],
        title: () => t('tab.title'),
        canOpen: address => address.startsWith('dsh-resource://deep-work/'),
        guide: [{
          order: 8,
          title: () => t('guide.title'),
          description: () => t('guide.description'),
          icon: DeepWorkGlyph,
        }],
      }
    }

    return {
      inject: ['slots', 'locale', 'sidebarRightTabs', 'sidebarRight', 'remote'],
      apply(ctx) {
        const t = ctx.locale.bind(NS)
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'deep-work: dictionaries')
        ctx.effect(() => ctx.sidebarRightTabs.register(createDefinition(t)), 'deep-work: tab type')
        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab',
          key: TAB_ID,
          locale: NS,
        }, createCockpit(ctx))), 'deep-work: cockpit body')
        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab.title',
          key: TAB_ID,
          locale: NS,
        }, ({ t }) => h('span', { style: { fontSize: '12px', fontWeight: 600 } }, t('tab.title')))), 'deep-work: cockpit title')
        ctx.effect(() => ctx.slots.inject('conversation.session.header.actions', () => ctx.slots.register({
          name: 'conversation.session.header.actions',
          id: 'deep-work',
          order: 15,
          locale: NS,
        }, createHeaderBadge(ctx))), 'deep-work: header badge')
      },
    }
  },
})
