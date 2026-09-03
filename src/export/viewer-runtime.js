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

  function elHtml(e, i) {
    var p = e.props || {}
    var inner = ''
    if (e.type === 'text') {
      // 字号按 1440 设计稿宽度换算为 vw，随屏幕等比缩放（AC-2.8）
      var vw = ((p.fontSize || 16) / 14.4).toFixed(3)
      inner = '<div class="v-text" style="font-size:' + vw + 'vw;color:' + esc(p.color)
        + ';font-weight:' + (p.weight || 400)
        + ';text-align:' + (p.align || 'left') + '">' + esc(p.content) + '</div>'
    } else if (e.type === 'image') {
      inner = p.src
        ? '<img class="v-fill" src="' + esc(p.src) + '" alt="' + esc(p.alt) + '">'
        : '<div class="v-ph">图片</div>'
    } else if (e.type === 'video') {
      if (p.source === 'link' && p.url) {
        inner = '<iframe class="v-fill" src="' + esc(p.url) + '" frameborder="0" allowfullscreen></iframe>'
      } else if (p.src) {
        inner = '<video class="v-fill" src="' + esc(p.src) + '" controls></video>'
      } else {
        inner = '<div class="v-ph">视频</div>'
      }
    } else if (e.type === 'link') {
      inner = '<a class="v-link" href="' + esc(p.url) + '" target="_blank" rel="noopener">'
        + '<b>' + esc(p.title) + '</b><span>' + esc(p.url) + '</span></a>'
    } else if (e.type === 'skillTag') {
      inner = '<div class="v-tags" style="justify-content:'
        + (p.align === 'center' ? 'center' : 'flex-start') + '">'
        + (p.tags || []).map(function (t) {
          return '<span class="v-tag">' + esc(t) + '</span>'
        }).join('') + '</div>'
    } else if (e.type === 'gallery') {
      inner = '<div class="v-gallery">' + (p.images || []).map(function (im) {
        return '<figure class="v-gitem">'
          + (im.src ? '<img src="' + esc(im.src) + '">' : '<div class="v-ph">' + esc(im.caption) + '</div>')
          + (im.caption ? '<figcaption>' + esc(im.caption) + '</figcaption>' : '')
          + '</figure>'
      }).join('') + '</div>'
    } else if (e.type === 'decoration') {
      inner = '<div class="v-deco" style="background:' + esc(p.color)
        + ';opacity:' + (p.opacity == null ? 1 : p.opacity)
        + (p.blur ? ';filter:blur(' + p.blur + 'px)' : '') + '"></div>'
    }
    return '<div class="v-el" style="left:' + e.x + '%;top:' + e.y + '%;width:' + e.w + '%;height:' + e.h
      + '%;z-index:' + (e.z || 0) + ';transition-delay:' + ((i % 6) * 0.07).toFixed(2) + 's">' + inner + '</div>'
  }

  var els = (data && data.elements) || []
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
}
