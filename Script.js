/* =========================================================
   GLOBAL STATE & UTILITIES
   ========================================================= */
const xpPerAction = 10;           // XP earned on each user interaction
let totalXP = parseInt(localStorage.getItem('xp')) || 0;
updateXPBar();

/* ---- Toast helper ---- */
function showToast(msg){
  const toast = document.createElement('div');
  toast.className='toast';
  toast.textContent=msg;
  document.getElementById('toast').appendChild(toast);
  setTimeout(()=>toast.remove(),3000);
}

/* ---- Theme toggle ---- */
const themeBtn=document.getElementById('themeToggle');
themeBtn.addEventListener('click',()=>{
  document.body.classList.toggle('light-mode');
  const mode = document.body.classList.contains('light-mode')?'light':'dark';
  localStorage.setItem('theme',mode);
  showToast('Theme switched');
});
/* Restore saved theme */
const savedTheme = localStorage.getItem('theme');
if(savedTheme==='light') document.body.classList.add('light-mode');

/* ---- XP handling ---- */
function earnXP(){ totalXP+=xpPerAction; localStorage.setItem('xp',totalXP); updateXPBar();}
function updateXPBar(){
  const fill=document.getElementById('xpFill');
  const percent=Math.min(100,totalXP%1000/10);
  fill.style.width=`${percent}%`;
}

/* =========================================================
   SECTION SWITCHING
   ========================================================= */
document.querySelectorAll('.sidebar nav a').forEach(link=>{
  link.addEventListener('click',e=>{
    e.preventDefault();
    const target=link.dataset.section;
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.getElementById(target).classList.add('active');
    document.querySelectorAll('.sidebar nav a').forEach(a=>a.classList.remove('active'));
    link.classList.add('active');
    earnXP();
  });
});

/* =========================================================
   SECTION 1 – DASHBOARD LOGIC
   ========================================================= */
function updateGreeting(){
  const hour=new Date().getHours();
  const greet=document.getElementById('greeting');
  if(hour>=5 && hour<12) greet.textContent='Good Morning, Student 👋';
  else if(hour<17) greet.textContent='Good Afternoon, Student 🌤️';
  else if(hour<21) greet.textContent='Good Evening, Student 🌇';
  else greet.textContent='Good Night, Student 🌙';
}
function updateClock(){
  const now=new Date();
  const h=String(now.getHours()).padStart(2,'0');
  const m=String(now.getMinutes()).padStart(2,'0');
  const s=String(now.getSeconds()).padStart(2,'0');
  document.getElementById('clock').textContent=`${h}:${m}:${s}`;
  document.getElementById('date').textContent=now.toDateString();
}
function setQuote(){
  const quotes=[
    "Dream big, work hard.",
    "Stay curious, stay humble.",
    "Your future is created today.",
    "Believe in yourself.",
    "Every effort counts.",
    "Learning never stops.",
    "Stay focused, stay unstoppable."
  ];
  const idx=new Date().getDay()%quotes.length;
  document.getElementById('quote').textContent=quotes[idx];
}
setInterval(updateClock,1000);
updateGreeting(); updateClock(); setQuote();

/* =========================================================
   SECTION 2 – CGPA CALCULATOR
   ========================================================= */
const gradeMap={O:10,'A+':9,A:8,'B+':7,B:6,C:5,F:0};
let subjectCount=0;
function addSubjectRow(sub='Subject',grade='A',credits=3){
  const tbody=document.querySelector('#subjectTable tbody');
  const tr=document.createElement('tr');
  tr.innerHTML=`
    <td><input type="text" value="${sub}" class="subName" style="width:100%;"/></td>
    <td><select class="gradeSelect">
      ${Object.keys(gradeMap).map(g=>`<option ${g===grade?'selected':''}>${g}</option>`).join('')}
    </select></td>
    <td><input type="number" min="1" value="${credits}" class="credInput" style="width:60px;"/></td>`;
  tbody.appendChild(tr);
  subjectCount++;
}
document.getElementById('addRowBtn').addEventListener('click',()=>addSubjectRow());
document.getElementById('calcBtn').addEventListener('click',()=>{
  const rows=document.querySelectorAll('#subjectTable tbody tr');
  let sumGP=0, sumC=0;
  const gradeDist={};
  rows.forEach(r=>{
    const sub=r.querySelector('.subName').value.trim();
    const grade=r.querySelector('.gradeSelect').value;
    const cred=parseInt(r.querySelector('.credInput').value)||0;
    const gp=gradeMap[grade]*cred;
    sumGP+=gp; sumC+=cred;
    gradeDist[grade]=(gradeDist[grade]||0)+1;
  });
  const cgpa=(sumGP/sumC).toFixed(2);
  const resultEl=document.getElementById('cgpaResult');
  resultEl.textContent=`Your CGPA: ${cgpa}`;
  resultEl.style.color= cgpa<6?'var(--danger)':(cgpa<8?'var(--warning)':'var(--success)');

  // donut chart
  const ctx=document.getElementById('gradeChart').getContext('2d');
  new Chart(ctx,{
    type:'doughnut',
    data:{
      labels:Object.keys(gradeDist),
      datasets:[{
        data:Object.values(gradeDist),
        backgroundColor:['#a855f7','#06b6d4','#ec4899','#f59e0b','#22c55e','#ef4444']
      }]
    },
    options:{responsive:true}
  });

  // bunk prediction (simple linear estimate)
  const needed=(8.5*sumC - sumGP)/ (subjectCount+1);
  document.getElementById('bunkPredict').textContent=
    `You need ${needed.toFixed(2)} CGPA next semester to reach 8.5`;
  earnXP(); showToast('✅ CGPA calculated!');
});
/* initialise with two rows */
addSubjectRow(); addSubjectRow();

/* =========================================================
   SECTION 3 – ATTENDANCE TRACKER
   ========================================================= */
const subjects = [
  {name:'Mathematics',prof:'Dr. Rao',total:30,attended:24},
  {name:'Physics',prof:'Prof. Lee',total:28,attended:22},
  {name:'Chemistry',prof:'Dr. Patel',total:32,attended:30},
  {name:'History',prof:'Ms. Singh',total:26,attended:20},
  {name:'Literature',prof:'Mr. Khan',total:30,attended:27},
  {name:'Computer Science',prof:'Dr. Wu',total:28,attended:25}
];
function loadAttendance(){
  const stored=JSON.parse(localStorage.getItem('attendance')||'null');
  if(stored) subjects.forEach((s,i)=>{s.attended=stored[i].attended;});
}
function saveAttendance(){
  localStorage.setItem('attendance',JSON.stringify(subjects.map(s=>({attended:s.attended}))));
}
function renderAttendance(){
  const grid=document.getElementById('attendanceGrid');
  grid.innerHTML='';
  let anyLow=false;
  subjects.forEach((sub,i)=>{
    const perc=Math.round(sub.attended/sub.total*100);
    const color= perc<75?'var(--danger)':(perc<85?'var(--warning)':'var(--success)');
    const card=document.createElement('div');
    card.className='card';
    card.innerHTML=`
      <h4>${sub.name}<br/><small>${sub.prof}</small></h4>
      <div style="position:relative;width:80px;height:80px;margin:auto;">
        <svg viewBox="0 0 36 36">
          <path d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none" stroke="${color}" stroke-width="4"
            stroke-dasharray="${perc}, 100"/>
          <text x="18" y="20.35" text-anchor="middle" fill="${color}" font-size="8">${perc}%</text>
        </svg>
      </div>
      <p>${sub.attended}/${sub.total} classes</p>
      <button class="incBtn">+</button><button class="decBtn">-</button>
      <p class="bunkInfo"></p>
    `;
    card.querySelector('.incBtn').addEventListener('click',()=>{ if(sub.attended<sub.total){sub.attended++; update(); } });
    card.querySelector('.decBtn').addEventListener('click',()=>{ if(sub.attended>0){sub.attended--; update(); } });
    const safe=Math.floor((sub.total-sub.attended)*(perc>=85?2:1));
    card.querySelector('.bunkInfo').textContent=`You can miss ${safe} more safely`;
    grid.appendChild(card);
    if(perc<75){ anyLow=true; showAlert(sub.name); }
  });
  function update(){ saveAttendance(); renderAttendance(); earnXP(); }
}
function showAlert(subject){
  const alertDiv=document.getElementById('attendanceAlert');
  alertDiv.innerHTML=`<div class="card" style="background:var(--danger);color:var(--text-white);">
    ⚠️ Alert: You are at risk in ${subject}!
  </div>`;
}
loadAttendance(); renderAttendance();

/* =========================================================
   SECTION 4 – TIMETABLE
   ========================================================= */
const timetable = {
  Mon:[{slot:0,subject:'Math',room:'101'},{slot:2,subject:'Physics',room:'202'}],
  Tue:[{slot:1,subject:'Chemistry',room:'303'}],
  Wed:[{slot:0,subject:'History',room:'404'},{slot:3,subject:'CS',room:'505'}],
  Thu:[{slot:2,subject:'Literature',room:'606'}],
  Fri:[{slot:1,subject:'Math',room:'101'},{slot:4,subject:'Physics',room:'202'}]
};
const days=['Mon','Tue','Wed','Thu','Fri'];
function renderTimetable(){
  const grid=document.getElementById('timetableGrid');
  grid.innerHTML='';
  const today=days[new Date().getDay()-1];
  document.getElementById('todayStrip').textContent=`Today: ${today}`;
  for(let slot=0; slot<6; slot++){
    days.forEach(d=>{
      const cell=document.createElement('div');
      const entry = (timetable[d]||[]).find(e=>e.slot===slot);
      if(entry){
        cell.className='card';
        cell.innerHTML=`<strong>${entry.subject}</strong><br/>Room ${entry.room}`;
        cell.style.border=`2px solid var(--neon-pink)`;
        cell.addEventListener('click',()=>showModal(d,slot,entry));
      }else{
        cell.className='card';
        cell.style.border='1px dashed var(--text-muted)';
        cell.textContent='Free';
      }
      if(d===today) cell.style.boxShadow=`0 0 12px var(--neon-cyan)`;
      grid.appendChild(cell);
    });
  }
}
function showModal(day,slot,entry){
  const overlay=document.getElementById('modalOverlay');
  overlay.style.display='flex';
  document.getElementById('modalContent').innerHTML=`
    <h3>${entry.subject}</h3>
    <p><strong>Day:</strong> ${day}</p>
    <p><strong>Time:</strong> ${9+slot} AM</p>
    <p><strong>Room:</strong> ${entry.room}</p>
    <p>Notes: <em>None</em></p>`;
}
document.getElementById('closeModal').addEventListener('click',()=>{ document.getElementById('modalOverlay').style.display='none'; });
renderTimetable();

/* =========================================================
   SECTION 5 – KANBAN TASK BOARD
   ========================================================= */
let tasks = JSON.parse(localStorage.getItem('tasks')||'[]');
function renderTasks(){
  ['todo','progress','done'].forEach(col=>{
    const container=document.querySelector(`.card[data-status="${col}"] .taskList`);
    container.innerHTML='';
    const filtered = tasks.filter(t=>t.status===col);
    document.getElementById(col+'Count').textContent=filtered.length;
    filtered.forEach(t=>{
      const card=document.createElement('div');
      card.className='card';
      card.style.margin='.5rem 0';
      card.innerHTML=`
        <strong>${t.title}</strong><br/>
        <span style="background:${t.tagColor};color:#fff;padding:2px 6px;border-radius:4px;">${t.tag}</span>
        <span style="float:right;">${t.due}</span><br/>
        <span>${t.priority}</span><br/>
        <button class="moveBtn">Move →</button>`;
      if(col==='done'){
        card.style.textDecoration='line-through';
        card.style.background='rgba(34,197,94,.2)';
      }
      card.querySelector('.moveBtn').addEventListener('click',()=>{ moveTask(t.id); });
      container.appendChild(card);
    });
  });
}
function addTask(status){
  const title=prompt('Task title?');
  if(!title) return;
  const tag=prompt('Subject tag?','General');
  const due=prompt('Due date (YYYY-MM-DD)?','2026-12-31');
  const priority=prompt('Priority (high,medium,low)','low');
  const colors={high:'var(--danger)',medium:'var(--warning)',low:'var(--success)'};
  const newTask={id:Date.now(),title,tag,tagColor:colors[priority]||'var(--neon-cyan)',due,priority, status};
  tasks.push(newTask);
  saveTasks(); renderTasks(); earnXP(); showToast('✅ Task added!');
}
function moveTask(id){
  const t=tasks.find(x=>x.id===id);
  if(t){
    t.status = t.status==='todo'?'progress':t.status==='progress'?'done':'done';
    saveTasks(); renderTasks(); earnXP();
  }
}
function saveTasks(){ localStorage.setItem('tasks',JSON.stringify(tasks)); }
document.querySelectorAll('.addTaskBtn').forEach(btn=>{ btn.addEventListener('click',()=>addTask(btn.parentElement.dataset.status)); });
renderTasks();

/* =========================================================
   SECTION 6 – EVENT FEED
   ========================================================= */
const events = [
  {name:'Tech Fest 2026',date:'2026-11-12 10:00',location:'Auditorium',category:'tech',desc:'Innovate, code, compete.',going:0},
  {name:'Cultural Night',date:'2026-11-15 19:00',location:'Open Ground',category:'cultural',desc:'Dance & music.',going:0},
  {name:'Inter‑College Football',date:'2026-11-20 15:00',location:'Stadium',category:'sports',desc:'Cheer the teams.',going:0},
  {name:'AI Workshop',date:'2026-11-05 14:00',location:'Lab 3',category:'workshop',desc:'Hands‑on AI.',going:0},
  {name:'Hackathon 2026',date:'2026-12-01 09:00',location:'Tech Hub',category:'tech',desc:'Build in 24h.',going:0},
  {name:'Poetry Slam',date:'2026-11-08 18:00',location:'Cafe',category:'cultural',desc:'Words matter.',going:0}
];
function renderEvents(filter='all'){
  const container=document.getElementById('eventCards');
  container.innerHTML='';
  events.filter(e=>filter==='all'||e.category===filter).forEach((e,i)=>{
    const card=document.createElement('div');
    card.className='card';
    const catColor={tech:'var(--neon-cyan)',cultural:'var(--neon-pink)',sports:'var(--success)',workshop:'var(--neon-purple)'};
    card.innerHTML=`
      <h4>${e.name}</h4>
      <p><i class="fa-solid fa-calendar-days"></i> ${e.date}</p>
      <p><i class="fa-solid fa-location-dot"></i> ${e.location}</p>
      <p style="background:${catColor[e.category]};color:#fff;display:inline-block;padding:2px 6px;border-radius:4px;">
        ${e.category.charAt(0).toUpperCase()+e.category.slice(1)}
      </p>
      <p>${e.desc}</p>
      <button class="goingBtn">${e.going>0?'✅':'🚶'} I'm Going! (${e.going})</button>`;
    card.querySelector('.goingBtn').addEventListener('click',()=>{ toggleGoing(i); });
    container.appendChild(card);
  });
}
function toggleGoing(idx){
  events[idx].going = (events[idx].going+1)%2===0?0:events[idx].going+1;
  renderEvents(currentFilter);
  logEvent(`${events[idx].name} ${events[idx].going?`joined`:`left`}`);
  earnXP(); showToast('📅 Event saved!');
}
function logEvent(msg){
  const ul=document.getElementById('eventLog');
  const li=document.createElement('li');
  li.textContent=`${msg} · ${new Date().toLocaleTimeString()}`;
  ul.prepend(li);
}
let currentFilter='all';
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{ 
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter=tab.dataset.filter;
    renderEvents(currentFilter);
  });
});
renderEvents();

/* =========================================================
   SECTION 7 – POMODORO TIMER
   ========================================================= */
let pomodoro = {mode:'focus', minutes:25, seconds:0, interval:null, sessions:0};
const modeTimes={focus:25, short:5, long:15};
function updatePomodoroDisplay(){
  const mins=String(pomodoro.minutes).padStart(2,'0');
  const secs=String(pomodoro.seconds).padStart(2,'0');
  document.getElementById('pomodoroTimer').textContent=`${mins}:${secs}`;
}
function startPomodoro(){ if(pomodoro.interval) return; pomodoro.interval=setInterval(tick,1000); }
function pausePomodoro(){ clearInterval(pomodoro.interval); pomodoro.interval=null; }
function resetPomodoro(){
  pausePomodoro();
  pomodoro.minutes=modeTimes[pomodoro.mode]; pomodoro.seconds=0;
  updatePomodoroDisplay();
}
function tick(){
  if(pomodoro.seconds===0){
    if(pomodoro.minutes===0){
      pausePomodoro();
      alert('Session complete! Take a break 🎉');
      pomodoro.sessions++;
      document.getElementById('sessionLog').textContent=`Today you completed ${pomodoro.sessions} focus sessions = ${pomodoro.sessions*25} minutes`;
      setMotivation(pomodoro.sessions);
      pomodoro.mode=pomodoro.mode==='focus'?'short':'focus';
      pomodoro.minutes=modeTimes[pomodoro.mode]; pomodoro.seconds=0;
      updateModeButtons();
      return;
    }
    pomodoro.minutes--; pomodoro.seconds=59;
  }else{
    pomodoro.seconds--;
  }
  updatePomodoroDisplay();
}
function setMotivation(count){
  let msg='Great start! 💪';
  if(count>=5) msg='Absolute beast mode! 🚀';
  else if(count>=3) msg="You're on fire! 🔥";
  document.getElementById('motivationMsg').textContent=msg;
}
function updateModeButtons(){
  document.querySelectorAll('.modeBtn').forEach(b=>b.classList.toggle('active',b.dataset.mode===pomodoro.mode));
}
document.querySelectorAll('.modeBtn').forEach(btn=>{
  btn.addEventListener('click',()=>{ pomodoro.mode=btn.dataset.mode; resetPomodoro(); updateModeButtons(); earnXP(); });
});
document.getElementById('startBtn').addEventListener('click',startPomodoro);
document.getElementById('pauseBtn').addEventListener('click',pausePomodoro);
document.getElementById('resetBtn').addEventListener('click',resetPomodoro);
resetPomodoro();

/* =========================================================
   SECTION 8 – DAILY VIBE CHECK
   ========================================================= */
const moodMap={
  '😴':'Rest up! Sleep is underrated 💤',
  '😐':'Neutral days are valid. Keep going 🌫️',
  '😊':'Happy vibes only! Keep it up ✨',
  '🔥':'You\'re absolutely killing it today! 🚀',
  '💀':'Rough day? You\'ve survived 100% of them so far 💙'
};
function loadMood(){ return JSON.parse(localStorage.getItem('moodLog')||'[]'); }
function saveMood(log){ localStorage.setItem('moodLog',JSON.stringify(log)); }
let moodLog=loadMood();
function renderMood(){
  const container=document.getElementById('weeklyMood');
  container.innerHTML='';
  const daysOfWeek=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const todayIdx=new Date().getDay()-1;
  daysOfWeek.forEach((d,i)=>{
    const box=document.createElement('div');
    box.style.width='24px'; box.style.height='24px'; box.style.borderRadius='4px';
    box.style.background=moodLog[i]?moodLog[i]:'var(--card-dark)';
    if(i===todayIdx) box.style.border=`2px solid var(--neon-cyan)`;
    container.appendChild(box);
  });
  // streak
  let streak=0; for(let i=moodLog.length-1;i>=0;i--){ if(moodLog[i]) streak++; else break; }
  document.getElementById('streak').textContent=`You've been ${moodLog[moodLog.length-1]||'...'} for ${streak} day(s)!`;
}
document.querySelectorAll('.emojiBtn').forEach(btn=>{
  btn.addEventListener('click',()=>{ 
    const emo=btn.textContent.trim();
    document.getElementById('vibeMessage').textContent=moodMap[emo];
    const todayIdx=new Date().getDay()-1;
    moodLog[todayIdx]=emo;
    saveMood(moodLog);
    renderMood(); earnXP(); showToast('😊 Mood saved!');
  });
});
renderMood();

/* =========================================================
   SPOTLIGHT SEARCH (Ctrl+K)
   ========================================================= */
let searchOverlay=null;
function createSearchOverlay(){
  searchOverlay=document.createElement('div');
  searchOverlay.style.position='fixed';
  searchOverlay.style.top='0';searchOverlay.style.left='0';
  searchOverlay.style.width='100%';searchOverlay.style.height='100%';
  searchOverlay.style.background='rgba(0,0,0,.7)';
  searchOverlay.style.display='flex';searchOverlay.style.alignItems='center';
  searchOverlay.style.justifyContent='center';
  searchOverlay.innerHTML=`<div class="card" style="padding:2rem;min-width:300px;">
      <input id="searchInput" placeholder="Search sections…" style="width:100%;padding:.5rem;font-size:1rem;"/>
    </div>`;
  document.body.appendChild(searchOverlay);
  const input=document.getElementById('searchInput');
  input.focus();
  input.addEventListener('input',e=>{
    const term=e.target.value.toLowerCase();
    document.querySelectorAll('.sidebar nav a').forEach(a=>{
      if(a.textContent.toLowerCase().includes(term)) a.click();
    });
  });
}
document.addEventListener('keydown',e=>{
  if(e.ctrlKey && e.key==='k'){
    e.preventDefault();
    if(!searchOverlay) createSearchOverlay();
    else {searchOverlay.remove(); searchOverlay=null;}
  }
  if(e.key==='Escape' && searchOverlay){searchOverlay.remove(); searchOverlay=null;}
});

/* =========================================================
   GLOBAL CLICK COUNTER FOR XP
   ========================================================= */
document.body.addEventListener('click',()=>{ earnXP(); });