const DOCTORS = [
    { id: 'd1', name: '李医生', dept: '种植科', chairs: ['1号椅位', '2号椅位'], color: '#0EA5E9' },
    { id: 'd2', name: '张医生', dept: '正畸科', chairs: ['3号椅位', '4号椅位'], color: '#8B5CF6' },
    { id: 'd3', name: '王医生', dept: '牙体牙髓', chairs: ['5号椅位', '6号椅位'], color: '#10B981' },
    { id: 'd4', name: '赵医生', dept: '修复科', chairs: ['7号椅位', '8号椅位'], color: '#F59E0B' }
];

const AVATAR_COLORS = [
    '#0EA5E9', '#8B5CF6', '#10B981', '#F59E0B',
    '#EF4444', '#06B6D4', '#EC4899', '#6366F1'
];

const RECALL_RULES = {
    '种植': { minDays: 90, maxDays: 180, label: '种植复诊 3-6个月后' },
    '正畸': { minDays: 21, maxDays: 35, label: '正畸加力 4周后' },
    '根管': { minDays: 5, maxDays: 7, label: '根管二次封药 7天内' },
    '修复': { minDays: 14, maxDays: 21, label: '修复试戴 2-3周后' }
};

function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
}

function daysLater(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

const PATIENTS = [
    {
        id: 'p1', name: '张伟', gender: '男', age: 45, phone: '138****8821',
        project: '种植', doctor: '李医生', lastVisit: daysAgo(120),
        treatmentNote: '右上后牙区种植体植入，愈合良好，需复诊拍摄CBCT评估骨结合情况。患者有高血压病史，血压控制尚可。',
        warnings: ['碘造影剂过敏'],
        history: [
            { date: daysAgo(120), content: '右上第6牙位植入Straumann种植体，扭矩35Ncm，愈合基台连接' },
            { date: daysAgo(200), content: '初诊检查，右上6缺失，牙槽骨宽度8mm，高度10mm，建议种植修复' }
        ]
    },
    {
        id: 'p2', name: '李娜', gender: '女', age: 28, phone: '139****2234',
        project: '正畸', doctor: '张医生', lastVisit: daysAgo(32),
        treatmentNote: '恒牙列安氏II类1分类，目前处于排齐整平阶段第8个月。上次就诊调整主弓丝，患者反馈轻微酸痛2天后缓解。',
        warnings: [],
        history: [
            { date: daysAgo(32), content: '更换0.019×0.025不锈钢方丝，上下颌，远中结扎' },
            { date: daysAgo(60), content: '更换镍钛圆丝，0.016英寸，排齐阶段' }
        ]
    },
    {
        id: 'p3', name: '王建国', gender: '男', age: 56, phone: '136****5567',
        project: '根管', doctor: '王医生', lastVisit: daysAgo(10),
        treatmentNote: '左下第一磨牙急性牙髓炎，已开髓封药，需复诊进行根管预备和消毒。患者自述近期疼痛缓解。',
        warnings: ['青霉素过敏史'],
        history: [
            { date: daysAgo(10), content: '左下6开髓引流，CP棉球暂封，嘱口服甲硝唑' },
            { date: daysAgo(11), content: '急诊：左下后牙自发痛夜间痛3天，诊断急性牙髓炎' }
        ]
    },
    {
        id: 'p4', name: '陈美玲', gender: '女', age: 34, phone: '137****3345',
        project: '修复', doctor: '赵医生', lastVisit: daysAgo(18),
        treatmentNote: '左上3-5烤瓷连桥修复，已备牙取模，需复诊试戴内冠。患者对美观要求高。',
        warnings: [],
        history: [
            { date: daysAgo(18), content: '左上3-5牙体制备，硅橡胶取模，临时冠粘接' },
            { date: daysAgo(30), content: '检查：左上3残根、4、5大面积充填物，建议桩核+烤瓷连桥修复' }
        ]
    },
    {
        id: 'p5', name: '刘强', gender: '男', age: 41, phone: '135****7789',
        project: '种植', doctor: '李医生', lastVisit: daysAgo(200),
        treatmentNote: '下颌双侧后牙种植修复，已完成上部结构修复。需定期复诊检查种植体周围软组织及咬合情况。',
        warnings: ['糖尿病史，血糖控制一般'],
        history: [
            { date: daysAgo(200), content: '下颌45、46种植体戴入最终冠，调颌抛光' },
            { date: daysAgo(270), content: '下颌45、46植入种植体2枚' }
        ]
    },
    {
        id: 'p6', name: '赵敏', gender: '女', age: 22, phone: '138****4456',
        project: '正畸', doctor: '张医生', lastVisit: daysAgo(25),
        treatmentNote: '青少年正畸患者，安氏I类拥挤。目前处于关闭间隙阶段，配合度良好。',
        warnings: [],
        history: [
            { date: daysAgo(25), content: '上下颌0.019×0.025方丝，弹力线关闭剩余间隙' },
            { date: daysAgo(55), content: '换方丝，开始间隙关闭' }
        ]
    },
    {
        id: 'p7', name: '孙大爷', gender: '男', age: 68, phone: '139****6678',
        project: '根管', doctor: '王医生', lastVisit: daysAgo(5),
        treatmentNote: '右下后牙慢性根尖周炎，进行根管治疗中。上次已完成根管预备，氢氧化钙封药。需复诊根管充填。',
        warnings: ['心脏起搏器植入患者，禁用超声洁牙'],
        history: [
            { date: daysAgo(5), content: '右下6根管预备至#30，氢氧化钙封药，暂封' },
            { date: daysAgo(20), content: '右下6叩痛阳性，X线示根尖阴影，诊断慢性根尖周炎' }
        ]
    },
    {
        id: 'p8', name: '周洁', gender: '女', age: 38, phone: '136****8890',
        project: '正畸', doctor: '张医生', lastVisit: daysAgo(40),
        treatmentNote: '成人隐形矫治第12副牙套。患者反映牙套贴合度可，上次复诊未做调整，继续佩戴。',
        warnings: [],
        history: [
            { date: daysAgo(40), content: '检查10-12副牙套贴合度，嘱继续按计划更换' },
            { date: daysAgo(80), content: '开始隐形矫治，戴入第1副' }
        ]
    },
    {
        id: 'p9', name: '吴海', gender: '男', age: 50, phone: '137****1123',
        project: '修复', doctor: '赵医生', lastVisit: daysAgo(25),
        treatmentNote: '上颌全口活动义齿修复，已初戴一周。患者反映有压痛，需复诊调改基托组织面。',
        warnings: [],
        history: [
            { date: daysAgo(25), content: '上颌全口义齿初戴，教摘戴及清洁方法' },
            { date: daysAgo(45), content: '终印模，颌位记录' }
        ]
    },
    {
        id: 'p10', name: '郑雪', gender: '女', age: 31, phone: '135****3344',
        project: '种植', doctor: '李医生', lastVisit: daysAgo(30),
        treatmentNote: '左上中切牙外伤缺失，即刻种植已完成。目前处于愈合期，需复诊检查软组织愈合情况。',
        warnings: [],
        history: [
            { date: daysAgo(30), content: '左上1即刻种植，植入Straumann种植体，GBR+CGF，愈合基台连接' },
            { date: daysAgo(30), content: '急诊：左上1冠根折，建议即刻种植' }
        ]
    },
    {
        id: 'p11', name: '钱明', gender: '男', age: 47, phone: '138****5566',
        project: '根管', doctor: '王医生', lastVisit: daysAgo(3),
        treatmentNote: '右上后牙慢性牙髓炎，封失活剂已72小时，需复诊取出失活剂并进行根管预备。',
        warnings: [],
        history: [
            { date: daysAgo(3), content: '右上7局麻下开髓，封金属砷，嘱72小时复诊' }
        ]
    },
    {
        id: 'p12', name: '杨丽', gender: '女', age: 26, phone: '139****7788',
        project: '正畸', doctor: '张医生', lastVisit: daysAgo(38),
        treatmentNote: '自锁托槽矫治，已进入精细调整阶段。患者反馈咬合关系改善明显。',
        warnings: [],
        history: [
            { date: daysAgo(38), content: '精细调整，上下颌颌间牵引' },
            { date: daysAgo(66), content: '更换方丝，开始精细调整' }
        ]
    }
];

const WARNING_PATIENTS = [
    {
        id: 'w1', name: '黄飞', gender: '男', age: 39, phone: '138****1234',
        noShowCount: 2, lateCount: 1, cancelCount: 1, totalMisses: 4, riskLevel: 'high',
        lastMissDate: daysAgo(8), lastMissType: '未到诊', lastMissDesc: '预约9:00种植复诊未到，电话无人接听',
        callStatus: 'pending', project: '种植', doctor: '李医生',
        callHistory: []
    },
    {
        id: 'w2', name: '徐婷婷', gender: '女', age: 24, phone: '139****5678',
        noShowCount: 1, lateCount: 2, cancelCount: 0, totalMisses: 3, riskLevel: 'medium',
        lastMissDate: daysAgo(15), lastMissType: '迟到', lastMissDesc: '正畸复诊迟到45分钟，影响后续患者预约',
        callStatus: 'pending', project: '正畸', doctor: '张医生',
        callHistory: []
    },
    {
        id: 'w3', name: '马大伟', gender: '男', age: 52, phone: '136****9012',
        noShowCount: 3, lateCount: 0, cancelCount: 2, totalMisses: 5, riskLevel: 'high',
        lastMissDate: daysAgo(5), lastMissType: '临时取消', lastMissDesc: '预约当天上午来电取消，称临时有事',
        callStatus: 'confirmed', project: '修复', doctor: '赵医生',
        callHistory: [
            { id: 'c1', result: 'confirmed', note: '已电话确认，患者表示本次会准时到达，上次因单位急事取消', date: daysAgo(2) }
        ]
    },
    {
        id: 'w4', name: '林小雨', gender: '女', age: 18, phone: '137****3456',
        noShowCount: 0, lateCount: 3, cancelCount: 0, totalMisses: 3, riskLevel: 'medium',
        lastMissDate: daysAgo(10), lastMissType: '迟到', lastMissDesc: '学生患者，正畸复诊迟到30分钟，称路上堵车',
        callStatus: 'pending', project: '正畸', doctor: '张医生',
        callHistory: []
    },
    {
        id: 'w5', name: '何志强', gender: '男', age: 44, phone: '135****7890',
        noShowCount: 1, lateCount: 0, cancelCount: 3, totalMisses: 4, riskLevel: 'high',
        lastMissDate: daysAgo(3), lastMissType: '未到诊', lastMissDesc: '根管治疗复诊未到，未提前通知',
        callStatus: 'reschedule', project: '根管', doctor: '王医生',
        callHistory: [
            { id: 'c2', result: 'reschedule', note: '患者称近期出差，希望改到下周三下午', date: daysAgo(1), rescheduleDate: daysLater(5) }
        ],
        nextFollowUpDate: daysLater(3)
    },
    {
        id: 'w6', name: '郭美丽', gender: '女', age: 30, phone: '138****2345',
        noShowCount: 0, lateCount: 1, cancelCount: 1, totalMisses: 2, riskLevel: 'low',
        lastMissDate: daysAgo(22), lastMissType: '临时取消', lastMissDesc: '因发烧取消预约，已改期就诊',
        callStatus: 'confirmed', project: '修复', doctor: '赵医生',
        callHistory: [
            { id: 'c3', result: 'confirmed', note: '已确认，患者上次是因为发烧，理解。本次预约确认可到。', date: daysAgo(20) }
        ]
    },
    {
        id: 'w7', name: '罗文', gender: '男', age: 61, phone: '139****6789',
        noShowCount: 2, lateCount: 1, cancelCount: 0, totalMisses: 3, riskLevel: 'medium',
        lastMissDate: daysAgo(18), lastMissType: '未到诊', lastMissDesc: '老年患者，家属称忘记了预约时间',
        callStatus: 'pending', project: '种植', doctor: '李医生',
        callHistory: []
    },
    {
        id: 'w8', name: '谢晓婷', gender: '女', age: 27, phone: '136****0123',
        noShowCount: 1, lateCount: 2, cancelCount: 2, totalMisses: 5, riskLevel: 'high',
        lastMissDate: daysAgo(7), lastMissType: '临时取消', lastMissDesc: '预约前1小时临时取消，称心情不好不想出门',
        callStatus: 'unreachable', project: '正畸', doctor: '张医生',
        callHistory: [
            { id: 'c4', result: 'unreachable', note: '连续拨打3次均无人接听，已发送提醒短信', date: daysAgo(4) }
        ],
        nextFollowUpDate: daysLater(1)
    }
];

let appointmentRecords = [];

const STORAGE_KEYS = {
    WARNING_PATIENTS: 'dental_warning_patients',
    PATIENTS: 'dental_patients',
    APPOINTMENTS: 'dental_appointments',
    WARNING_FILTERS: 'dental_warning_filters',
    PATIENT_FILTERS: 'dental_patient_filters',
    OCCUPIED_SLOTS: 'dental_occupied_slots'
};

function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('保存到localStorage失败:', e);
    }
}

function loadFromStorage(key, defaultValue) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.warn('从localStorage读取失败:', e);
        return defaultValue;
    }
}

function persistWarningPatients() {
    saveToStorage(STORAGE_KEYS.WARNING_PATIENTS, WARNING_PATIENTS);
}

function persistPatients() {
    saveToStorage(STORAGE_KEYS.PATIENTS, PATIENTS);
}

function persistAppointments() {
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointmentRecords);
}

function loadPersistedData() {
    const savedWarnings = loadFromStorage(STORAGE_KEYS.WARNING_PATIENTS, null);
    if (savedWarnings && Array.isArray(savedWarnings) && savedWarnings.length > 0) {
        savedWarnings.forEach(sw => {
            const original = WARNING_PATIENTS.find(w => w.id === sw.id);
            if (original) {
                Object.assign(original, sw);
            }
        });
    }

    const savedPatients = loadFromStorage(STORAGE_KEYS.PATIENTS, null);
    if (savedPatients && Array.isArray(savedPatients) && savedPatients.length > 0) {
        savedPatients.forEach(sp => {
            const original = PATIENTS.find(p => p.id === sp.id);
            if (original) {
                Object.assign(original, sp);
            }
        });
    }

    const savedAppointments = loadFromStorage(STORAGE_KEYS.APPOINTMENTS, []);
    if (savedAppointments && savedAppointments.length > 0) {
        appointmentRecords = savedAppointments;
    }

    const savedOccupied = loadFromStorage(STORAGE_KEYS.OCCUPIED_SLOTS, {});
    Object.keys(savedOccupied).forEach(key => {
        if (!occupiedSlots[key]) {
            occupiedSlots[key] = new Set();
        }
        savedOccupied[key].forEach(slot => occupiedSlots[key].add(slot));
    });
}

function persistOccupiedSlots() {
    const data = {};
    Object.keys(occupiedSlots).forEach(key => {
        data[key] = Array.from(occupiedSlots[key]);
    });
    saveToStorage(STORAGE_KEYS.OCCUPIED_SLOTS, data);
}

const TIME_SLOTS = [
    '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30', '15:00',
    '15:30', '16:00', '16:30', '17:00'
];

const INITIAL_DISABLED = {
    '1号椅位': ['09:00', '10:30', '14:30'],
    '2号椅位': ['08:30', '11:00', '15:30'],
    '3号椅位': ['09:30', '14:00', '16:00'],
    '4号椅位': ['10:00', '15:00'],
    '5号椅位': ['08:30', '10:30', '16:30'],
    '6号椅位': ['09:00', '14:30'],
    '7号椅位': ['11:30', '15:30'],
    '8号椅位': ['09:30', '11:00', '17:00']
};

const occupiedSlots = {};

function getOccupiedSlots(chair, date) {
    const key = `${chair}_${date}`;
    if (!occupiedSlots[key]) {
        occupiedSlots[key] = new Set(INITIAL_DISABLED[chair] || []);
    }
    return occupiedSlots[key];
}

function markSlotOccupied(chair, date, time) {
    const key = `${chair}_${date}`;
    if (!occupiedSlots[key]) {
        occupiedSlots[key] = new Set(INITIAL_DISABLED[chair] || []);
    }
    occupiedSlots[key].add(time);
    persistOccupiedSlots();
}

PATIENTS.forEach(p => {
    p.batchStatus = 'none';
    if (!p.followUpNote) p.followUpNote = '';
    if (!p.nextReminderDate) p.nextReminderDate = '';
    if (!p.actionHistory) p.actionHistory = [];
});

const PATIENT_BATCH_LABELS = {
    none: '',
    contacted: '已联系',
    postponed: '暂缓安排'
};
