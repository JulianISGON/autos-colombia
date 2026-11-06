const state = { celdas: [], presentes: [], usuarios: [], selectedCell: null, exitRegistro: null, editingUserId: null, filter: 'all' };

const $ = (selector) => document.querySelector(selector);
const api = async (path, options) => {
  const endpoint = path.startsWith('/api/') ? path : `/api/v1/acceso${path}`;
  const response = await fetch(endpoint, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { error: `La ruta ${endpoint} no está disponible en el servidor actual. Reinicia la aplicación.` };
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
  $('#cellGrid').innerHTML = cells.map((cell) => `<article class="cell ${cell.estado === 'DISPONIBLE' ? 'available' : cell.estado === 'MANTENIMIENTO' ? 'maintenance' : 'occupied'} ${state.selectedCell === cell.numero_celda ? 'selected' : ''}" data-cell="${cell.numero_celda}"><div class="cell-id">${cell.numero_celda}<span class="material-symbols-outlined">${cell.estado === 'DISPONIBLE' ? 'directions_car' : cell.estado === 'MANTENIMIENTO' ? 'construction' : 'local_parking'}</span></div><div class="cell-status">${cell.estado === 'DISPONIBLE' ? 'DISPONIBLE' : cell.estado === 'MANTENIMIENTO' ? 'MANTENIMIENTO' : `<span class="cell-plate">${cell.placa}</span>`}</div><div class="cell-footer">${cell.estado === 'DISPONIBLE' ? 'Libre para asignar' : cell.estado === 'MANTENIMIENTO' ? 'No asignable' : `Ingreso ${new Date(cell.fecha_ingreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}</div></article>`).join('') || '<p class="empty-state">No hay celdas para este filtro.</p>';
  document.querySelectorAll('.cell').forEach((element) => element.addEventListener('click', () => selectCell(element.dataset.cell)));
}

function selectCell(numeroCelda) {
  state.selectedCell = numeroCelda;
  const cell = state.celdas.find((item) => item.numero_celda === numeroCelda);
  if (!cell) return;
  const presente = state.presentes.find((item) => item.numero_celda === numeroCelda);
  $('#inspectorContent').innerHTML = `<div class="inspect-plate"><strong>${cell.placa || (cell.estado === 'MANTENIMIENTO' ? 'BLOQUEADA' : 'LIBRE')}</strong><small>${numeroCelda} · ${cell.estado}</small></div>${presente ? `<div class="inspect-meta"><div><small>Hora ingreso</small><b>${new Date(presente.fecha_ingreso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</b></div><div><small>Novedades</small><b>${presente.novedades.length}</b></div></div>${presente.novedades.map((novelty) => `<div class="inspect-novelty">${novelty.descripcion}</div>`).join('')}` : `<p class="inspector-note">${cell.estado === 'MANTENIMIENTO' ? 'Celda no disponible para asignación.' : 'Celda disponible para una nueva entrada.'}</p>`}<div class="cell-state-editor"><label for="cellState">Cambiar estado</label><select id="cellState" class="text-input"><option value="DISPONIBLE" ${cell.estado === 'DISPONIBLE' ? 'selected' : ''}>DISPONIBLE</option><option value="OCUPADA" ${cell.estado === 'OCUPADA' ? 'selected' : ''}>OCUPADA</option><option value="MANTENIMIENTO" ${cell.estado === 'MANTENIMIENTO' ? 'selected' : ''}>MANTENIMIENTO</option></select><button id="updateCellState" class="action green-action" type="button"><span class="material-symbols-outlined">published_with_changes</span><span>ACTUALIZAR ESTADO<small>Aplicar configuración de la celda</small></span></button><p id="cellInspectorMessage" class="message"></p></div>`;
  $('#updateCellState').addEventListener('click', () => updateCellState(cell.id_celda, $('#cellState').value));
  renderMap();
}

async function refresh() {
  [state.celdas, state.presentes, state.usuarios] = await Promise.all([api('/celdas'), api('/presentes'), api('/api/v1/usuarios')]);
  renderMetrics(); renderMovements(); renderMap(); renderUsers(); renderNovelties();
}

function renderUsers() {
  const query = ($('#userSearch').value || '').toLowerCase().trim();
  const users = state.usuarios.filter((user) => `${user.identificacion} ${user.nombre} ${user.telefono} ${(user.vehiculos || []).map((vehicle) => vehicle.placa).join(' ')}`.toLowerCase().includes(query));
  $('#userRows').innerHTML = users.length ? users.map((user) => `<tr><td><code>${user.identificacion}</code></td><td>${user.nombre}</td><td>${user.telefono}</td><td>${(user.vehiculos || []).length ? user.vehiculos.map((vehicle) => `<span class="vehicle-pill"><b>${vehicle.placa}</b><small>${vehicle.tipo_vehiculo}</small></span>`).join('') : '<span class="muted-text">Sin vehículo</span>'}</td><td><span class="status-pill ${user.estado_mensualidad === 'ACTIVA' ? 'status-active' : 'status-expired'}">${user.estado_mensualidad}</span></td><td><button class="table-action" data-edit-user="${user.id_usuario}">Editar</button><button class="table-action" data-user-id="${user.id_usuario}" data-user-status="${user.estado_mensualidad}">${user.estado_mensualidad === 'ACTIVA' ? 'Vencer' : 'Activar'}</button></td></tr>`).join('') : '<tr><td colspan="6" class="empty-state">No hay usuarios registrados.</td></tr>';
  document.querySelectorAll('[data-edit-user]').forEach((button) => button.addEventListener('click', () => editUser(Number(button.dataset.editUser))));
  document.querySelectorAll('[data-user-id]').forEach((button) => button.addEventListener('click', () => updateUserStatus(Number(button.dataset.userId), button.dataset.userStatus === 'ACTIVA' ? 'VENCIDA' : 'ACTIVA')));
}

function renderNovelties() {
  const rows = state.presentes.flatMap((present) => present.novedades.map((novelty) => `<tr><td><code>${present.placa}</code></td><td><code>${present.numero_celda}</code></td><td>${novelty.descripcion}</td><td>${new Date(novelty.fecha_registro).toLocaleString('es-CO')}</td></tr>`));
  $('#noveltyRows').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="4" class="empty-state">No hay novedades activas registradas.</td></tr>';
}

async function createUser(event) {
  event.preventDefault();
  const body = { identificacion: $('#userIdentification').value, nombre: $('#userName').value, telefono: $('#userPhone').value, placa: $('#userVehiclePlate').value, tipo_vehiculo: $('#userVehicleType').value, estado_mensualidad: $('#userStatus').value };
  try { await api(state.editingUserId ? `/api/v1/usuarios/${state.editingUserId}` : '/api/v1/usuarios', { method: state.editingUserId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); showMessage('#userMessage', state.editingUserId ? 'Usuario actualizado correctamente.' : 'Usuario registrado exitosamente.'); resetUserForm(); await refresh(); } catch (error) { showMessage('#userMessage', error.message, true); }
}

function editUser(id) {
  const user = state.usuarios.find((item) => item.id_usuario === id);
  if (!user) return;
  const vehicle = (user.vehiculos || [])[0];
  state.editingUserId = id;
  $('#userIdentification').value = user.identificacion;
  $('#userName').value = user.nombre;
  $('#userPhone').value = user.telefono;
  $('#userVehiclePlate').value = vehicle?.placa || '';
  $('#userVehicleType').value = vehicle?.tipo_vehiculo || 'AUTOMOVIL';
  $('#userStatus').value = user.estado_mensualidad;
  $('#userFormTitle').textContent = 'Editar usuario y vehículo';
  $('#userFormIcon').textContent = 'edit';
  $('#userSubmit').querySelector('span:last-child').innerHTML = 'GUARDAR CAMBIOS<small>Actualizar datos y relación vehicular</small>';
  $('#cancelUserEdit').hidden = false;
  switchView('usuarios');
  $('#userIdentification').focus();
}

function resetUserForm() {
  state.editingUserId = null;
  $('#userForm').reset();
  $('#userFormTitle').textContent = 'Registrar usuario';
  $('#userFormIcon').textContent = 'person_add';
  $('#userSubmit').querySelector('span:last-child').innerHTML = 'CREAR USUARIO<small>Guardar usuario y vehículo asociado</small>';
  $('#cancelUserEdit').hidden = true;
}

async function updateUserStatus(id, estado) {
  try { await api(`/api/v1/usuarios/${id}/mensualidad`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado_mensualidad: estado }) }); showMessage('#userMessage', 'Mensualidad actualizada.'); await refresh(); } catch (error) { showMessage('#userMessage', error.message, true); }
}

async function createCell(event) {
  event.preventDefault();
  try { await api('/api/v1/celdas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numero_celda: $('#cellNumber').value }) }); showMessage('#cellMessage', 'Celda creada exitosamente.'); event.target.reset(); await refresh(); } catch (error) { showMessage('#cellMessage', error.message, true); }
}

async function updateCellState(id, estado) {
  try { await api(`/api/v1/celdas/${id}/estado`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado }) }); showMessage('#cellInspectorMessage', 'Estado de celda actualizado.'); await refresh(); selectCell(state.selectedCell); } catch (error) { showMessage('#cellInspectorMessage', error.message, true); }
}

function switchView(view) {
  const viewId = view === 'mapa' ? 'mapView' : `${view}View`;
  document.querySelectorAll('.view').forEach((section) => section.classList.toggle('active-view', section.id === viewId));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  if (view === 'mapa') renderMap();
  if (view === 'usuarios') renderUsers();
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
  $('#entryButton').addEventListener('click', registerEntry); $('#searchExit').addEventListener('click', searchExit); $('#exitButton').addEventListener('click', registerExit); $('#refreshButton').addEventListener('click', refresh); $('#mapRefresh').addEventListener('click', refresh); $('#cellSearch').addEventListener('input', renderMap); $('#cellForm').addEventListener('submit', createCell); $('#userSearch').addEventListener('input', renderUsers); $('#refreshUsers').addEventListener('click', refresh); $('#userForm').addEventListener('submit', createUser); $('#cancelUserEdit').addEventListener('click', resetUserForm);
  document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active')); button.classList.add('active'); state.filter = button.dataset.filter === 'all' ? 'all' : button.dataset.filter; renderMap(); }));
  document.querySelectorAll('.nav-item, [data-view="control"]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
  document.addEventListener('keydown', (event) => { if (event.key === 'F2') { event.preventDefault(); $('#entryPlate').focus(); } if (event.key === 'F4') { event.preventDefault(); $('#exitPlate').focus(); } });
}

bindEvents(); updateClock(); setInterval(updateClock, 1000); refresh().catch((error) => showMessage('#entryMessage', error.message, true)); setInterval(() => refresh().catch(() => {}), 5000);