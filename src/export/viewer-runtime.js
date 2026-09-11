/**
 * 独立展示页运行时（纯 DOM，无框架依赖）。
 * 该函数源码会通过 Function.toString() 内联进导出的 index.html，
 * 也会被测试直接在 jsdom 中调用。
 * 【强制自包含】函数体内禁止引用外部作用域变量（含 import）。
 */
export function renderSiteInto(root, data) {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  // AC-16.3 预设字体库（与编辑器 core/beautify.js 保持一致）
  var FONT_STACK = {
    sans: "'PingFang SC','Source Han Sans SC','Microsoft YaHei',sans-serif",
    serif: "'Source Han Serif SC','Songti SC','SimSun',serif",
    mono: "'JetBrains Mono','Cascadia Code','Consolas',monospace",
    orbitron: "'Orbitron','PingFang SC',sans-serif",
    rounded: "'Nunito','PingFang SC','Microsoft YaHei',sans-serif",
    pixel: "'Zpix','Press Start 2P','Courier New',monospace",
  }

  // 当前展示语言（多页路由运行时可切换）；双语取值，缺省回退另一语言
  var lang = 'zh'
  function pickT(value) {
    var l = lang === 'en' ? 'en' : 'zh'
    var other = l === 'en' ? 'zh' : 'en'
    if (typeof value === 'string') return value
    if (!value || typeof value !== 'object') return ''
    return value[l] || value[other] || ''
  }

  function elHtml(e, i) {
    var p = e.props || {}
    var inner = ''
    var extra = '' // 元素外壳附加样式（AC-16.2 图片美化等）
    var noAnim = p.animate === false ? ' v-no-anim' : '' // AC-16.4 入场动效开关
    if (e.type === 'text') {
      // 字号按 1440 设计稿宽度换算为 vw，随屏幕等比缩放（AC-2.8）
      var vw = ((p.fontSize || 16) / 14.4).toFixed(3)
      var stroke = p.strokeWidth > 0 && p.strokeColor
        ? (';-webkit-text-stroke:' + p.strokeWidth + 'px ' + esc(p.strokeColor)) : ''
      inner = '<div class="v-text" style="font-size:' + vw + 'vw;color:' + esc(p.color)
        + ';font-weight:' + (p.weight || 400)
        + ';text-align:' + (p.align || 'left')
        + ';line-height:' + (p.lineHeight || 1.6)
        + ';font-family:' + esc(FONT_STACK[p.fontFamily] || FONT_STACK.sans)
        + stroke + '">' + esc(pickT(p.content)) + '</div>'
    } else if (e.type === 'image') {
      // AC-16.2 图片美化：透明度/圆角/阴影/灰度/模糊
      var filt = ''
      if (+p.grayscale > 0) filt += 'grayscale(' + (+p.grayscale) + '%) '
      if (+p.blur > 0) filt += 'blur(' + (+p.blur) + 'px)'
      var imgStyle = 'border-radius:' + (+p.radius || 0) + '%;' + (filt ? ('filter:' + filt.trim() + ';') : '')
      extra = 'opacity:' + (p.opacity == null ? 1 : p.opacity)
        + ';border-radius:' + (+p.radius || 0) + '%;overflow:hidden;'
        + (p.shadow === 'soft' ? 'box-shadow:0 8px 30px rgba(0,0,0,0.25);'
          : p.shadow === 'strong' ? 'box-shadow:0 12px 40px rgba(0,0,0,0.45);' : '')
      inner = p.src
        ? '<img class="v-fill" style="' + imgStyle + '" src="' + esc(p.src) + '" alt="' + esc(pickT(p.alt)) + '">'
        : '<div class="v-ph" style="' + imgStyle + '">图片</div>'
    } else if (e.type === 'video') {
      if (p.source === 'link' && p.url) {
        inner = '<iframe class="v-fill" src="' + esc(p.url) + '" frameborder="0" allowfullscreen></iframe>'
      } else if (p.src) {
        inner = '<video class="v-fill" src="' + esc(p.src) + '" controls></video>'
      } else {
        inner = '<div class="v-ph">视频</div>'
      }
    } else if (e.type === 'link') {
      // AC-10.10 站内 hash 链接当前页跳转、不展示 url 明文；外链新标签打开
      var hashIn = String(p.url || '').indexOf('#') === 0
      inner = '<a class="v-link" href="' + esc(p.url) + '"' + (hashIn ? '' : ' target="_blank" rel="noopener"') + '>'
        + '<b>' + esc(pickT(p.title)) + '</b>' + (hashIn ? '' : '<span>' + esc(p.url) + '</span>') + '</a>'
    } else if (e.type === 'skillTag') {
      inner = '<div class="v-tags" style="justify-content:'
        + (p.align === 'center' ? 'center' : 'flex-start') + '">'
        + (p.tags || []).map(function (t) {
          return '<span class="v-tag">' + esc(t) + '</span>'
        }).join('') + '</div>'
    } else if (e.type === 'gallery') {
      inner = '<div class="v-gallery">' + (p.images || []).map(function (im) {
        return '<figure class="v-gitem">'
          + (im.src ? '<img src="' + esc(im.src) + '">' : '<div class="v-ph">' + esc(pickT(im.caption)) + '</div>')
          + (im.caption ? '<figcaption>' + esc(pickT(im.caption)) + '</figcaption>' : '')
          + '</figure>'
      }).join('') + '</div>'
    } else if (e.type === 'decoration') {
      inner = '<div class="v-deco" style="background:' + esc(p.color)
        + ';opacity:' + (p.opacity == null ? 1 : p.opacity)
        + (p.blur ? ';filter:blur(' + p.blur + 'px)' : '') + '"></div>'
    } else if (e.type === 'timeline') {
      // AC-16.1 时间线
      inner = '<ul class="v-structured v-tl">' + (p.items || []).map(function (it) {
        return '<li><i class="v-tl-dot"></i><div class="v-tl-body">'
          + '<span class="v-tl-date">' + esc(it.date) + '</span>'
          + '<b>' + esc(pickT(it.title)) + '</b><span class="v-tl-desc">' + esc(pickT(it.desc)) + '</span>'
          + '</div></li>'
      }).join('') + '</ul>'
    } else if (e.type === 'skillMatrix') {
      // AC-16.1 技能矩阵
      inner = '<div class="v-structured v-sm">' + (p.items || []).map(function (it) {
        var lv = Math.min(100, Math.max(0, +it.level || 0))
        return '<div class="v-sm-row"><span>' + esc(it.name) + '</span>'
          + '<div class="v-sm-track"><i style="width:' + lv + '%"></i></div>'
          + '<em>' + lv + '</em></div>'
      }).join('') + '</div>'
    } else if (e.type === 'honors') {
      // AC-16.1 荣誉证书
      inner = '<ul class="v-structured v-hon">' + (p.items || []).map(function (it) {
        return '<li><b>' + esc(pickT(it.title)) + '</b><span>' + esc(it.issuer)
          + (it.date ? ' · ' + esc(it.date) : '') + '</span>'
          + (it.link ? '<a href="' + esc(it.link) + '" target="_blank" rel="noopener">查看 ↗</a>' : '')
          + '</li>'
      }).join('') + '</ul>'
    } else if (e.type === 'contactCard') {
      // AC-16.1 联系卡片
      inner = '<div class="v-structured v-cc">' + (p.items || []).map(function (it) {
        var row = it.href
          ? '<a class="v-cc-row" href="' + esc(it.href) + '" target="_blank" rel="noopener">'
          : '<div class="v-cc-row">'
        row += '<span class="v-cc-label">' + esc(pickT(it.label)) + '</span><span>' + esc(it.value) + '</span>'
        row += it.href ? '</a>' : '</div>'
        return row
      }).join('') + '</div>'
    }
    return '<div class="v-el' + noAnim + '" style="' + extra + 'left:' + e.x + '%;top:' + e.y + '%;width:' + e.w + '%;height:' + e.h
      + '%;z-index:' + (e.z || 0) + ';transition-delay:' + ((i % 6) * 0.07).toFixed(2) + 's">' + inner + '</div>'
  }

  // AC-18：多页站点（pages 数组）走四页 hash 路由运行时；必须在 FONT_STACK/lang 等变量初始化后分流
  if (data && Array.isArray(data.pages)) {
    renderMultiSite(root, data)
    return
  }

  var els = ((data && data.elements) || []).filter(function (e) { return e && e.visible !== false })
  root.innerHTML = '<div class="v-stage">'
    + '<div class="v-tech"><div class="vt-grid"></div><div class="vt-net"></div><div class="vt-vig"></div></div>'
    + els.map(elHtml).join('')
    + '</div>'

  // 滚动进场（官网式）：元素进入视口时加 v-in；无 IntersectionObserver（如 jsdom）直接全部显示
  var stage = root.querySelector('.v-stage')
  var nodes = stage ? [].slice.call(stage.children).filter(function (n) { return n.classList.contains('v-el') }) : []
  if (typeof IntersectionObserver === 'undefined') {
    nodes.forEach(function (n) { n.classList.add('v-in') })
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('v-in')
          io.unobserve(en.target)
        }
      })
    }, { threshold: 0.12 })
    nodes.forEach(function (n) { io.observe(n) })
  }

  // 分区分页导航（AC-9.2 ~ 9.5）：页码指示 + 上一页/下一页 + 平滑跳转 + 滚动高亮
  var rawSections = (data && data.sections) || []
  var nav = []
  rawSections.forEach(function (s) {
    if (s && typeof s.name === 'string' && s.name.trim()) {
      nav.push({ name: s.name.trim(), y: Math.min(100, Math.max(0, Math.round(Number(s.y) || 0))) })
    }
  })
  nav.sort(function (a, b) { return a.y - b.y })

  if (nav.length > 0 && typeof document !== 'undefined' && typeof window !== 'undefined') {
    var navEl = document.createElement('div')
    navEl.className = 'sec-nav'
    var navHtml = '<button class="sec-prev" aria-label="上一页">\u2190</button>'
    nav.forEach(function (s, i) {
      navHtml += '<button class="sec-num" data-i="' + i + '" title="' + esc(s.name) + '">'
        + '<span class="sec-idx">' + (i + 1) + '</span>'
        + '<span class="sec-name">' + esc(s.name) + '</span></button>'
    })
    navHtml += '<button class="sec-next" aria-label="下一页">\u2192</button>'
    navEl.innerHTML = navHtml
    root.appendChild(navEl)

    var pageHeightVh = (data && data.pageHeight) || 100
    var current = 0
    var nums = [].slice.call(navEl.querySelectorAll('.sec-num'))

    function stagePx() { return (pageHeightVh / 100) * window.innerHeight }
    function activeIdx() {
      var p = (window.scrollY / stagePx()) * 100
      var r = 0
      nav.forEach(function (s, i) { if (s.y <= p + 0.01) r = i })
      return r
    }
    function refresh() {
      current = activeIdx()
      nums.forEach(function (n, i) {
        if (i === current) n.classList.add('active')
        else n.classList.remove('active')
      })
      navEl.querySelector('.sec-prev').disabled = current <= 0
      navEl.querySelector('.sec-next').disabled = current >= nav.length - 1
    }
    function goTo(i) {
      var t = Math.min(Math.max(i, 0), nav.length - 1)
      window.scrollTo({ top: (nav[t].y / 100) * stagePx(), behavior: 'smooth' })
    }

    navEl.querySelector('.sec-prev').addEventListener('click', function () { goTo(current - 1) })
    navEl.querySelector('.sec-next').addEventListener('click', function () { goTo(current + 1) })
    nums.forEach(function (n) {
      n.addEventListener('click', function () { goTo(Number(n.getAttribute('data-i')) || 0) })
    })
    window.addEventListener('scroll', refresh, { passive: true })
    refresh()
  }

  // ── AC-18 多页站点运行时：四页 hash 路由 + 中英切换 + 滚动进场（file:// 离线可用）──
  function renderMultiSite(root, data) {
    lang = data.locale === 'en' ? 'en' : 'zh'
    var pages = (data.pages || []).filter(function (p) { return p && p.key })
    if (pages.length === 0) { root.innerHTML = ''; return }
    var firstKey = pages[0].key
    var ioCurrent = null

    function pageByKey(k) {
      for (var i = 0; i < pages.length; i++) if (pages[i].key === k) return pages[i]
      return null
    }
    function currentKey() {
      var h = typeof location !== 'undefined' ? location.hash.replace(/^#/, '') : ''
      var k = h === '' || h === '/' ? firstKey : h.replace(/^\//, '')
      return pageByKey(k) ? k : firstKey
    }
    function hrefOf(key) { return key === firstKey ? '#/' : '#/' + key }
    function navLinks(cls) {
      return pages.map(function (p) {
        return '<a class="' + cls + '" data-key="' + esc(p.key) + '" href="' + hrefOf(p.key) + '">' + esc(pickT(p.name)) + '</a>'
      }).join('')
    }

    root.innerHTML =
      '<canvas class="vp-canvas"></canvas>'
      + '<nav class="v-nav v-nav-top">' + navLinks('v-nav-link')
      + '<div class="v-lang"><button type="button" data-lang="zh">中文</button><button type="button" data-lang="en">EN</button></div></nav>'
      + '<div class="mp-stage" id="mp-stage"></div>'
      + '<nav class="v-nav v-nav-bottom">' + navLinks('v-nav-tab') + '</nav>'

    var stageBox = root.querySelector('#mp-stage')

    function reveal(container) {
      if (ioCurrent) { ioCurrent.disconnect(); ioCurrent = null }
      var nodes = [].slice.call(container.querySelectorAll('.v-el'))
      if (typeof IntersectionObserver === 'undefined') {
        nodes.forEach(function (n) { n.classList.add('v-in') })
        return
      }
      ioCurrent = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('v-in')
            ioCurrent.unobserve(en.target)
          }
        })
      }, { threshold: 0.12 })
      nodes.forEach(function (n) { ioCurrent.observe(n) })
    }

    function paint() {
      var page = pageByKey(currentKey())
      var els = (page.elements || []).filter(function (e) { return e && e.visible !== false })
      stageBox.innerHTML = '<div class="v-stage" style="height:' + (page.pageHeight || 100) + 'vh">'
        + '<div class="v-tech"><div class="vt-grid"></div><div class="vt-net"></div><div class="vt-vig"></div></div>'
        + els.map(elHtml).join('') + '</div>'
      // 导航：当前页高亮（顶部与底部同步）+ 页名跟随当前语言
      var links = [].slice.call(root.querySelectorAll('.v-nav-link, .v-nav-tab'))
      links.forEach(function (a) {
        var key = a.getAttribute('data-key')
        a.classList.toggle('active', key === page.key)
        a.textContent = pickT(pageByKey(key).name)
      })
      var langBtns = [].slice.call(root.querySelectorAll('.v-lang button'))
      langBtns.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-lang') === lang)
      })
      if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo(0, 0)
      reveal(stageBox)
    }

    root.querySelector('.v-lang').addEventListener('click', function (e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-lang]') : null
      if (!btn) return
      lang = btn.getAttribute('data-lang') === 'en' ? 'en' : 'zh'
      paint()
    })
    if (typeof window !== 'undefined') window.addEventListener('hashchange', paint)

    // AC-10.10 滚动到底后继续向下滚动滚轮进入下一页（首页→作品集→项目→关于我）。
    // 纯展示提示不响应点击；累积阈值 + 翻页冷却吸收触控板惯性。
    var wheelAccum = 0
    var wheelLast = 0
    var wheelLock = 0
    function onWheel(ev) {
      var now = Date.now()
      if (now < wheelLock) return
      var d = ev && typeof ev.deltaY === 'number' ? ev.deltaY : 0
      if (d <= 0) { wheelAccum = 0; return }
      if (now - wheelLast > 400) wheelAccum = 0
      wheelLast = now
      var doc = document.documentElement
      if (window.innerHeight + window.scrollY < doc.scrollHeight - 2) { wheelAccum = 0; return }
      wheelAccum += d
      if (wheelAccum < 160) return
      wheelAccum = 0
      wheelLock = now + 1200
      var cur = currentKey()
      var idx = -1
      for (var i = 0; i < pages.length; i++) if (pages[i].key === cur) idx = i
      var next = pages[idx + 1]
      if (next) location.hash = hrefOf(next.key)
    }
    // 多次 renderSiteInto（测试/热载）时替换旧监听，避免重复翻页
    if (typeof window !== 'undefined') {
      if (window.__vrWheel) window.removeEventListener('wheel', window.__vrWheel)
      window.__vrWheel = onWheel
      window.addEventListener('wheel', onWheel, { passive: true })
    }
    paint()

    // 粒子背景（AC-18.1）：引导逻辑由导出 HTML 注入，测试/缺失环境静默跳过
    try {
      var table = typeof PF_THEME === 'undefined' ? null : PF_THEME
      var cv = root.querySelector('.vp-canvas')
      if (cv && table && typeof window.__pfStart === 'function') {
        window.__pfStart(cv, data.theme, data.motion && data.motion.level, table)
      }
    } catch (err) { /* 粒子为增强层，失败不影响内容浏览 */ }
  }
}
