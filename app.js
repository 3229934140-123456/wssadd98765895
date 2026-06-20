const state = {
    selectedPatient: null,
    selectedDoctor: null,
    selectedChair: null,
    selectedDate: null,
    selectedTime: null,
    currentWarningPatient: null,
    filteredPatients: [...PATIENTS]
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
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px; color:var(--text-400);">暂无符合条件的患者</td></tr>';
        updateStats();
        return;
    }

    tbody.innerHTML = patients.map(p => {
        const recall = getRecallInfo(p);
        const avatarColor = getAvatarColor(p.name);
        return `
            <tr>
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

function initFilters() {
    document.getElementById('btnSearch').addEventListener('click', applyFilters);
    document.getElementById('btnResetFilter').addEventListener('click', resetFilters);
}

function applyFilters() {
    const doctor = document.getElementById('filterDoctor').value;
    const project = document.getElementById('filterProject').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    const urgency = document.getElementById('filterUrgency').value;

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

    renderPendingTable();
    showToast(`筛选完成，共 ${state.filteredPatients.length} 条结果`);
}

function resetFilters() {
    document.getElementById('filterDoctor').value = '';
    document.getElementById('filterProject').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('filterUrgency').value = '';
    state.filteredPatients = [...PATIENTS];
    renderPendingTable();
}

function showPatientDetail(patientId) {
    const p = PATIENTS.find(x => x.id === patientId);
    if (!p) return;

    const recall = getRecallInfo(p);
    const avatarColor = getAvatarColor(p.name);
    const modal = document.getElementById('patientDetailModal');
    const body = document.getElementById('patientDetailBody');

    const futureSlots = [];
    const disabled = generateDisabledSlots();
    const available = TIME_SLOTS.filter(s => !disabled.has(s)).slice(0, 8);
    available.forEach(t => futureSlots.push(`<span class="slot-chip">${t}</span>`));

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
                ${futureSlots.join('')}
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
    updatePreview();
}

function selectChair(doctorId, chair) {
    const d = DOCTORS.find(x => x.id === doctorId);
    if (!d) return;
    state.selectedDoctor = d;
    state.selectedChair = chair;
    renderDoctorChairGrid();
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
    updatePreview();
}

function renderTimeSlots() {
    const container = document.getElementById('timeSlots');
    const disabled = state.selectedDate ? generateDisabledSlots() : new Set();

    container.innerHTML = TIME_SLOTS.map(t => {
        const isDisabled = disabled.has(t);
        const isSelected = state.selectedTime === t;
        return `
            <div class="time-slot ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                 ${isDisabled ? '' : `onclick="selectTime('${t}')"`}>
                ${t}
            </div>
        `;
    }).join('');
}

function selectTime(timeStr) {
    state.selectedTime = timeStr;
    renderTimeSlots();
    updatePreview();
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
        chair: state.selectedChair,
        date: state.selectedDate,
        time: state.selectedTime,
        services,
        prefTime: document.getElementById('prefTime').value.trim(),
        note: document.getElementById('treatmentNote').value.trim(),
        createdAt: new Date().toISOString()
    };

    appointmentRecords.unshift(record);
    renderRecentRecords();
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

function renderWarningTable() {
    const tbody = document.getElementById('warningTableBody');
    const noShow = WARNING_PATIENTS.filter(w => w.lastMissType === '未到诊').length;
    const late = WARNING_PATIENTS.filter(w => w.lastMissType === '迟到').length;
    const cancel = WARNING_PATIENTS.filter(w => w.lastMissType === '临时取消').length;

    document.getElementById('warnNoShow').textContent = WARNING_PATIENTS.reduce((s, w) => s + w.noShowCount, 0);
    document.getElementById('warnLate').textContent = WARNING_PATIENTS.reduce((s, w) => s + w.lateCount, 0);
    document.getElementById('warnCancel').textContent = WARNING_PATIENTS.reduce((s, w) => s + w.cancelCount, 0);
    document.getElementById('warningCount').textContent = WARNING_PATIENTS.length;

    const riskClass = { high: 'risk-high', medium: 'risk-medium', low: 'risk-low' };
    const riskText = { high: '高风险', medium: '中风险', low: '低风险' };
    const rowClass = { high: 'warning-row', medium: 'medium-row', low: '' };
    const statusClass = {
        pending: 'status-pending', confirmed: 'status-confirmed',
        reschedule: 'status-reschedule', unreachable: 'status-unreachable'
    };
    const statusText = {
        pending: '待确认', confirmed: '已确认就诊',
        reschedule: '已改期', unreachable: '无法联系'
    };

    tbody.innerHTML = WARNING_PATIENTS.map(w => {
        const avatarColor = getAvatarColor(w.name);
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
                <td><span class="status-tag ${statusClass[w.callStatus]}">${statusText[w.callStatus]}</span></td>
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
    w.callRecord = {
        result: result.value,
        note: document.getElementById('callNote').value.trim(),
        date: new Date().toISOString().split('T')[0]
    };
    if (result.value === 'reschedule') {
        w.callRecord.rescheduleDate = document.getElementById('rescheduleDate').value;
    }

    document.getElementById('callConfirmModal').classList.remove('show');
    renderWarningTable();

    const resultText = { confirmed: '已确认就诊', reschedule: '已记录改期意向', uncertain: '已记录待回复', unreachable: '已记录无法联系' };
    showToast(`电话确认记录已保存（${resultText[result.value]}）`);
}

function viewWarningHistory(patientId) {
    const w = WARNING_PATIENTS.find(x => x.id === patientId);
    if (!w) return;

    const modal = document.getElementById('patientDetailModal');
    const body = document.getElementById('patientDetailBody');
    const avatarColor = getAvatarColor(w.name);
    const statusText = { confirmed: '已确认就诊', reschedule: '已改期', uncertain: '待回复', unreachable: '无法联系', pending: '待确认' };

    body.innerHTML = `
        <div class="detail-header">
            <div class="detail-avatar" style="background:${avatarColor}">${w.name.charAt(0)}</div>
            <div class="detail-info">
                <h3>${w.name} <span class="risk-tag risk-${w.riskLevel}" style="margin-left:8px;">${w.riskLevel === 'high' ? '高风险' : w.riskLevel === 'medium' ? '中风险' : '低风险'}</span></h3>
                <div class="detail-meta">
                    ${w.gender} · ${w.age}岁 · ${w.phone}<br>
                    ${w.project} · ${w.doctor} · 当前状态：${statusText[w.callStatus]}
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

        ${w.callRecord ? `
        <div class="detail-section">
            <h4>最近电话确认记录</h4>
            <div class="info-item" style="background:var(--bg-50);">
                <div class="info-label">${formatDateCN(w.callRecord.date)} · ${statusText[w.callRecord.result]}</div>
                <div class="info-value" style="line-height:1.7; font-weight:400;">${w.callRecord.note || '无备注'}</div>
                ${w.callRecord.rescheduleDate ? `<div style="font-size:12px; color:var(--primary); margin-top:6px;">改期意向：${formatDateCN(w.callRecord.rescheduleDate)}</div>` : ''}
            </div>
        </div>
        ` : ''}

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
    initDateDisplay();
    initTabs();
    initFilters();
    initPatientSearch();
    renderDoctorChairGrid();
    renderDateScroll();
    renderTimeSlots();
    initServiceChecks();
    initFormActions();
    initCallForm();
    initModals();

    renderPendingTable();
    renderWarningTable();
    renderRecentRecords();
    updatePreview();
}

document.addEventListener('DOMContentLoaded', init);
