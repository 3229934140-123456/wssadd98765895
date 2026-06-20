const state = {
    selectedPatient: null,
    selectedDoctor: null,
    selectedChair: null,
    selectedDate: null,
    selectedTime: null,
    currentWarningPatient: null,
    currentHandoverPatient: null,
    filteredPatients: [...PATIENTS],
    filteredWarnings: [...WARNING_PATIENTS],
    selectedPatientIds: new Set(),
    scheduleDate: null,
    scheduleView: 'day',
    pendingView: 'list',
    warningFilters: {
        risk: '',
        doctor: '',
        missType: '',
        status: ''
    },
    patientFilters: {
        doctor: '',
        project: '',
        dateFrom: '',
        dateTo: '',
        urgency: ''
    },
    weekFilterDoctor: '',
    weekFilterChair: ''
};

function formatDateCN(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

function daysBetween(dateStr) {
    const target = new Date(dateStr);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getRecallInfo(patient) {
    const rule = RECALL_RULES[patient.project];
    const lastVisit = new Date(patient.lastVisit);
    const minDate = new Date(lastVisit);
    minDate.setDate(minDate.getDate() + rule.minDays);
    const maxDate = new Date(lastVisit);
    maxDate.setDate(maxDate.getDate() + rule.maxDays);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let urgency, urgencyClass, urgencyText;
    const daysToMin = daysBetween(minDate.toISOString().split('T')[0]);
    const daysToMax = daysBetween(maxDate.toISOString().split('T')[0]);

    if (daysToMax < 0) {
        urgency = 'overdue';
        urgencyClass = 'urgency-overdue';
        urgencyText = `已超期 ${Math.abs(daysToMax)} 天`;
    } else if (daysToMin <= 3) {
        urgency = 'urgent';
        urgencyClass = 'urgency-urgent';
        urgencyText = daysToMin <= 0 ? '建议尽快安排' : `${daysToMin} 天后进入窗口`;
    } else {
        urgency = 'normal';
        urgencyClass = 'urgency-normal';
        urgencyText = `${daysToMin} 天后开始`;
    }

    return {
        rule,
        minDate: minDate.toISOString().split('T')[0],
        maxDate: maxDate.toISOString().split('T')[0],
        urgency,
        urgencyClass,
        urgencyText
    };
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = type === 'success'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    toast.innerHTML = `${icon}${message}`;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}

function initDateDisplay() {
    const now = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekdays[now.getDay()]}`;
    document.getElementById('currentDate').textContent = dateStr;
}

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`panel-${tab}`).classList.add('active');
        });
    });
}

function renderPendingTable() {
    const tbody = document.getElementById('pendingTableBody');
    const patients = state.filteredPatients;

    if (patients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding:40px; color:var(--text-400);">暂无符合条件的患者</td></tr>';
        updateStats();
        return;
    }

    tbody.innerHTML = patients.map(p => {
        const recall = getRecallInfo(p);
        const avatarColor = getAvatarColor(p.name);
        const checked = state.selectedPatientIds.has(p.id) ? 'checked' : '';
        const batchClass = p.batchStatus !== 'none' ? `batch-status-${p.batchStatus}` : '';
        const batchTag = p.batchStatus !== 'none'
            ? `<span class="batch-status-tag ${batchClass}">${PATIENT_BATCH_LABELS[p.batchStatus]}</span>` : '';
        return `
            <tr>
                <td class="td-checkbox">
                    <label>
                        <input type="checkbox" class="row-checkbox" data-pid="${p.id}" ${checked} onchange="togglePatientSelect('${p.id}', this.checked)">
                        <span class="check-box"></span>
                    </label>
                </td>
                <td>
                    <div class="patient-cell">
                        <div class="patient-avatar-sm" style="background:${avatarColor}">${p.name.charAt(0)}</div>
                        <div>
                            <span class="patient-name-sm">${p.name}</span>
                        </div>
                    </div>
                </td>
                <td>${p.gender} / ${p.age}岁</td>
                <td>${p.phone}</td>
                <td><span class="project-tag tag-${p.project}">${p.project}</span></td>
                <td>${p.doctor}</td>
                <td>${formatDateShort(p.lastVisit)}</td>
                <td>
                    <div class="recall-window">
                        <span class="recall-date">${formatDateShort(recall.minDate)} - ${formatDateShort(recall.maxDate)}</span>
                        <span class="recall-days">${recall.rule.label}</span>
                    </div>
                </td>
                <td><span class="urgency-badge ${recall.urgencyClass}">${recall.urgencyText}</span></td>
                <td>${batchTag || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-link" onclick="showPatientDetail('${p.id}')">查看详情</button>
                        <button class="btn-link" onclick="quickBook('${p.id}')">预约</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    updateStats();
    updateBatchCount();
}

function updateStats() {
    let overdue = 0, urgent = 0, normal = 0;
    state.filteredPatients.forEach(p => {
        const recall = getRecallInfo(p);
        if (recall.urgency === 'overdue') overdue++;
        else if (recall.urgency === 'urgent') urgent++;
        else normal++;
    });
    document.getElementById('statOverdue').textContent = overdue;
    document.getElementById('statUrgent').textContent = urgent;
    document.getElementById('statNormal').textContent = normal;
    document.getElementById('statTotal').textContent = state.filteredPatients.length;
    document.getElementById('pendingCount').textContent = PATIENTS.length;
}

function togglePatientSelect(pid, checked) {
    if (checked) {
        state.selectedPatientIds.add(pid);
    } else {
        state.selectedPatientIds.delete(pid);
    }
    updateBatchCount();
    const selectAll = document.getElementById('selectAllPatients');
    const allIds = state.filteredPatients.map(p => p.id);
    selectAll.checked = allIds.length > 0 && allIds.every(id => state.selectedPatientIds.has(id));
}

function updateBatchCount() {
    document.getElementById('selectedCount').textContent = state.selectedPatientIds.size;
}

function initBatchActions() {
    document.getElementById('selectAllPatients').addEventListener('change', function() {
        const allIds = state.filteredPatients.map(p => p.id);
        if (this.checked) {
            allIds.forEach(id => state.selectedPatientIds.add(id));
        } else {
            allIds.forEach(id => state.selectedPatientIds.delete(id));
        }
        renderPendingTable();
    });

    document.getElementById('btnBatchContacted').addEventListener('click', () => {
        if (state.selectedPatientIds.size === 0) {
            showToast('请先勾选患者', 'error');
            return;
        }
        state.selectedPatientIds.forEach(id => {
            const p = PATIENTS.find(x => x.id === id);
            if (p) p.batchStatus = 'contacted';
        });
        persistPatients();
        const count = state.selectedPatientIds.size;
        state.selectedPatientIds.clear();
        document.getElementById('selectAllPatients').checked = false;
        renderPendingTable();
        renderHandoverView();
        showToast(`已将 ${count} 位患者标记为已联系`);
    });

    document.getElementById('btnBatchPostpone').addEventListener('click', () => {
        if (state.selectedPatientIds.size === 0) {
            showToast('请先勾选患者', 'error');
            return;
        }
        state.selectedPatientIds.forEach(id => {
            const p = PATIENTS.find(x => x.id === id);
            if (p) p.batchStatus = 'postponed';
        });
        persistPatients();
        const count = state.selectedPatientIds.size;
        state.selectedPatientIds.clear();
        document.getElementById('selectAllPatients').checked = false;
        renderPendingTable();
        renderHandoverView();
        showToast(`已将 ${count} 位患者标记为暂缓安排`);
    });

    document.getElementById('btnBatchExport').addEventListener('click', () => {
        const ids = state.selectedPatientIds.size > 0
            ? state.selectedPatientIds
            : new Set(state.filteredPatients.map(p => p.id));
        const patients = PATIENTS.filter(p => ids.has(p.id));
        if (patients.length === 0) {
            showToast('没有可导出的患者', 'error');
            return;
        }

        const header = '序号\t姓名\t性别\t年龄\t电话\t治疗项目\t主治医生\t上次就诊\t建议复诊窗口\t紧急度\t处理状态\t跟进备注\t下次提醒日期';
        const rows = patients.map((p, i) => {
            const recall = getRecallInfo(p);
            const urgencyMap = { overdue: '已超期', urgent: '即将到期', normal: '正常窗口' };
            return `${i + 1}\t${p.name}\t${p.gender}\t${p.age}\t${p.phone}\t${p.project}\t${p.doctor}\t${p.lastVisit}\t${recall.minDate}~${recall.maxDate}\t${urgencyMap[recall.urgency]}\t${PATIENT_BATCH_LABELS[p.batchStatus] || '未处理'}\t${p.followUpNote || ''}\t${p.nextReminderDate || ''}`;
        });
        const content = header + '\n' + rows.join('\n');

        const body = document.getElementById('patientDetailBody');
        body.innerHTML = `
            <div class="detail-section">
                <h4>导出名单（${patients.length} 位患者）</h4>
                <div class="export-modal-content">${content}</div>
                <div class="export-actions">
                    <button class="btn btn-primary" onclick="copyExportContent()">复制到剪贴板</button>
                </div>
            </div>
        `;
        document.getElementById('patientDetailModal').classList.add('show');
    });
}

function copyExportContent() {
    const el = document.querySelector('.export-modal-content');
    if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
        showToast('已复制到剪贴板');
    }
}

function initFilters() {
    document.getElementById('btnSearch').addEventListener('click', applyFilters);
    document.getElementById('btnResetFilter').addEventListener('click', resetFilters);
}

function applyFilters(showToastFlag = true) {
    const doctor = document.getElementById('filterDoctor').value;
    const project = document.getElementById('filterProject').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    const urgency = document.getElementById('filterUrgency').value;

    state.patientFilters = { doctor, project, dateFrom, dateTo, urgency };
    saveToStorage(STORAGE_KEYS.PATIENT_FILTERS, state.patientFilters);

    state.filteredPatients = PATIENTS.filter(p => {
        if (doctor && p.doctor !== doctor) return false;
        if (project && p.project !== project) return false;
        if (dateFrom && p.lastVisit < dateFrom) return false;
        if (dateTo && p.lastVisit > dateTo) return false;
        if (urgency) {
            const recall = getRecallInfo(p);
            if (recall.urgency !== urgency) return false;
        }
        return true;
    });

    state.selectedPatientIds.clear();
    document.getElementById('selectAllPatients').checked = false;
    renderPendingTable();
    renderHandoverView();
    if (showToastFlag) showToast(`筛选完成，共 ${state.filteredPatients.length} 条结果`);
}

function resetFilters() {
    document.getElementById('filterDoctor').value = '';
    document.getElementById('filterProject').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('filterUrgency').value = '';
    state.patientFilters = { doctor: '', project: '', dateFrom: '', dateTo: '', urgency: '' };
    saveToStorage(STORAGE_KEYS.PATIENT_FILTERS, state.patientFilters);
    state.filteredPatients = [...PATIENTS];
    state.selectedPatientIds.clear();
    document.getElementById('selectAllPatients').checked = false;
    renderPendingTable();
    renderHandoverView();
}

function showPatientDetail(patientId) {
    const p = PATIENTS.find(x => x.id === patientId);
    if (!p) return;

    const recall = getRecallInfo(p);
    const avatarColor = getAvatarColor(p.name);
    const modal = document.getElementById('patientDetailModal');
    const body = document.getElementById('patientDetailBody');

    const today = new Date().toISOString().split('T')[0];
    const disabled = state.selectedChair
        ? getOccupiedSlots(state.selectedChair, today)
        : new Set();
    const available = TIME_SLOTS.filter(s => !disabled.has(s)).slice(0, 8);

    body.innerHTML = `
        <div class="detail-header">
            <div class="detail-avatar" style="background:${avatarColor}">${p.name.charAt(0)}</div>
            <div class="detail-info">
                <h3>${p.name} <span class="project-tag tag-${p.project}" style="margin-left:8px;">${p.project}</span></h3>
                <div class="detail-meta">
                    ${p.gender} · ${p.age}岁 · ${p.phone}<br>
                    主治医生：${p.doctor} · 上次就诊：${formatDateCN(p.lastVisit)}
                </div>
            </div>
        </div>

        ${p.warnings.length > 0 ? `
        <div class="detail-section">
            <div class="warning-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div class="warning-box-content">
                    <div class="warning-box-title">禁忌提醒</div>
                    <div class="warning-box-text">${p.warnings.join('、')}</div>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="detail-section">
            <h4>复诊时间建议</h4>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">建议复诊窗口</div>
                    <div class="info-value">${formatDateCN(recall.minDate)} - ${formatDateCN(recall.maxDate)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">复诊规则</div>
                    <div class="info-value">${recall.rule.label}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">紧急度</div>
                    <div class="info-value"><span class="urgency-badge ${recall.urgencyClass}">${recall.urgencyText}</span></div>
                </div>
                <div class="info-item">
                    <div class="info-label">距上次就诊</div>
                    <div class="info-value">${Math.abs(daysBetween(p.lastVisit))} 天前</div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4>治疗备注</h4>
            <div class="info-item" style="background:var(--bg-50);">
                <div class="info-value" style="line-height:1.7;">${p.treatmentNote}</div>
            </div>
        </div>

        <div class="detail-section">
            <h4>近期可预约时段（${p.doctor}）</h4>
            <div class="available-slots">
                ${available.map(t => `<span class="slot-chip">${t}</span>`).join('')}
            </div>
            <p style="font-size:12px; color:var(--text-400); margin-top:8px;">* 以上为参考时段，实际以预约页面选择为准</p>
        </div>

        <div class="detail-section">
            <h4>治疗历史</h4>
            <div class="timeline">
                ${p.history.map(h => `
                    <div class="timeline-item">
                        <div class="timeline-date">${formatDateCN(h.date)}</div>
                        <div class="timeline-content">${h.content}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    modal.classList.add('show');
}

function quickBook(patientId) {
    const p = PATIENTS.find(x => x.id === patientId);
    if (!p) return;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(pp => pp.classList.remove('active'));
    document.querySelector('.tab-btn[data-tab="appointment"]').classList.add('active');
    document.getElementById('panel-appointment').classList.add('active');

    state.selectedPatient = p;
    updateSelectedPatientDisplay();
    showToast(`已选择患者：${p.name}，请继续完成预约`);
}

function initPatientSearch() {
    const searchInput = document.getElementById('patientSearch');
    const suggestions = document.getElementById('patientSuggestions');

    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) {
            suggestions.classList.remove('show');
            return;
        }
        const matches = PATIENTS.filter(p =>
            p.name.toLowerCase().includes(q) || p.phone.replace(/\*/g, '').includes(q.replace(/\*/g, ''))
        );
        if (matches.length === 0) {
            suggestions.innerHTML = '<div class="suggestion-item" style="color:var(--text-400);">未找到匹配的患者</div>';
        } else {
            suggestions.innerHTML = matches.map(p => `
                <div class="suggestion-item" onclick="selectPatient('${p.id}')">
                    <div class="patient-avatar-sm" style="background:${getAvatarColor(p.name)}; width:30px; height:30px; font-size:12px;">${p.name.charAt(0)}</div>
                    <div>
                        <span class="patient-name-sm">${p.name}</span>
                        <span class="patient-phone">${p.phone} · ${p.gender}${p.age}岁 · ${p.project}</span>
                    </div>
                </div>
            `).join('');
        }
        suggestions.classList.add('show');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.patient-select')) {
            suggestions.classList.remove('show');
        }
    });

    document.getElementById('btnClearPatient').addEventListener('click', () => {
        state.selectedPatient = null;
        document.getElementById('selectedPatient').style.display = 'none';
        document.getElementById('patientSearch').value = '';
        document.getElementById('patientSearch').style.display = 'block';
        updatePreview();
    });
}

function selectPatient(patientId) {
    const p = PATIENTS.find(x => x.id === patientId);
    if (!p) return;
    state.selectedPatient = p;
    updateSelectedPatientDisplay();
    document.getElementById('patientSuggestions').classList.remove('show');
}

function updateSelectedPatientDisplay() {
    const p = state.selectedPatient;
    if (!p) return;

    document.getElementById('patientSearch').style.display = 'none';
    document.getElementById('selectedPatient').style.display = 'flex';
    document.getElementById('selPatientAvatar').textContent = p.name.charAt(0);
    document.getElementById('selPatientAvatar').style.background = getAvatarColor(p.name);
    document.getElementById('selPatientName').textContent = p.name;
    document.getElementById('selPatientMeta').textContent = `${p.gender} · ${p.age}岁 · ${p.phone} · ${p.project} · ${p.doctor}`;
    updatePreview();
}

function renderDoctorChairGrid() {
    const grid = document.getElementById('doctorChairGrid');
    grid.innerHTML = DOCTORS.map(d => `
        <div class="doctor-card ${state.selectedDoctor?.id === d.id ? 'selected' : ''}" onclick="selectDoctor('${d.id}')">
            <div class="doctor-card-header">
                <div class="doctor-avatar" style="background:linear-gradient(135deg, ${d.color}, #0EA5E9);">${d.name.charAt(0)}</div>
                <div>
                    <div class="doctor-name">${d.name}</div>
                    <div class="doctor-dept">${d.dept}</div>
                </div>
            </div>
            <div class="chair-options">
                ${d.chairs.map(c => `
                    <span class="chair-tag ${state.selectedDoctor?.id === d.id && state.selectedChair === c ? 'selected' : ''}"
                          onclick="event.stopPropagation(); selectChair('${d.id}', '${c}')">${c}</span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function selectDoctor(doctorId) {
    const d = DOCTORS.find(x => x.id === doctorId);
    if (!d) return;
    state.selectedDoctor = d;
    state.selectedChair = d.chairs[0];
    renderDoctorChairGrid();
    renderTimeSlots();
    renderScheduleView();
    updatePreview();
}

function selectChair(doctorId, chair) {
    const d = DOCTORS.find(x => x.id === doctorId);
    if (!d) return;
    state.selectedDoctor = d;
    state.selectedChair = chair;
    renderDoctorChairGrid();
    renderTimeSlots();
    renderScheduleView();
    updatePreview();
}

function renderDateScroll() {
    const scroll = document.getElementById('dateScroll');
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dates = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d);
    }
    scroll.innerHTML = dates.map((d, idx) => {
        const dateStr = d.toISOString().split('T')[0];
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const isSelected = state.selectedDate === dateStr;
        const today = idx === 0 ? '今天' : idx === 1 ? '明天' : '周' + weekdays[d.getDay()];
        return `
            <div class="date-item ${isSelected ? 'selected' : ''}" onclick="selectDate('${dateStr}')">
                <div class="date-week" style="${isWeekend ? 'color:var(--danger);' : ''}">${today}</div>
                <div class="date-day">${d.getDate()}</div>
                <div class="date-month">${d.getMonth() + 1}月</div>
            </div>
        `;
    }).join('');
}

function selectDate(dateStr) {
    state.selectedDate = dateStr;
    renderDateScroll();
    renderTimeSlots();
    renderScheduleView();
    updatePreview();
}

function renderTimeSlots() {
    const container = document.getElementById('timeSlots');
    if (!state.selectedDate || !state.selectedChair) {
        container.innerHTML = '<p style="color:var(--text-400); font-size:12px; padding:10px;">请先选择椅位和日期</p>';
        return;
    }

    const occupied = getOccupiedSlots(state.selectedChair, state.selectedDate);

    container.innerHTML = TIME_SLOTS.map(t => {
        const isOccupied = occupied.has(t);
        const isSelected = state.selectedTime === t;
        return `
            <div class="time-slot ${isSelected ? 'selected' : ''} ${isOccupied ? 'disabled' : ''}"
                 ${isOccupied ? '' : `onclick="selectTime('${t}')"`}>
                ${t}${isOccupied ? ' (已占)' : ''}
            </div>
        `;
    }).join('');
}

function selectTime(timeStr) {
    state.selectedTime = timeStr;
    renderTimeSlots();
    renderScheduleView();
    updatePreview();
}

function initScheduleView() {
    const select = document.getElementById('scheduleDateSelect');
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dates = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const label = i === 0 ? '今天' : i === 1 ? '明天' : `${d.getMonth() + 1}/${d.getDate()} 周${weekdays[d.getDay()]}`;
        dates.push({ dateStr, label });
    }
    select.innerHTML = dates.map(d => `<option value="${d.dateStr}">${d.label}</option>`).join('');

    state.scheduleDate = dates[0].dateStr;

    select.addEventListener('change', () => {
        state.scheduleDate = select.value;
        renderScheduleView();
    });
}

function renderScheduleView() {
    const grid = document.getElementById('scheduleGrid');
    const date = state.scheduleDate || new Date().toISOString().split('T')[0];

    const allChairs = [];
    DOCTORS.forEach(d => {
        d.chairs.forEach(c => {
            allChairs.push({ doctor: d, chair: c });
        });
    });

    let html = '<table class="schedule-table"><thead><tr><th class="first-col">椅位 / 时段</th>';
    TIME_SLOTS.forEach(t => {
        html += `<th>${t}</th>`;
    });
    html += '</tr></thead><tbody>';

    allChairs.forEach(({ doctor, chair }) => {
        const occupied = getOccupiedSlots(chair, date);
        html += `<tr><td class="first-col">${doctor.name}<br><span style="font-weight:400;font-size:10px;color:var(--text-400);">${chair}</span></td>`;
        TIME_SLOTS.forEach(t => {
            const isOccupied = occupied.has(t);
            const isCurrentlySelected = state.selectedChair === chair && state.selectedDate === date && state.selectedTime === t;
            let cls = 'slot-available';
            let onclick = `onclick="selectSlotFromSchedule('${doctor.id}','${chair}','${date}','${t}')"`;
            if (isOccupied && !isCurrentlySelected) {
                cls = 'slot-occupied';
                onclick = '';
            } else if (isCurrentlySelected) {
                cls = 'slot-selected-schedule';
            }
            html += `<td class="${cls}" ${onclick}>${isCurrentlySelected ? '✓' : isOccupied ? '×' : '○'}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    grid.innerHTML = html;
}

function selectSlotFromSchedule(doctorId, chair, date, time) {
    const d = DOCTORS.find(x => x.id === doctorId);
    if (!d) return;
    state.selectedDoctor = d;
    state.selectedChair = chair;
    state.selectedDate = date;
    state.selectedTime = time;

    document.getElementById('scheduleDateSelect').value = date;
    state.scheduleDate = date;

    renderDoctorChairGrid();
    renderDateScroll();
    renderTimeSlots();
    renderScheduleView();
    updatePreview();
    showToast(`已选择 ${d.name} ${chair} ${date} ${time}`);
}

function initServiceChecks() {
    ['needXray', 'needMold', 'needConsult'].forEach(id => {
        document.getElementById(id).addEventListener('change', updatePreview);
    });
    document.getElementById('treatmentNote').addEventListener('input', updatePreview);
    document.getElementById('prefTime').addEventListener('input', updatePreview);
}

function updatePreview() {
    const empty = document.getElementById('previewEmpty');
    const content = document.getElementById('previewContent');

    const hasAny = state.selectedPatient || state.selectedDoctor || state.selectedDate || state.selectedTime;
    if (!hasAny) {
        empty.style.display = 'block';
        content.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    content.style.display = 'block';

    document.getElementById('pvPatient').textContent = state.selectedPatient
        ? `${state.selectedPatient.name}（${state.selectedPatient.gender}·${state.selectedPatient.age}岁）` : '未选择';
    document.getElementById('pvProject').textContent = state.selectedPatient?.project || '未选择';
    document.getElementById('pvDoctor').textContent = state.selectedDoctor?.name || '未选择';
    document.getElementById('pvChair').textContent = state.selectedChair || '未选择';
    document.getElementById('pvDate').textContent = state.selectedDate ? formatDateCN(state.selectedDate) : '未选择';
    document.getElementById('pvTime').textContent = state.selectedTime || '未选择';

    const services = [
        { id: 'needXray', label: '拍片' },
        { id: 'needMold', label: '取模' },
        { id: 'needConsult', label: '方案沟通' }
    ];
    const activeServices = services.filter(s => document.getElementById(s.id).checked);
    const pvServices = document.getElementById('pvServices');
    if (activeServices.length > 0) {
        pvServices.style.display = 'flex';
        pvServices.innerHTML = services.map(s => `
            <span class="service-chip ${document.getElementById(s.id).checked ? 'active' : ''}">${s.label}</span>
        `).join('');
    } else {
        pvServices.style.display = 'none';
    }

    const note = document.getElementById('treatmentNote').value.trim();
    const pref = document.getElementById('prefTime').value.trim();
    const noteRow = document.getElementById('pvNoteRow');
    if (note || pref) {
        noteRow.style.display = 'flex';
        document.getElementById('pvNote').textContent = [pref, note].filter(Boolean).join(' | ');
    } else {
        noteRow.style.display = 'none';
    }

    let duration = 30;
    if (activeServices.some(s => s.id === 'needXray')) duration += 10;
    if (activeServices.some(s => s.id === 'needMold')) duration += 15;
    if (activeServices.some(s => s.id === 'needConsult')) duration += 15;
    document.getElementById('pvDuration').textContent = `${duration} 分钟`;
}

function initFormActions() {
    document.getElementById('btnResetForm').addEventListener('click', resetAppointmentForm);
    document.getElementById('btnSubmitAppointment').addEventListener('click', submitAppointment);
}

function resetAppointmentForm() {
    state.selectedPatient = null;
    state.selectedDoctor = null;
    state.selectedChair = null;
    state.selectedDate = null;
    state.selectedTime = null;

    document.getElementById('patientSearch').value = '';
    document.getElementById('patientSearch').style.display = 'block';
    document.getElementById('selectedPatient').style.display = 'none';
    document.getElementById('patientSuggestions').classList.remove('show');

    ['needXray', 'needMold', 'needConsult'].forEach(id => {
        document.getElementById(id).checked = false;
    });
    document.getElementById('treatmentNote').value = '';
    document.getElementById('prefTime').value = '';

    renderDoctorChairGrid();
    renderDateScroll();
    renderTimeSlots();
    renderScheduleView();
    updatePreview();
    showToast('表单已重置', 'success');
}

function submitAppointment() {
    if (!state.selectedPatient) {
        showToast('请先选择患者', 'error');
        return;
    }
    if (!state.selectedDoctor || !state.selectedChair) {
        showToast('请选择医生和椅位', 'error');
        return;
    }
    if (!state.selectedDate) {
        showToast('请选择就诊日期', 'error');
        return;
    }
    if (!state.selectedTime) {
        showToast('请选择就诊时段', 'error');
        return;
    }

    const occupied = getOccupiedSlots(state.selectedChair, state.selectedDate);
    if (occupied.has(state.selectedTime)) {
        showToast('该时段已被占用，请选择其他时段', 'error');
        return;
    }

    const services = [];
    if (document.getElementById('needXray').checked) services.push('拍片');
    if (document.getElementById('needMold').checked) services.push('取模');
    if (document.getElementById('needConsult').checked) services.push('方案沟通');

    const record = {
        id: 'r' + Date.now(),
        patient: state.selectedPatient.name,
        patientGender: state.selectedPatient.gender,
        patientAge: state.selectedPatient.age,
        phone: state.selectedPatient.phone,
        project: state.selectedPatient.project,
        doctor: state.selectedDoctor.name,
        doctorId: state.selectedDoctor.id,
        chair: state.selectedChair,
        date: state.selectedDate,
        time: state.selectedTime,
        services,
        prefTime: document.getElementById('prefTime').value.trim(),
        note: document.getElementById('treatmentNote').value.trim(),
        createdAt: new Date().toISOString()
    };

    markSlotOccupied(state.selectedChair, state.selectedDate, state.selectedTime);
    appointmentRecords.unshift(record);
    persistAppointments();
    renderRecentRecords();
    renderScheduleView();
    renderCalendarWeekView();
    resetAppointmentForm();
    showToast(`预约成功！已为 ${record.patient} 生成复诊记录`);
}

function renderRecentRecords() {
    const list = document.getElementById('recentRecords');
    if (appointmentRecords.length === 0) {
        list.innerHTML = '<p class="empty-text">暂无预约记录</p>';
        return;
    }
    list.innerHTML = appointmentRecords.slice(0, 5).map(r => `
        <div class="record-item">
            <div class="record-head">
                <span class="record-patient">${r.patient}</span>
                <span class="record-status">已确认</span>
            </div>
            <div class="record-detail">
                ${r.project} · ${r.doctor} · ${r.chair}<br>
                ${formatDateCN(r.date)} ${r.time}
                ${r.services.length > 0 ? `<br>附加服务：${r.services.join('、')}` : ''}
            </div>
        </div>
    `).join('');
}

function applyWarningFilters(showToastFlag = true) {
    const risk = document.getElementById('warnFilterRisk').value;
    const doctor = document.getElementById('warnFilterDoctor').value;
    const missType = document.getElementById('warnFilterType').value;
    const status = document.getElementById('warnFilterStatus').value;

    state.warningFilters = { risk, doctor, missType, status };
    saveToStorage(STORAGE_KEYS.WARNING_FILTERS, state.warningFilters);

    state.filteredWarnings = WARNING_PATIENTS.filter(w => {
        if (risk && w.riskLevel !== risk) return false;
        if (doctor && w.doctor !== doctor) return false;
        if (missType && w.lastMissType !== missType) return false;
        if (status && w.callStatus !== status) return false;
        return true;
    });

    const sortOrder = { high: 0, medium: 1, low: 2 };
    state.filteredWarnings.sort((a, b) => {
        const riskDiff = sortOrder[a.riskLevel] - sortOrder[b.riskLevel];
        if (riskDiff !== 0) return riskDiff;
        if (a.nextFollowUpDate && b.nextFollowUpDate) return a.nextFollowUpDate.localeCompare(b.nextFollowUpDate);
        if (a.nextFollowUpDate) return -1;
        if (b.nextFollowUpDate) return 1;
        return 0;
    });

    renderWarningTable();
    if (showToastFlag) showToast(`筛选完成，共 ${state.filteredWarnings.length} 位患者`);
}

function resetWarningFilters() {
    document.getElementById('warnFilterRisk').value = '';
    document.getElementById('warnFilterDoctor').value = '';
    document.getElementById('warnFilterType').value = '';
    document.getElementById('warnFilterStatus').value = '';
    state.warningFilters = { risk: '', doctor: '', missType: '', status: '' };
    saveToStorage(STORAGE_KEYS.WARNING_FILTERS, state.warningFilters);
    state.filteredWarnings = [...WARNING_PATIENTS];
    renderWarningTable();
}

function renderWarningTable() {
    const tbody = document.getElementById('warningTableBody');
    const warnings = state.filteredWarnings;

    const noShowTotal = warnings.reduce((s, w) => s + w.noShowCount, 0);
    const lateTotal = warnings.reduce((s, w) => s + w.lateCount, 0);
    const cancelTotal = warnings.reduce((s, w) => s + w.cancelCount, 0);

    document.getElementById('warnNoShow').textContent = noShowTotal;
    document.getElementById('warnLate').textContent = lateTotal;
    document.getElementById('warnCancel').textContent = cancelTotal;
    document.getElementById('warningCount').textContent = WARNING_PATIENTS.length;

    const riskClass = { high: 'risk-high', medium: 'risk-medium', low: 'risk-low' };
    const riskText = { high: '高风险', medium: '中风险', low: '低风险' };
    const rowClass = { high: 'warning-row', medium: 'medium-row', low: '' };
    const statusClass = {
        pending: 'status-pending', confirmed: 'status-confirmed',
        reschedule: 'status-reschedule', unreachable: 'status-unreachable',
        uncertain: 'status-uncertain'
    };
    const statusText = {
        pending: '待确认', confirmed: '已确认就诊',
        reschedule: '需要改期', unreachable: '无法联系',
        uncertain: '待回复'
    };

    if (warnings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-400);">暂无符合条件的预警患者</td></tr>';
        return;
    }

    tbody.innerHTML = warnings.map(w => {
        const avatarColor = getAvatarColor(w.name);
        const latestRecord = w.callHistory && w.callHistory.length > 0 ? w.callHistory[0] : null;
        const callRecordPreview = latestRecord
            ? `<div style="font-size:10px; color:var(--text-400); margin-top:3px; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${formatDateShort(latestRecord.date)}：${latestRecord.note || '已记录'}</div>`
            : '';
        const nextFollowupHtml = w.nextFollowUpDate ? getNextFollowupTag(w.nextFollowUpDate) : '<span style="color:var(--text-300); font-size:12px;">-</span>';
        return `
            <tr class="${rowClass[w.riskLevel]}">
                <td><span class="risk-tag ${riskClass[w.riskLevel]}">${riskText[w.riskLevel]}</span></td>
                <td>
                    <div class="patient-cell">
                        <div class="patient-avatar-sm" style="background:${avatarColor}">${w.name.charAt(0)}</div>
                        <div>
                            <span class="patient-name-sm">${w.name}</span>
                            <span class="patient-phone">${w.gender} · ${w.age}岁</span>
                        </div>
                    </div>
                </td>
                <td>${w.phone}</td>
                <td>
                    <strong style="color:var(--danger); font-size:15px;">${w.totalMisses}</strong> 次
                    <div style="font-size:11px; color:var(--text-400); margin-top:2px;">
                        未到${w.noShowCount}·迟到${w.lateCount}·取消${w.cancelCount}
                    </div>
                </td>
                <td>
                    <div class="warning-info">
                        <span class="warning-date">${formatDateShort(w.lastMissDate)} · ${w.lastMissType}</span>
                        <span class="warning-type">${w.lastMissDesc}</span>
                    </div>
                </td>
                <td>
                    <span class="status-tag ${statusClass[w.callStatus] || ''}">${statusText[w.callStatus] || w.callStatus}</span>
                    ${callRecordPreview}
                </td>
                <td>${nextFollowupHtml}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-link" onclick="openCallConfirm('${w.id}')">电话确认</button>
                        <button class="btn-link danger" onclick="viewWarningHistory('${w.id}')">查看记录</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function initWarningFilters() {
    document.getElementById('btnWarnSearch').addEventListener('click', applyWarningFilters);
    document.getElementById('btnWarnReset').addEventListener('click', resetWarningFilters);
}

function openCallConfirm(patientId) {
    const w = WARNING_PATIENTS.find(x => x.id === patientId);
    if (!w) return;
    state.currentWarningPatient = w;

    const avatarColor = getAvatarColor(w.name);
    document.getElementById('callPatientInfo').innerHTML = `
        <div class="patient-avatar-sm" style="background:${avatarColor}; width:42px; height:42px; font-size:15px;">${w.name.charAt(0)}</div>
        <div>
            <span class="patient-name-sm" style="font-size:14px;">${w.name}</span>
            <span class="patient-phone">${w.phone} · ${w.project} · ${w.doctor}</span>
            <div style="font-size:11px; color:var(--danger); margin-top:2px;">累计爽约 ${w.totalMisses} 次（最近：${w.lastMissType}）</div>
        </div>
    `;

    document.querySelectorAll('input[name="callResult"]').forEach(r => r.checked = false);
    document.getElementById('rescheduleInput').style.display = 'none';
    document.getElementById('callNote').value = '';
    document.getElementById('rescheduleDate').value = '';

    document.getElementById('callConfirmModal').classList.add('show');
}

function initCallForm() {
    document.querySelectorAll('input[name="callResult"]').forEach(r => {
        r.addEventListener('change', (e) => {
            document.getElementById('rescheduleInput').style.display =
                e.target.value === 'reschedule' ? 'block' : 'none';
        });
    });

    document.getElementById('btnSaveCallRecord').addEventListener('click', saveCallRecord);
}

function saveCallRecord() {
    const result = document.querySelector('input[name="callResult"]:checked');
    if (!result) {
        showToast('请选择确认结果', 'error');
        return;
    }
    if (result.value === 'reschedule' && !document.getElementById('rescheduleDate').value) {
        showToast('请填写改期意向日期', 'error');
        return;
    }

    const w = state.currentWarningPatient;
    if (!w) return;

    w.callStatus = result.value;

    const historyRecord = {
        id: 'ch' + Date.now(),
        result: result.value,
        note: document.getElementById('callNote').value.trim() || '无备注',
        date: new Date().toISOString().split('T')[0]
    };
    if (result.value === 'reschedule') {
        historyRecord.rescheduleDate = document.getElementById('rescheduleDate').value || '';
    }

    if (!w.callHistory) w.callHistory = [];
    w.callHistory.unshift(historyRecord);

    const nextFollowUp = document.getElementById('nextFollowUpDate').value;
    if (nextFollowUp) {
        w.nextFollowUpDate = nextFollowUp;
    } else if (result.value === 'uncertain') {
        w.nextFollowUpDate = daysLater(1);
    } else if (result.value === 'unreachable') {
        w.nextFollowUpDate = daysLater(2);
    } else if (result.value === 'reschedule') {
        w.nextFollowUpDate = document.getElementById('rescheduleDate').value;
    } else {
        delete w.nextFollowUpDate;
    }

    persistWarningPatients();

    document.getElementById('callConfirmModal').classList.remove('show');
    applyWarningFilters(false);

    const resultText = { confirmed: '已确认就诊', reschedule: '已记录改期意向', uncertain: '已记录待回复', unreachable: '已记录无法联系' };
    let toastMsg = `电话确认记录已保存（${resultText[result.value]}）`;
    if (w.nextFollowUpDate) {
        toastMsg += `，下次跟进：${formatDateShort(w.nextFollowUpDate)}`;
    }
    showToast(toastMsg);
}

function getNextFollowupTag(dateStr) {
    if (!dateStr) return '';
    const days = daysBetween(dateStr);
    let cls = 'next-followup-upcoming';
    let text = `${days >= 0 ? days + '天后' : Math.abs(days) + '天前'}`;
    if (days === 0) {
        cls = 'next-followup-today';
        text = '今天';
    } else if (days < 0) {
        cls = 'next-followup-overdue';
    }
    return `<span class="next-followup-tag ${cls}">⏰ ${text}</span>`;
}

function viewWarningHistory(patientId) {
    const w = WARNING_PATIENTS.find(x => x.id === patientId);
    if (!w) return;

    const modal = document.getElementById('patientDetailModal');
    const body = document.getElementById('patientDetailBody');
    const avatarColor = getAvatarColor(w.name);
    const statusTextMap = {
        confirmed: '已确认就诊', reschedule: '需要改期', uncertain: '待回复',
        unreachable: '无法联系', pending: '待确认'
    };

    const resultTextMap = {
        confirmed: '确认就诊，按时到达',
        reschedule: '需要改期',
        uncertain: '待定，稍后回复',
        unreachable: '无法联系（无人接听/关机）'
    };

    let callHistorySection = '';
    if (w.callHistory && w.callHistory.length > 0) {
        const historyItems = w.callHistory.map(c => {
            const result = c.result || '';
            const note = c.note || '无备注';
            const date = c.date || '-';
            const rescheduleDate = c.rescheduleDate || '';
            return `
                <div class="call-history-item ${result}">
                    <div class="call-history-date">${formatDateShort(date)}</div>
                    <div class="call-history-content">
                        <div class="call-history-result">${resultTextMap[result] || result}</div>
                        <div class="call-history-note">${note}</div>
                        ${rescheduleDate ? `<div class="call-history-extra">改期意向日期：${formatDateCN(rescheduleDate)}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        callHistorySection = `
            <div class="detail-section">
                <h4>电话沟通历史（${w.callHistory.length} 次）</h4>
                <div class="call-history-timeline">
                    ${historyItems}
                </div>
            </div>
        `;
    } else {
        callHistorySection = `
            <div class="detail-section">
                <h4>电话沟通历史</h4>
                <div class="info-item" style="background:var(--bg-50);">
                    <div class="info-value" style="color:var(--text-400); font-weight:400;">尚无电话确认记录，请先进行电话确认</div>
                </div>
            </div>
        `;
    }

    let nextFollowUpSection = '';
    if (w.nextFollowUpDate) {
        nextFollowUpSection = `
            <div class="detail-section">
                <h4>下次跟进提醒</h4>
                <div class="info-item" style="background:var(--warning-light);">
                    <div class="info-value" style="font-weight:600; color:var(--warning-dark);">
                        预计跟进日期：${formatDateCN(w.nextFollowUpDate)} ${getNextFollowupTag(w.nextFollowUpDate)}
                    </div>
                </div>
            </div>
        `;
    }

    body.innerHTML = `
        <div class="detail-header">
            <div class="detail-avatar" style="background:${avatarColor}">${w.name.charAt(0)}</div>
            <div class="detail-info">
                <h3>${w.name} <span class="risk-tag risk-${w.riskLevel}" style="margin-left:8px;">${w.riskLevel === 'high' ? '高风险' : w.riskLevel === 'medium' ? '中风险' : '低风险'}</span></h3>
                <div class="detail-meta">
                    ${w.gender} · ${w.age}岁 · ${w.phone}<br>
                    ${w.project} · ${w.doctor} · 当前状态：<span class="status-tag status-${w.callStatus}" style="font-size:12px;">${statusTextMap[w.callStatus] || w.callStatus}</span>
                    ${w.nextFollowUpDate ? `<br>下次跟进：${getNextFollowupTag(w.nextFollowUpDate)}` : ''}
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4>爽约统计</h4>
            <div class="info-grid">
                <div class="info-item"><div class="info-label">未到诊</div><div class="info-value" style="color:var(--danger); font-size:18px;">${w.noShowCount} 次</div></div>
                <div class="info-item"><div class="info-label">迟到</div><div class="info-value" style="color:var(--warning); font-size:18px;">${w.lateCount} 次</div></div>
                <div class="info-item"><div class="info-label">临时取消</div><div class="info-value" style="color:#B45309; font-size:18px;">${w.cancelCount} 次</div></div>
                <div class="info-item"><div class="info-label">累计</div><div class="info-value" style="color:var(--text-900); font-size:18px;">${w.totalMisses} 次</div></div>
            </div>
        </div>

        ${nextFollowUpSection}

        ${callHistorySection}

        <div class="detail-section">
            <h4>爽约历史记录</h4>
            <div class="timeline">
                <div class="timeline-item">
                    <div class="timeline-date">${formatDateCN(w.lastMissDate)} · ${w.lastMissType}</div>
                    <div class="timeline-content">${w.lastMissDesc}</div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-date">${formatDateCN(daysAgo(w.totalMisses * 12 + 20))} · 历史记录</div>
                    <div class="timeline-content">此前累计 ${w.totalMisses - 1} 次爽约记录</div>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('show');
}

function switchPendingView(view) {
    state.pendingView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.getElementById('pendingListView').style.display = view === 'list' ? 'block' : 'none';
    document.getElementById('pendingHandoverView').style.display = view === 'handover' ? 'block' : 'none';
    if (view === 'handover') {
        renderHandoverView();
    }
}

function renderHandoverView() {
    const patients = state.filteredPatients;
    const groups = {
        unhandled: [],
        contacted: [],
        postponed: []
    };

    patients.forEach(p => {
        if (p.batchStatus === 'contacted') groups.contacted.push(p);
        else if (p.batchStatus === 'postponed') groups.postponed.push(p);
        else groups.unhandled.push(p);
    });

    document.getElementById('handoverUnhandledCount').textContent = groups.unhandled.length;
    document.getElementById('handoverContactedCount').textContent = groups.contacted.length;
    document.getElementById('handoverPostponedCount').textContent = groups.postponed.length;

    const renderGroup = (list) => {
        if (list.length === 0) {
            return '<div style="text-align:center; padding:20px; color:var(--text-400); font-size:12px;">暂无患者</div>';
        }
        return list.map(p => {
            const recall = getRecallInfo(p);
            const avatarColor = getAvatarColor(p.name);
            const noteHtml = p.followUpNote ? `<div class="handover-card-note"><span class="note-label">跟进：</span>${p.followUpNote}</div>` : '';
            const reminderHtml = p.nextReminderDate ? `<div class="handover-card-reminder">⏰ 下次提醒：${formatDateShort(p.nextReminderDate)}</div>` : '';
            return `
                <div class="handover-card" onclick="openHandoverNote('${p.id}')">
                    <div class="handover-card-header">
                        <div class="patient-avatar-sm" style="background:${avatarColor}; width:28px; height:28px; font-size:11px;">${p.name.charAt(0)}</div>
                        <div>
                            <div class="handover-card-name">${p.name} <span class="project-tag tag-${p.project}" style="font-size:10px; padding:1px 6px; margin-left:4px;">${p.project}</span></div>
                            <div class="handover-card-meta">${p.gender}·${p.age}岁 · ${p.doctor}</div>
                        </div>
                    </div>
                    <div class="handover-card-info">
                        复诊窗口：${formatDateShort(recall.minDate)} - ${formatDateShort(recall.maxDate)}<br>
                        <span class="urgency-badge ${recall.urgencyClass}">${recall.urgencyText}</span>
                    </div>
                    ${noteHtml}
                    ${reminderHtml}
                    <div class="handover-card-actions">
                        <button class="btn-link" onclick="event.stopPropagation(); quickBook('${p.id}')">预约</button>
                        <button class="btn-link" onclick="event.stopPropagation(); showPatientDetail('${p.id}')">详情</button>
                    </div>
                </div>
            `;
        }).join('');
    };

    document.getElementById('handoverUnhandledList').innerHTML = renderGroup(groups.unhandled);
    document.getElementById('handoverContactedList').innerHTML = renderGroup(groups.contacted);
    document.getElementById('handoverPostponedList').innerHTML = renderGroup(groups.postponed);
}

function openHandoverNote(patientId) {
    const p = PATIENTS.find(x => x.id === patientId);
    if (!p) return;
    state.currentHandoverPatient = p;

    const avatarColor = getAvatarColor(p.name);
    document.getElementById('handoverPatientInfo').innerHTML = `
        <div class="patient-avatar-sm" style="background:${avatarColor}; width:42px; height:42px; font-size:15px;">${p.name.charAt(0)}</div>
        <div>
            <span class="patient-name-sm" style="font-size:14px;">${p.name}</span>
            <span class="patient-phone">${p.gender}·${p.age}岁 · ${p.project} · ${p.doctor}</span>
        </div>
    `;
    document.getElementById('handoverFollowNote').value = p.followUpNote || '';
    document.getElementById('handoverNextReminder').value = p.nextReminderDate || '';
    document.getElementById('handoverNoteModal').classList.add('show');
}

function initHandoverNote() {
    document.getElementById('btnSaveHandoverNote').addEventListener('click', () => {
        const p = state.currentHandoverPatient;
        if (!p) return;

        p.followUpNote = document.getElementById('handoverFollowNote').value.trim();
        p.nextReminderDate = document.getElementById('handoverNextReminder').value || '';
        persistPatients();

        document.getElementById('handoverNoteModal').classList.remove('show');
        renderHandoverView();
        renderPendingTable();
        showToast('跟进备注已保存');
    });
}

function switchScheduleView(view) {
    state.scheduleView = view;
    document.querySelectorAll('.schedule-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sview === view);
    });
    document.getElementById('scheduleGrid').style.display = view === 'day' ? 'block' : 'none';
    document.getElementById('calendarWeekView').style.display = view === 'week' ? 'block' : 'none';
    document.getElementById('scheduleDatePicker').style.display = view === 'day' ? 'flex' : 'none';
    document.getElementById('scheduleWeekFilter').style.display = view === 'week' ? 'flex' : 'none';
    if (view === 'week') {
        renderCalendarWeekView();
    } else {
        renderScheduleView();
    }
}

function initWeekViewFilters() {
    document.getElementById('weekFilterDoctor').addEventListener('change', (e) => {
        state.weekFilterDoctor = e.target.value;
        renderCalendarWeekView();
    });
    document.getElementById('weekFilterChair').addEventListener('change', (e) => {
        state.weekFilterChair = e.target.value;
        renderCalendarWeekView();
    });
}

function renderCalendarWeekView() {
    const container = document.getElementById('calendarWeekView');
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        weekDates.push(d.toISOString().split('T')[0]);
    }

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const today = new Date().toISOString().split('T')[0];

    let allChairs = [];
    DOCTORS.forEach(d => {
        d.chairs.forEach(c => {
            if (state.weekFilterDoctor && d.name !== state.weekFilterDoctor) return;
            if (state.weekFilterChair && c !== state.weekFilterChair) return;
            allChairs.push({ doctor: d, chair: c });
        });
    });

    if (allChairs.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-400);">请选择医生或椅位</div>';
        return;
    }

    let html = '<table class="calendar-week-table"><thead><tr><th class="time-col">时段</th>';
    weekDates.forEach((date, idx) => {
        const d = new Date(date);
        const isToday = date === today;
        const label = idx === 0 ? '今天' : `${d.getMonth() + 1}/${d.getDate()} 周${weekdays[d.getDay()]}`;
        html += `<th class="${isToday ? 'today-col' : ''}">${label}</th>`;
    });
    html += '</tr></thead><tbody>';

    TIME_SLOTS.forEach(time => {
        html += `<tr><td class="time-cell">${time}</td>`;
        weekDates.forEach(date => {
            let cellContent = '';
            allChairs.forEach(({ doctor, chair }) => {
                const occupied = getOccupiedSlots(chair, date);
                if (occupied.has(time)) {
                    const appt = appointmentRecords.find(r =>
                        r.chair === chair && r.date === date && r.time === time
                    );
                    if (appt) {
                        const isSelected = state.selectedChair === chair && state.selectedDate === date && state.selectedTime === time;
                        const cellCls = isSelected ? 'calendar-cell-selected' : 'calendar-cell-occupied has-appointment';
                        cellContent += `<div class="calendar-cell ${cellCls}" onclick="showSlotDetail('${chair}', '${date}', '${time}', event)" title="${appt.patient} - ${appt.project}">${appt.patient.charAt(0)}</div>`;
                    } else if (!cellContent) {
                        cellContent = `<div class="calendar-cell calendar-cell-occupied">已占</div>`;
                    }
                }
            });
            if (!cellContent) {
                if (allChairs.length === 1) {
                    const { doctor, chair } = allChairs[0];
                    const isSelected = state.selectedChair === chair && state.selectedDate === date && state.selectedTime === time;
                    const cellCls = isSelected ? 'calendar-cell-selected' : 'calendar-cell-available';
                    cellContent = `<div class="calendar-cell ${cellCls}" onclick="selectSlotFromSchedule('${doctor.id}','${chair}','${date}','${time}')">可约</div>`;
                } else {
                    cellContent = `<div class="calendar-cell calendar-cell-available">-</div>`;
                }
            }
            html += `<td>${cellContent}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function showSlotDetail(chair, date, time, event) {
    event.stopPropagation();
    const appt = appointmentRecords.find(r =>
        r.chair === chair && r.date === date && r.time === time
    );
    if (!appt) return;

    const body = document.getElementById('slotDetailBody');
    body.innerHTML = `
        <div class="slot-detail-card">
            <div class="slot-detail-row">
                <span class="slot-detail-label">患者</span>
                <span class="slot-detail-value">${appt.patient}（${appt.patientGender}·${appt.patientAge}岁）</span>
            </div>
            <div class="slot-detail-row">
                <span class="slot-detail-label">联系电话</span>
                <span class="slot-detail-value">${appt.phone}</span>
            </div>
            <div class="slot-detail-row">
                <span class="slot-detail-label">治疗项目</span>
                <span class="slot-detail-value">${appt.project}</span>
            </div>
            <div class="slot-detail-row">
                <span class="slot-detail-label">主治医生</span>
                <span class="slot-detail-value">${appt.doctor}</span>
            </div>
            <div class="slot-detail-row">
                <span class="slot-detail-label">椅位</span>
                <span class="slot-detail-value">${appt.chair}</span>
            </div>
            <div class="slot-detail-row">
                <span class="slot-detail-label">就诊时间</span>
                <span class="slot-detail-value">${formatDateCN(appt.date)} ${appt.time}</span>
            </div>
            ${appt.services.length > 0 ? `
            <div class="slot-detail-row">
                <span class="slot-detail-label">附加服务</span>
                <span class="slot-detail-value">${appt.services.join('、')}</span>
            </div>
            ` : ''}
            ${appt.note ? `
            <div class="slot-detail-row">
                <span class="slot-detail-label">备注</span>
                <span class="slot-detail-value">${appt.note}</span>
            </div>
            ` : ''}
        </div>
    `;
    document.getElementById('slotDetailModal').classList.add('show');
}

function initModals() {
    document.querySelectorAll('[data-close="modal"]').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
        }
    });
}

function init() {
    loadPersistedData();

    const savedWarningFilters = loadFromStorage(STORAGE_KEYS.WARNING_FILTERS, null);
    if (savedWarningFilters) {
        state.warningFilters = savedWarningFilters;
        document.getElementById('warnFilterRisk').value = savedWarningFilters.risk || '';
        document.getElementById('warnFilterDoctor').value = savedWarningFilters.doctor || '';
        document.getElementById('warnFilterType').value = savedWarningFilters.missType || '';
        document.getElementById('warnFilterStatus').value = savedWarningFilters.status || '';
    }

    const savedPatientFilters = loadFromStorage(STORAGE_KEYS.PATIENT_FILTERS, null);
    if (savedPatientFilters) {
        state.patientFilters = savedPatientFilters;
        document.getElementById('filterDoctor').value = savedPatientFilters.doctor || '';
        document.getElementById('filterProject').value = savedPatientFilters.project || '';
        document.getElementById('filterDateFrom').value = savedPatientFilters.dateFrom || '';
        document.getElementById('filterDateTo').value = savedPatientFilters.dateTo || '';
        document.getElementById('filterUrgency').value = savedPatientFilters.urgency || '';
    }

    initDateDisplay();
    initTabs();
    initFilters();
    initBatchActions();
    initPatientSearch();
    initScheduleView();
    renderDoctorChairGrid();
    renderDateScroll();
    renderTimeSlots();
    renderScheduleView();
    initServiceChecks();
    initFormActions();
    initCallForm();
    initWarningFilters();
    initModals();
    initHandoverNote();
    initWeekViewFilters();

    if (savedWarningFilters) applyWarningFilters(false);
    if (savedPatientFilters) applyFilters(false);

    renderPendingTable();
    renderWarningTable();
    renderRecentRecords();
    updatePreview();
    renderHandoverView();
}

document.addEventListener('DOMContentLoaded', init);
