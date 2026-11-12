// CLIPRD - MÓDULO EDITOR
// Se abre al hacer click en un clip de la Biblioteca.
// NO modifica ninguna función, vista o diseño existente.

(function () {
  'use strict';

  const ENGINE = 'http://127.0.0.1:3847';

  function createEditorModal(clip) {
    const existing = document.getElementById('editorModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'editorModal';
    modal.style.cssText = `
      position:fixed; inset:0; z-index:10000; background:rgba(0,0,0,.85);
      display:grid; place-items:center; padding:20px; backdrop-filter:blur(8px);
    `;

    modal.innerHTML = `
      <div style="background:#0A0A0F; border:1px solid #292d49; border-radius:24px; width:min(1100px,100%); max-height:94vh; overflow:auto; padding:20px; display:grid; grid-template-columns:380px 1fr; gap:20px;">
        <!-- PREVIEW 9:16 -->
        <div>
          <div style="aspect-ratio:9/16; background:#000; border-radius:16px; overflow:hidden; position:relative; max-height:70vh; margin:auto;">
            <video id="editorPreview" src="${clip.url || clip.src || ''}" style="width:100%; height:100%; object-fit:cover;" controls muted></video>
            <div id="editorOverlay" style="position:absolute; inset:0; pointer-events:none;"></div>
          </div>
          <div style="text-align:center; margin-top:10px; font-size:12px; color:#98a0ba;">Preview 1080x1920</div>
        </div>

        <!-- CONTROLES -->
        <div>
          <div style="display:flex; gap:8px; margin-bottom:16px;">
            <button class="btn" id="tabZonas" style="background:#A855F7;">Zonas</button>
            <button class="btn alt" id="tabFiltros">Filtros</button>
            <button class="btn alt" id="tabExportar">Exportar</button>
          </div>

          <div id="panelZonas">
            <h3 style="margin:0 0 12px;">Inicio – Fin – Duración</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
              <button class="btn" id="markStart">Marcar inicio</button>
              <button class="btn" id="markEnd">Marcar fin</button>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
              <button class="btn alt" data-duration="3">Gancho 3s</button>
              <button class="btn alt" data-duration="8">Frase 8s</button>
              <button class="btn alt" data-duration="11">Reacción 11s</button>
            </div>
            <label style="display:flex; align-items:center; gap:8px; font-size:13px;">
              <input type="checkbox" id="stopAtEnd"> Detener al llegar al fin
            </label>
            <div id="timeInfo" style="margin-top:10px; font-size:13px; color:#98a0ba;">Inicio: -- | Fin: -- | Duración: --</div>
          </div>

          <div id="panelFiltros" style="display:none;">
            <h3 style="margin:0 0 12px;">Filtros</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              ${['Normal','Pre-cine','Película','Cálido + Resplandor','VHS','Fuga de luz','RGB en vivo'].map(f => 
                `<button class="btn alt" data-filter="${f}" style="font-size:12px;">${f}</button>`
              ).join('')}
            </div>
          </div>

          <div id="panelExportar" style="display:none;">
            <h3 style="margin:0 0 12px;">Exportar Clip</h3>
            <div style="font-size:13px; color:#98a0ba; margin-bottom:12px;">
              Perfil Libre – sin tope<br>
              Salida 1080x1920 alto<br>
              FPS Original · Calidad Alta · Audio AAC
            </div>
            <div style="margin:12px 0;">
              <label style="font-size:12px;">Crop X</label>
              <input type="range" id="cropX" min="0" max="100" value="50" style="width:100%;">
              <div style="display:flex; justify-content:space-between; font-size:11px; color:#98a0ba;">
                <span>Izquierda</span><span>Centro</span><span>Derecha</span>
              </div>
            </div>
            <div style="display:flex; gap:10px; margin-top:16px;">
              <button class="btn good" id="doExport">Exportar</button>
              <button class="btn alt" id="cancelEditor">Cancelar</button>
            </div>
            <div id="exportStatus" style="margin-top:10px; font-size:13px;"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Lógica
    const video = modal.querySelector('#editorPreview');
    let startTime = 0;
    let endTime = video.duration || 15;

    function updateTimeInfo() {
      const dur = Math.max(0, endTime - startTime);
      modal.querySelector('#timeInfo').textContent = `Inicio: ${startTime.toFixed(1)}s | Fin: ${endTime.toFixed(1)}s | Duración: ${dur.toFixed(1)}s`;
    }

    modal.querySelector('#markStart').onclick = () => { startTime = video.currentTime; updateTimeInfo(); };
    modal.querySelector('#markEnd').onclick = () => { endTime = video.currentTime; updateTimeInfo(); };

    modal.querySelectorAll('[data-duration]').forEach(btn => {
      btn.onclick = () => {
        const d = Number(btn.dataset.duration);
        endTime = startTime + d;
        updateTimeInfo();
      };
    });

    // Tabs
    function showPanel(name) {
      modal.querySelector('#panelZonas').style.display = name === 'zonas' ? 'block' : 'none';
      modal.querySelector('#panelFiltros').style.display = name === 'filtros' ? 'block' : 'none';
      modal.querySelector('#panelExportar').style.display = name === 'exportar' ? 'block' : 'none';
    }
    modal.querySelector('#tabZonas').onclick = () => showPanel('zonas');
    modal.querySelector('#tabFiltros').onclick = () => showPanel('filtros');
    modal.querySelector('#tabExportar').onclick = () => showPanel('exportar');

    // Filtros visuales (CSS filter)
    modal.querySelectorAll('[data-filter]').forEach(btn => {
      btn.onclick = () => {
        const f = btn.dataset.filter;
        const filters = {
          'Normal': 'none',
          'Pre-cine': 'contrast(1.1) saturate(0.9)',
          'Película': 'sepia(0.4) contrast(1.2)',
          'Cálido + Resplandor': 'sepia(0.3) brightness(1.1)',
          'VHS': 'contrast(1.3) saturate(1.4) hue-rotate(-10deg)',
          'Fuga de luz': 'brightness(1.2) contrast(0.9)',
          'RGB en vivo': 'hue-rotate(90deg) saturate(1.5)'
        };
        video.style.filter = filters[f] || 'none';
      };
    });

    // Export
    modal.querySelector('#doExport').onclick = async () => {
      const status = modal.querySelector('#exportStatus');
      status.textContent = 'Exportando...';
      status.style.color = '#A855F7';

      try {
        const crop = Number(modal.querySelector('#cropX').value);
        const res = await fetch(`${ENGINE}/export`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceUrl: clip.url || clip.src,
            start: startTime,
            end: endTime,
            cropX: crop,
            title: clip.title || 'clip-editado'
          })
        });
        const data = await res.json();
        if (data.ok) {
          status.textContent = 'Exportado a la Biblioteca';
          status.style.color = '#34d399';
          setTimeout(() => modal.remove(), 1500);
        } else {
          throw new Error(data.error || 'Error');
        }
      } catch (e) {
        status.textContent = 'Error: ' + e.message + ' (asegúrate que el motor local está corriendo)';
        status.style.color = '#fb7185';
      }
    };

    modal.querySelector('#cancelEditor').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    video.onloadedmetadata = () => { endTime = Math.min(15, video.duration || 15); updateTimeInfo(); };
  }

  // Abrir editor al hacer click en un clip de la Biblioteca
  function attachEditorListeners() {
    document.querySelectorAll('.clip, .clip-card, [data-clip]').forEach(el => {
      if (el.dataset.editorAttached) return;
      el.dataset.editorAttached = '1';
      el.addEventListener('click', (e) => {
        // Evitar que se active en botones internos
        if (e.target.closest('button, a, .actions')) return;

        const clip = {
          url: el.querySelector('video')?.src || el.dataset.url || '',
          title: el.querySelector('.title')?.textContent || 'Clip',
          src: el.querySelector('video')?.src
        };
        if (clip.url || clip.src) {
          createEditorModal(clip);
        }
      });
    });
  }

  // Observer para clips que se agreguen dinámicamente
  const observer = new MutationObserver(() => {
    attachEditorListeners();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachEditorListeners);
  } else {
    attachEditorListeners();
  }

  console.log('CLIPRD Editor module loaded');
})();
