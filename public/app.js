const state = { celdas: [], presentes: [], selectedCell: null, exitRegistro: null, filter: 'all' };

const $ = (selector) => document.querySelector(selector);
const api = async (path, options) => {
  const response = await fetch(`/api/v1/acceso${path}`, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No fue posible completar la operación');
  return data;
};

function showMessage(selector, text, error = false) {
  const element = $(selector);
  element.textContent = text;
  element.classList.toggle('error', error);
}

function updateClock() {
  $('#clock').firstChild.textContent = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/Bogota' }).format(new Date());
}

function renderMetrics() {
  const occupied = state.celdas.filter((cell) => cell.estado === 'OCUPADA').length;
  const total = state.celdas.length;
  const percentage = total ? Math.round((occupied / total) * 100) : 0;
  $('#occupancy').innerHTML = `${occupied}/${total} <em>(${percentage}%)</em>`;
  $('#occupancyPercent').textContent = `${percentage}%`;
  $('#occupiedCount').innerHTML = `${occupied} <small>/ ${total} celdas</small>`;
  $('#availableCount').textContent = total - occupied;
  $('#occupancyBar').style.width = `${percentage}%`;
  $('#kpiBar').style.width = `${percentage}%`;
}

function renderMovements() {
  $('#movementRows').innerHTML = state.presentes.length ? state.presentes.map((item) => `<tr><td><code>${new Date(item.fecha_ingreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</code></td><td><code>${item.placa}</code></td><td><code>${item.numero_celda}</code></td><td><span class="green">● Ingresó</span></td><td>${item.novedades.length ? `<span class="amber">${item.novedades.length} registrada(s)</span>` : '<span>Sin novedad</span>'}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-state">No hay vehículos dentro del parqueadero.</td></tr>';
}

function renderMap() {
  const query = ($('#cellSearch').value || '').toUpperCase();
  const cells = state.celdas.filter((cell) => (state.filter === 'all' || cell.estado === state.filter) && `${cell.numero_celda} ${cell.placa || ''}`.includes(query));
  $('#mapStatus').textContent = `${state.celdas.filter((cell) => cell.estado === 'OCUPADA').length}/${state.celdas.length} ocupadas`;
  $('#cellGrid').innerHTML = cells.map((cell) => `<article class="cell ${cell.estado === 'DISPONIBLE' ? 'available' : 'occupied'} ${state.selectedCell === cell.numero_celda ? 'selected' : ''}" data-cell="${cell.numero_celda}"><div class="cell-id">${cell.numero_celda}<span class="material-symbols-outlined">${cell.estado === 'DISPONIBLE' ? 'directions_car' : 'local_parking'}</span></div><div class="cell-status">${cell.estado === 'DISPONIBLE' ? 'DISPONIBLE' : `<span class="cell-plate">${cell.placa}</span>`}</div><div class="cell-footer">${cell.estado === 'DISPONIBLE' ? 'Libre para asignar' : `Ingreso ${new Date(cell.fecha_ingreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}</div></article>`).join('') || '<p class="empty-state">No hay celdas para este filtro.</p>';
  document.querySelectorAll('.cell').forEach((element) => element.addEventListener('click', () => selectCell(element.dataset.cell)));
}

function selectCell(numeroCelda) {
  state.selectedCell = numeroCelda;
  const cell = state.celdas.find((item) => item.numero_celda === numeroCelda);
  if (!cell) return;
  const presente = state.presentes.find((item) => item.numero_celda === numeroCelda);
  $('#inspectorContent').innerHTML = `<div class="inspect-plate"><strong>${cell.placa || 'LIBRE'}</strong><small>${numeroCelda} · ${cell.estado}</small></div>${presente ? `<div class="inspect-meta"><div><small>Hora ingreso</small><b>${new Date(presente.fecha_ingreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</b></div><div><small>Novedades</small><b>${presente.novedades.length}</b></div></div>${presente.novedades.map((novelty) => `<div class="inspect-novelty">${novelty.descripcion}</div>`).join('')}` : '<p class="inspector-note">Celda disponible para una nueva entrada.</p>'}`;
  renderMap();
}

async function refresh() {
  [state.celdas, state.presentes] = await Promise.all([api('/celdas'), api('/presentes')]);
  renderMetrics(); renderMovements(); renderMap();
}

async function registerEntry() {
  const plate = $('#entryPlate').value.trim().toUpperCase();
  const novelty = $('#hasNovelty').checked ? $('#noveltyText').value.trim() : undefined;
  try { const result = await api('/entrada', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placa: plate, observacionNovedad: novelty }) }); showMessage('#entryMessage', `Entrada registrada. Celda asignada: ${result.celda}`); await refresh(); } catch (error) { showMessage('#entryMessage', error.message, true); }
}

async function searchExit() {
  try { const registro = state.presentes.find((item) => item.placa === $('#exitPlate').value.trim().toUpperCase()); if (!registro) throw new Error('El vehículo no se encuentra dentro del parqueadero'); state.exitRegistro = registro; $('#exitSummary').className = 'exit-summary'; $('#exitSummary').innerHTML = `<div class="summary-line"><span><small>Placa</small><b>${registro.placa}</b></span><span><small>Celda</small><b class="amber">${registro.numero_celda}</b></span></div><div class="summary-line"><span><small>Ingreso</small><b>${new Date(registro.fecha_ingreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</b></span><span><small>Novedades</small><b>${registro.novedades.length}</b></span></div>`; $('#exitButton').disabled = false; showMessage('#exitMessage', 'Vehículo localizado y listo para salida.'); } catch (error) { showMessage('#exitMessage', error.message, true); }
}

async function registerExit() {
  if (!state.exitRegistro) return;
  try { const result = await api('/salida', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ placa: state.exitRegistro.placa }) }); showMessage('#exitMessage', `Salida registrada. Celda ${result.celda} liberada.`); state.exitRegistro = null; $('#exitButton').disabled = true; $('#exitSummary').className = 'exit-summary empty-state'; $('#exitSummary').innerHTML = '<span class="material-symbols-outlined">check_circle</span><p>Salida completada correctamente.</p>'; await refresh(); } catch (error) { showMessage('#exitMessage', error.message, true); }
}

function bindEvents() {
  $('#entryPlate').addEventListener('input', (event) => { event.target.value = event.target.value.toUpperCase(); $('#entryPreview').textContent = event.target.value || '---'; });
  $('#hasNovelty').addEventListener('change', (event) => { $('#noveltyText').hidden = !event.target.checked; });
  $('#entryButton').addEventListener('click', registerEntry); $('#searchExit').addEventListener('click', searchExit); $('#exitButton').addEventListener('click', registerExit); $('#refreshButton').addEventListener('click', refresh); $('#mapRefresh').addEventListener('click', refresh); $('#cellSearch').addEventListener('input', renderMap);
  document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active')); button.classList.add('active'); state.filter = button.dataset.filter.toLowerCase() === 'all' ? 'all' : button.dataset.filter; renderMap(); }));
  document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', () => { const map = button.dataset.view === 'mapa'; document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active')); button.classList.add('active'); $('#controlView').classList.toggle('active-view', !map); $('#mapView').classList.toggle('active-view', map); if (map) renderMap(); }));
  document.addEventListener('keydown', (event) => { if (event.key === 'F2') { event.preventDefault(); $('#entryPlate').focus(); } if (event.key === 'F4') { event.preventDefault(); $('#exitPlate').focus(); } });
}

bindEvents(); updateClock(); setInterval(updateClock, 1000); refresh().catch((error) => showMessage('#entryMessage', error.message, true)); setInterval(() => refresh().catch(() => {}), 5000);