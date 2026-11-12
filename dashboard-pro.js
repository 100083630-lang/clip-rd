// CLIPRD - Dashboard Pro + Portada y Descripción Pro
// Funciones NUEVAS. No modifica ni reemplaza ninguna función existente.
// Solo lee de localStorage / window.clips. Nunca escribe ni borra datos.

(function () {
  'use strict';

  // ==================== DASHBOARD PRO ====================
  function getClips() {
    try {
      if (window.clips && Array.isArray(window.clips)) return window.clips;
      const raw = localStorage.getItem('clips') || localStorage.getItem('cliprd_clips') || '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function initDashboardPro() {
    const clips = getClips();
    const today = new Date().toISOString().slice(0, 10);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const total = clips.length;
    const scores = clips.map(c => Number(c.score || c.rating || 0)).filter(n => !isNaN(n));
    const bestScore = scores.length ? Math.max(...scores) : 0;
    const unpublished = clips.filter(c => !c.published && !c.posted).length;
    const todayClips = clips.filter(c => (c.date || c.createdAt || '').startsWith(today)).length;

    // Weekly goal (10 clips)
    const weekClips = clips.filter(c => {
      const d = new Date(c.date || c.createdAt || 0);
      return d >= weekStart;
    }).length;
    const weeklyProgress = Math.min(100, Math.round((weekClips / 10) * 100));

    const container = document.getElementById('dashboardPro');
    if (!container) return;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:22px">
        <div class="stat" style="background:#0c1022;border:1px solid #292d49;border-radius:18px;padding:18px">
          <div class="small" style="color:#98a0ba">Clips Totales</div>
          <b style="font-size:32px">${total}</b>
        </div>
        <div class="stat" style="background:#0c1022;border:1px solid #292d49;border-radius:18px;padding:18px">
          <div class="small" style="color:#98a0ba">Mejor Score</div>
          <b style="font-size:32px;color:#A855F7">${bestScore}</b>
        </div>
        <div class="stat" style="background:#0c1022;border:1px solid #292d49;border-radius:18px;padding:18px">
          <div class="small" style="color:#98a0ba">Sin Publicar</div>
          <b style="font-size:32px;color:#EC4899">${unpublished}</b>
        </div>
        <div class="stat" style="background:#0c1022;border:1px solid #292d49;border-radius:18px;padding:18px">
          <div class="small" style="color:#98a0ba">Clips de Hoy</div>
          <b style="font-size:32px">${todayClips}</b>
        </div>
      </div>

      <div style="background:#0c1022;border:1px solid #292d49;border-radius:18px;padding:18px;margin-bottom:22px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-weight:800">Meta semanal (10 clips)</span>
          <span>${weekClips}/10</span>
        </div>
        <div style="height:12px;background:#1e2338;border-radius:99px;overflow:hidden">
          <div style="width:${weeklyProgress}%;height:100%;background:linear-gradient(90deg,#A855F7,#EC4899);border-radius:99px"></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
        <div>
          <h3 style="margin:0 0 12px;font-size:18px">Cola de hoy</h3>
          <div id="proQueue" style="color:#98a0ba;font-size:14px">Sin elementos programados</div>
        </div>
        <div>
          <h3 style="margin:0 0 12px;font-size:18px">Últimos 3 clips</h3>
          <div id="proLastClips"></div>
        </div>
      </div>

      <div style="margin-top:22px">
        <h3 style="margin:0 0 12px;font-size:18px">Gráfica semanal</h3>
        <div id="proWeeklyChart" style="display:flex;align-items:flex-end;gap:8px;height:140px;padding:10px 0"></div>
        <div id="proDayDetail" style="margin-top:8px;color:#98a0ba;font-size:13px"></div>
      </div>
    `;

    // Últimos 3 clips
    const last3 = clips.slice(-3).reverse();
    const lastEl = document.getElementById('proLastClips');
    if (lastEl) {
      lastEl.innerHTML = last3.map(c => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;background:#0c1022;border-radius:12px;margin-bottom:8px;border:1px solid #292d49">
          <div style="width:48px;height:64px;background:#1e2338;border-radius:8px;display:grid;place-items:center;font-size:10px;color:#98a0ba">Cover</div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px">${(c.title || c.name || 'Sin título').slice(0, 40)}</div>
            <div style="font-size:12px;color:#A855F7">Score: ${c.score || c.rating || 0}</div>
          </div>
          <button onclick="alert('Publicar (demo)')" style="background:#A855F7;border:0;color:white;padding:6px 10px;border-radius:8px;font-size:11px;cursor:pointer">Publicar</button>
        </div>
      `).join('') || '<div style="color:#98a0ba">No hay clips</div>';
    }

    // Gráfica semanal clickeable
    const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const chart = document.getElementById('proWeeklyChart');
    if (chart) {
      chart.innerHTML = days.map((d, i) => {
        const count = clips.filter(c => {
          const dt = new Date(c.date || c.createdAt || 0);
          return dt.getDay() === i;
        }).length;
        const h = Math.max(8, Math.min(120, count * 18));
        return `<div style="flex:1;text-align:center;cursor:pointer" onclick="document.getElementById('proDayDetail').textContent='${d}: ${count} clips'">
          <div style="height:${h}px;background:linear-gradient(180deg,#A855F7,#EC4899);border-radius:6px 6px 2px 2px;margin:0 auto;width:70%"></div>
          <div style="font-size:10px;color:#98a0ba;margin-top:4px">${d}</div>
        </div>`;
      }).join('');
    }
  }

  // ==================== PORTADA Y DESCRIPCIÓN PRO ====================
  window.drawCoverPro = function (clip) {
    const title = (clip?.title || clip?.name || 'CLIP PRO').toUpperCase();
    const words = title.split(/\s+/).slice(0, 4).join(' ');
    return {
      text: words || 'CLIP PRO',
      background: '#0A0A0F',
      textColor: '#FFFFFF',
      accent: '#A855F7',
      position: 'center'
    };
  };

  window.improveDescriptionPro = function (clip) {
    const base = clip?.title || clip?.name || 'Este clip';
    return `${base} | Lo mejor de RD 🇩🇴\n\n#TikTokRD #YouTubeShorts #InstagramReels #Dominicana #CLIPRD #ViralRD #ContenidoRD`;
  };

  // ==================== INYECCIÓN SEGURA ====================
  function injectDashboardPro() {
    const homeView = document.querySelector('.view[data-view="home"], #home, .view.active') || document.querySelector('.app');
    if (!homeView) return;

    if (!document.getElementById('dashboardPro')) {
      const div = document.createElement('div');
      div.id = 'dashboardPro';
      div.style.cssText = 'margin-bottom:28px;padding:4px';
      homeView.insertBefore(div, homeView.firstChild);
    }
    initDashboardPro();
  }

  function addMejorarButtons() {
    document.querySelectorAll('.clip, .clip-card, [data-clip]').forEach(el => {
      if (el.querySelector('.mejorar-ia-btn')) return;
      const actions = el.querySelector('.actions') || el;
      const btn = document.createElement('button');
      btn.className = 'mejorar-ia-btn';
      btn.textContent = 'Mejorar con IA';
      btn.style.cssText = 'background:#A855F7;border:0;color:white;padding:8px 10px;border-radius:10px;font-size:11px;cursor:pointer;margin-top:6px';
      btn.onclick = (e) => {
        e.stopPropagation();
        const clipData = el.dataset || {};
        const result = window.improveDescriptionPro(clipData);
        alert('Descripción Pro generada:\n\n' + result);
      };
      actions.appendChild(btn);
    });
  }

  // Exponer función
  window.initDashboardPro = initDashboardPro;

  // Auto-init cuando el DOM esté listo y en cambios de vista
  function boot() {
    injectDashboardPro();
    addMejorarButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Re-inyectar al cambiar de vista (por si el dashboard se regenera)
  const observer = new MutationObserver(() => {
    if (document.querySelector('.view.active') || document.getElementById('appShell')) {
      setTimeout(boot, 100);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

})();
