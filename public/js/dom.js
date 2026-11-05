const $ = (id) => document.getElementById(id);

export const dom = {
  // 畫面
  loginView: $('loginView'),
  appView: $('appView'),
  reportView: $('reportView'),

  // 登入
  classInput: $('classInput'),
  classBadge: $('classBadge'),
  durationSelect: $('durationSelect'),
  enterBtn: $('enterBtn'),
  discussionBackBtn: $('discussionBackBtn'),
  groupButtons: Array.from(document.querySelectorAll('.group-option')),
  groupBadge: $('groupBadge'),

  // 警示與提醒
  alertOverlay: $('alertOverlay'),
  alertHealth: $('alertHealth'),
  alertWarningContent: $('alertWarningContent'),
  alertCloseBtn: $('alertCloseBtn'),
  healthQuizContent: $('healthQuizContent'),
  healthQuizOptions: Array.from(document.querySelectorAll('input[name="healthQuiz"]')),
  healthQuizFeedback: $('healthQuizFeedback'),
  healthQuizSubmitBtn: $('healthQuizSubmitBtn'),
  healthReminder: $('healthReminder'),

  // 主畫面
  startBtn: $('startBtn'),
  recalBtn: $('recalBtn'),
  statusText: $('statusText'),
  feedbackBox: $('feedbackBox'),
  healthFill: $('healthFill'),
  healthValue: $('healthValue'),
  healthScore: $('healthScore'),
  volumeFill: $('volumeFill'),
  volumeValue: $('volumeValue'),
  volumeDisplay: $('volumeDisplay'),
  noiseValue: $('noiseValue'),
  timeLabel: $('timeLabel'),
  timeValue: $('timeValue'),
  signalBars: Array.from(document.querySelectorAll('.signal-bar')),

  // 總結頁
  backBtn: $('backBtn'),
  reportGroup: $('reportGroup'),
  reportDuration: $('reportDuration'),
  reportAvgDb: $('reportAvgDb'),
  reportMaxDb: $('reportMaxDb'),
  reportFinalHealth: $('reportFinalHealth'),
  reportMinHealth: $('reportMinHealth'),
  reportAlerts: $('reportAlerts'),
  zoneGreen: $('zoneGreen'),
  zoneYellow: $('zoneYellow'),
  zoneRed: $('zoneRed'),
  zoneGreenBar: $('zoneGreenBar'),
  zoneYellowBar: $('zoneYellowBar'),
  zoneRedBar: $('zoneRedBar'),
  reportChart: $('reportChart'),
  reportFeedback: $('reportFeedback'),
  reportAdvice: $('reportAdvice'),
  syncStatus: $('syncStatus'),
};