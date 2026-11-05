/*
 * Sapir Developer Hub · INTERACTIVE DESIGN PROTOTYPE, v0.1
 * No external dependencies, API calls, persistence, authentication or file writes.
 * Any task, wiki page, Slack message or integration status in this demo is fictional.
 * Production implementation target: Tauri 2 + React + TypeScript + SQLite FTS5.
 */
'use strict';

const icons = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = (id) => document.getElementById(id);
const pages = {home:'Обзор',tasks:'Мои задачи',knowledge:'База знаний',news:'Новости отдела',agents:'AI Agents',prompts:'Prompt Builder',settings:'Настройки'};

const tasks = [
  {id:'DEMO-231',title:'Переработать начисление рейтинговых кубков',project:'Bulls & Cows',status:'progress',priority:'high',assignee:'Вы',date:'Без срока',description:'Убрать фиксированное изменение на 25 кубков. Передавать количество заработанных или потерянных кубков через события MessagePipe.',docs:['messagepipe','architecture']},
  {id:'DEMO-252',title:'Преобразовать TutorialPlaceholderLauncher в обычное окно',project:'Bulls & Cows',status:'todo',priority:'medium',assignee:'Вы',date:'Без срока',description:'Перевести временное окно обучения в стандартный UI-экран проекта с обычным жизненным циклом View/Presenter.',docs:['architecture','ugui']},
  {id:'DEMO-266',title:'Проверить OAuth авторизацию Google Play Games',project:'Bulls & Cows',status:'review',priority:'high',assignee:'Вы',date:'Без срока',description:'Проверить конфигурацию debug SHA-1 и OAuth client для тестовых Android-сборок.',docs:['workflow']},
  {id:'DEMO-294',title:'Подготовить сценарий демонстрации спринта',project:'Limit of Darkness',status:'todo',priority:'medium',assignee:'Вы',date:'Без срока',description:'Подготовить билд, короткое видео и список изменений перед демо.',docs:['workflow']},
  {id:'DEMO-300',title:'Уточнить правила LifetimeScope',project:'Shared Foundation',status:'done',priority:'medium',assignee:'Вы',date:'Готово',description:'Задокументировать пример регистрации и создания scope при аддитивной загрузке сцен.',docs:['lifetime','architecture']}
];
const docs = [
  {id:'architecture',title:'Clean Architecture',section:'Architecture',desc:'Слои, зависимости, границы ответственности и проектирование фич в Unity.',updated:'Пример · сегодня',tags:['MVP','UseCases','Gateways'],body:['Правило зависимостей: Presentation обращается к UseCases через контракты. UseCases взаимодействуют с Gateway-интерфейсами. Infrastructure реализует необходимые адаптеры.','Рекомендуемая схема для фичи: View → Presenter → UseCase → Gateway. Domain содержит правила и модели, не зависящие от Unity API.','Пример структуры: Domain / UseCases / Presentation / Infrastructure. Композиция зависимостей выполняется в LifetimeScope.']},
  {id:'lifetime',title:'LifetimeScope и композиция сцен',section:'Architecture',desc:'Где создавать контейнеры, как передавать session context и регистрировать сервисы.',updated:'Пример · вчера',tags:['VContainer','Scenes'],body:['Bootstrap является владельцем долгоживущих сервисов и базовой конфигурации приложения.','Scope конкретной сцены регистрирует зависимости, которые нужны только ей. Для игровых сессий передаём контекст при создании Core scope.','Зависимости определяются при композиции, а не запрашиваются из глобальных статических контейнеров.']},
  {id:'messagepipe',title:'MessagePipe Guidelines',section:'Architecture',desc:'События, publisher/subscriber, DTO, ограничение широковещательных зависимостей.',updated:'Пример · 2 дня назад',tags:['MessagePipe','Events'],body:['Используйте типизированные события там, где между отправителем и получателем действительно нужна слабая связность.','Передавайте все необходимые данные в сообщении; не заставляйте получателя восстанавливать контекст через глобальный сервис.','Publisher обозначает факт завершённого действия. UseCase отвечает за бизнес-операцию.']},
  {id:'workflow',title:'Feature Development Workflow',section:'Processes',desc:'Как спроектировать фичу, подготовить контекст агенту и проверить результат.',updated:'Пример · 3 дня назад',tags:['Workflow','AI Agents'],body:['Сформулируйте пользовательский сценарий и условия готовности.','Определите доменные правила, UseCases, источники данных, Presenter и UI-контракт.','Проверьте зависимости, контракты ошибок, загрузку сцен и тесты до генерации реализации.']},
  {id:'ugui',title:'UGUI / Canvas Standards',section:'UI / UX',desc:'Иерархия Canvas, responsive layout, взаимодействие и переиспользуемые окна.',updated:'Пример · 4 дня назад',tags:['UGUI','Responsive'],body:['Используйте якоря, LayoutGroup и CanvasScaler по назначению. Проверяйте портретные разрешения телефона и планшета.','Описывайте View через интерфейсы, чтобы Presenter не зависел от конкретной реализации.','Проверяйте состояние кнопок, анимации переходов и отсутствие двойных нажатий.']},
  {id:'async',title:'UniTask & Async Flow',section:'Architecture',desc:'Отмена, жизненный цикл, обработка ошибок и асинхронные операции.',updated:'Пример · неделя назад',tags:['UniTask','C#'],body:['Связывайте CancellationToken с жизненным циклом объекта или операции.','Не оставляйте fire-and-forget операции без стратегии обработки ошибок.','Разделяйте асинхронное получение данных и визуальное отображение состояний.']}
];
const news = [
  {author:'Development',initials:'SG',channel:'#development',time:'Пример сообщения · сегодня',title:'Демонстрации спринтов',text:'Перед демо подготовьте рабочий билд, короткое видео и описание выполненных изменений. Обсуждение посвящено результату и обратной связи.',tag:'Announcement'},
  {author:'Architecture',initials:'AR',channel:'#development',time:'Пример сообщения · вчера',title:'Обновлены рекомендации по архитектуре',text:'Добавлены пояснения по ответственности LifetimeScope и работе с MessagePipe. Актуальная документация доступна в разделе Knowledge.',tag:'Documentation'},
  {author:'Development',initials:'SG',channel:'#development',time:'Пример сообщения · ранее',title:'Корпоративные инструкции для AI-агентов',text:'AGENTS.md используется как единый стандарт для Codex и Claude Code. Новая версия распространяется через Git и устанавливается из Hub.',tag:'AI Agents'}
];
const statusName = {progress:'В работе',todo:'К выполнению',review:'На ревью',done:'Готово'};
const priorityName = {high:'Высокий',medium:'Средний'};
const initialView = new URLSearchParams(window.location.search).get('view');
const state = {route:(initialView && pages[initialView] ? initialView : 'home'),taskFilter:'all',taskQuery:'',docQuery:'',knowledgeMode:'read',activeDoc:'architecture',agentVersion:'1.3.0',agentLatest:'1.4.0',projects:[{name:'Bulls & Cows',path:'D:\\Projects\\BullsAndCows',version:'1.3.0'},{name:'Limit of Darkness',path:'D:\\Projects\\LimitOfDarkness',version:null}],promptType:'implement',promptTask:'DEMO-231',promptDocs:new Set(['architecture','messagepipe']),searchOpen:false,searchQuery:'',toastId:null,modal:null};

const heading = (eyebrow,title,subtitle,actions='') => `<header class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="subheading">${subtitle}</p></div>${actions?`<div class="page-actions">${actions}</div>`:''}</header>`;
const demo = () => `<span class="demo-note">${icons('info')} Демонстрационные данные</span>`;
const taskBadge = s => `<span class="pill ${s}">${statusName[s]}</span>`;
const pill = (text,cls='') => `<span class="pill ${cls}">${text}</span>`;
const taskRow = t => `<div class="task-row" data-task="${t.id}" tabindex="0" role="button" aria-label="Открыть ${escapeHtml(t.title)}"><span class="task-type">${icons('checksquare')}</span><div class="task-row-info"><div class="task-name">${escapeHtml(t.title)}</div><div class="task-meta"><span>${t.id}</span><span>${escapeHtml(t.project)}</span></div></div>${taskBadge(t.status)}</div>`;
const rowNews = n => `<div class="news-preview-item"><div class="news-avatar ${n.initials==='AR'?'alt':''}">${n.initials}</div><div class="news-content"><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.text)}</p><span class="muted">${escapeHtml(n.time)} · ${escapeHtml(n.channel)}</span></div></div>`;
function home(){
  const active=tasks.filter(task=>task.status!=='done');
  const metrics=[
    ['tasks','checksquare',active.length,'Активные задачи'],
    ['knowledge','graph',docs.length,'Документы в базе'],
    ['news','message',news.length,'Новости отдела'],
    ['agents','bot',state.agentVersion===state.agentLatest?0:1,'Обновления AGENTS'],
  ];
  return `<section class="hero" aria-labelledby="home-title">
    <canvas class="prism-canvas" data-prism="home" aria-hidden="true"></canvas>
    <div class="hero-shade" aria-hidden="true"></div>
    <div class="hero-content">
      <div class="hero-label">Sapir Game · Рабочее пространство</div>
      <h1 id="home-title">Всё<br><em>в фокусе.</em></h1>
      <p>Найдите нужный документ, откройте задачу или соберите контекст для AI-агента.</p>
      <div class="flex"><button class="btn btn-primary" data-route="tasks">К задачам ${icons('arrow')}</button>
        <button class="btn btn-quiet" data-show-graph>${icons('graph')} Граф знаний</button></div>
    </div>
    <div class="scene-meta"><span>01 / SAPIR</span><span class="scene-hint">Перетяните, чтобы вращать</span></div>
  </section>
  <div class="dashboard-head"><h2>Рабочий обзор</h2><span class="local-status kicker">Демонстрационные данные</span></div>
  <section class="metric-strip" aria-label="Сводка">${metrics.map(([route,icon,value,label])=>`
    <button class="card metric" type="button" data-route="${route}">
      <span class="metric-icon">${icons(icon)}</span><span><strong>${value}</strong><small>${label}</small></span>${icons('arrow','small')}
    </button>`).join('')}</section>
  <section class="home-grid" aria-label="Текущая работа">
    <article class="card home-panel"><div class="section-header"><h2 class="section-title">В работе</h2><button class="text-link" data-route="tasks">Все задачи ${icons('arrow','small')}</button></div>${active.slice(0,3).map(taskRow).join('')}</article>
    <article class="card home-panel"><div class="section-header"><h2 class="section-title">Новости отдела</h2><button class="text-link" data-route="news">В ленту ${icons('arrow','small')}</button></div>${news.slice(0,2).map(rowNews).join('')}</article>
  </section>`;
}
function filteredTasks(){return tasks.filter(t=>(state.taskFilter==='all'||t.status===state.taskFilter)&&`${t.id} ${t.title} ${t.project}`.toLowerCase().includes(state.taskQuery.toLowerCase()));}
function tasksPage(){return `${heading('WORK / CLICKUP','Мои задачи','Один список задач из подключённого ClickUp. Изменения статусов в прототипе не сохраняются.',demo())}
  <div class="toolbar"><div class="tabs">${[['all','Все'],['todo','К выполнению'],['progress','В работе'],['review','На ревью'],['done','Готово']].map(([k,v])=>`<button class="tab ${state.taskFilter===k?'active':''}" data-filter="${k}">${v}</button>`).join('')}</div><div class="input-wrap" style="width:240px">${icons('search')}<input id="task-search" placeholder="Поиск по задачам" value="${escapeHtml(state.taskQuery)}" aria-label="Поиск по задачам"></div></div>
  <div class="card" style="padding:0;overflow:hidden"><div class="table-wrap"><table class="task-table"><thead><tr><th>Задача</th><th>Статус</th><th>Приоритет</th><th>Проект</th><th>Дедлайн</th></tr></thead><tbody>${filteredTasks().map(t=>`<tr data-task="${t.id}"><td><button class="task-open" type="button"><span class="task-id">${t.id}</span>${escapeHtml(t.title)}</button></td><td>${taskBadge(t.status)}</td><td><span class="priority-${t.priority}">●</span> ${priorityName[t.priority]}</td><td>${escapeHtml(t.project)}</td><td class="muted">${escapeHtml(t.date)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">Задачи не найдены</td></tr>'}</tbody></table></div></div>`;}
function filteredDocs(){return docs.filter(d=>`${d.title} ${d.desc} ${d.section} ${d.tags.join(' ')}`.toLowerCase().includes(state.docQuery.toLowerCase()));}
function docPanel(d){return `<article class="document-view"><div class="doc-top">${icons('book')} Outline Wiki <span style="opacity:.45">/</span> ${escapeHtml(d.section)} <span style="flex:1"></span>${pill('Preview')}</div><h2>${escapeHtml(d.title)}</h2><p>${escapeHtml(d.desc)}</p><div class="divider"></div><h3>Основные положения</h3>${d.body.map(b=>`<p>${escapeHtml(b)}</p>`).join('')}<h3>Теги</h3><div class="tag-list">${d.tags.map(t=>pill(escapeHtml(t),'todo')).join('')}</div><div class="divider"></div><button class="btn btn-quiet btn-small" data-copy-doc="${d.id}">${icons('copy')} Копировать Markdown</button> <button class="btn btn-quiet btn-small" data-route="prompts">${icons('wand')} В Prompt Builder</button></article>`;}
function graph(){
  const nodes=[{id:'architecture',x:50,y:16},{id:'lifetime',x:24,y:37},{id:'messagepipe',x:75,y:47},{id:'workflow',x:43,y:58},{id:'ugui',x:21,y:76},{id:'async',x:79,y:83}];
  const links=[[0,1],[0,2],[0,3],[1,4],[2,5],[3,4],[3,5]];
  return `<div class="graph-container" role="group" aria-label="Граф знаний">
    <svg class="graph-svg" aria-hidden="true">${links.map(([a,b])=>`<line data-from="${a}" data-to="${b}"/>`).join('')}</svg>
    ${nodes.map(n=>`<button class="graph-node ${n.id===state.activeDoc?'main':''}" data-doc="${n.id}" data-x="${n.x}" data-y="${n.y}">${icons('file')}${escapeHtml(docs.find(d=>d.id===n.id).title)}</button>`).join('')}
    <div class="graph-caption"><span class="graph-label">Перетащите узел. Нажмите на него, чтобы открыть документ.</span><button class="btn btn-quiet btn-small graph-reset" data-reset-graph>Сбросить</button></div>
  </div>`;
}
function knowledge(){let current=docs.find(d=>d.id===state.activeDoc)||docs[0];return `${heading('KNOWLEDGE / OUTLINE','База знаний','Документы, корпоративная архитектура и связи между страницами.',demo())}
  <div class="toolbar"><div class="input-wrap" style="width:min(440px,100%)">${icons('search')}<input id="doc-search" placeholder="Название, технология, ключевые слова..." value="${escapeHtml(state.docQuery)}" aria-label="Поиск по документации"></div><div class="tabs"><button class="tab ${state.knowledgeMode==='read'?'active':''}" data-mode="read">${icons('book')} Документы</button><button class="tab ${state.knowledgeMode==='graph'?'active':''}" data-mode="graph">${icons('graph')} Граф знаний</button></div></div>
  ${state.knowledgeMode==='graph'?graph():`<div class="knowledge-layout"><div class="knowledge-list">${filteredDocs().map(d=>`<button class="${state.activeDoc===d.id?'selected':''}" data-doc="${d.id}">${icons('file')} ${escapeHtml(d.title)}</button>`).join('')||'<div class="empty">Документы не найдены</div>'}</div>${docPanel(current)}</div>`}`;}
function newsPage(){return `${heading('TEAM / SLACK','Новости отдела','Объявления, релизы, демо и изменения процессов из рабочего Slack.',demo())}<div class="card feed">${news.map(n=>`<article class="feed-item"><div class="feed-avatar">${n.initials}</div><div class="feed-body"><div class="feed-info"><strong>${escapeHtml(n.author)}</strong> · ${escapeHtml(n.channel)} · ${escapeHtml(n.time)}</div><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.text)}</p><span class="feed-tag">${escapeHtml(n.tag)}</span></div></article>`).join('')}</div>`;}
const corporateAgents = `# Sapir Game — Corporate Agent Instructions\n\n## Architecture\n- Unity / C#\n- MVP + UseCases + Gateways\n- VContainer for dependency injection\n- MessagePipe for cross-feature events\n- UniTask for asynchronous operations\n\n## Engineering rules\n- Preserve project conventions.\n- Define responsibilities before generating code.\n- Do not introduce unnecessary global/static access.\n- Follow project-specific instructions.\n\n## Documentation\n- Read approved architecture documents.\n- Use repository-local documentation exports.\n`;
function agentsPage(){return `${heading('AI / CORPORATE STANDARDS','AI Agents','Единый корпоративный AGENTS.md из Git для Codex, Claude Code и других агентов.',demo())}
 <div class="agents-banner"><div class="card"><div class="agents-file"><div class="file-emblem">${icons('file','big')}</div><div><div class="eyebrow" style="margin:3px 0 6px">SINGLE SOURCE OF TRUTH</div><h2>AGENTS.md</h2><p>Корпоративная архитектура, соглашения и правила работы с кодом. Источник версий: Git-репозиторий стандартов.</p><div style="margin-top:14px">${pill('Codex','progress')} ${pill('Claude Code','review')} ${pill('Git managed','todo')}</div></div></div><div class="divider"></div><div class="flex" style="flex-wrap:wrap"><button class="btn btn-primary" data-modal="diff">${icons('git')} Посмотреть изменения</button><button class="btn btn-quiet" data-copy-agents>${icons('copy')} Скопировать файл</button></div></div>
 <div class="card"><div class="eyebrow">CORPORATE STANDARD</div><div class="big-version">v${state.agentLatest}</div><p class="subheading">Пример доступной версии из Git</p><div class="version-compare"><div><small>Локальная версия</small><strong>v${state.agentVersion}</strong></div><div><small>Доступная версия</small><strong style="color:#9cc4ff">v${state.agentLatest}</strong></div></div><div class="divider"></div><button class="btn btn-primary" style="width:100%" data-update-agents>${icons('refresh')} ${state.agentVersion===state.agentLatest?'Инструкции актуальны':'Обновить в проектах'}</button></div></div>
 <div class="grid-equal"><section class="card"><div class="section-header"><h2 class="section-title">Проекты на компьютере</h2><button class="btn btn-quiet btn-small" data-modal="add-project">+ Добавить проект</button></div>${state.projects.map((p,i)=>`<div class="project-row"><div class="flex"><span class="project-icon">${icons('folder')}</span><div><div class="project-name">${escapeHtml(p.name)}</div><div class="project-path">${escapeHtml(p.path)}</div></div></div><div><div class="project-status ${p.version===state.agentLatest?'':'outdated'}">${p.version?'v'+p.version:'Не установлен'}</div><button class="text-link" style="margin-top:7px" data-project-install="${i}">${p.version?'Обновить':'Установить'}</button></div></div>`).join('')}<div class="notice">${icons('info')} В прототипе установка демонстрационная: файлы на диске не изменяются.</div></section>
 <section><div class="section-header"><h2 class="section-title">Содержимое корпоративного файла</h2><button class="text-link" data-copy-agents>${icons('copy')} Копировать</button></div><div class="code-panel"><div class="code-bar"><span>AGENTS.md</span><span>Markdown · readonly</span></div><pre>${escapeHtml(corporateAgents)}</pre></div><p class="subheading" style="margin-top:12px">Claude Code: отдельный CLAUDE.md импортирует основной AGENTS.md, без дублирования правил.</p></section></div>`;}
function promptText(){let type=({implement:'Implement task',review:'Code review',bug:'Investigate bug'})[state.promptType];const task=tasks.find(t=>t.id===state.promptTask)||tasks[0];const selected=docs.filter(d=>state.promptDocs.has(d.id));return `# SAPIR GAME / ${type.toUpperCase()}\n\n## Corporate instructions\nFollow the project's AGENTS.md and the architecture conventions below.\n\n## Task\nID: ${task.id}\nProject: ${task.project}\nTitle: ${task.title}\nDescription: ${task.description}\n\n## Relevant architecture\n${selected.map(d=>`### ${d.title}\n${d.body.join('\n')}`).join('\n\n')||'(No documents selected)'}\n\n## Expected output\n- Explain your proposed changes before implementation.\n- Identify affected components and dependencies.\n- Follow Unity project conventions.\n- Explain how the result should be tested.\n`}
function promptsPage(){return `${heading('AI / PROMPT BUILDER','Prompt Builder','Собирает контекст по шаблону без нейросетевых API. Перед отправкой во внешний сервис проверьте содержимое.',demo())}
<div class="prompt-layout"><section class="card"><h2 class="section-title" style="margin-bottom:22px">Настройка контекста</h2><div class="form-group"><label class="form-label" for="prompt-type">Назначение</label><select class="select" id="prompt-type" style="width:100%"><option value="implement" ${state.promptType==='implement'?'selected':''}>Реализовать задачу</option><option value="review" ${state.promptType==='review'?'selected':''}>Code Review</option><option value="bug" ${state.promptType==='bug'?'selected':''}>Разобрать ошибку</option></select></div><div class="form-group"><label class="form-label" for="prompt-task">Задача ClickUp</label><select class="select" id="prompt-task" style="width:100%">${tasks.map(t=>`<option value="${t.id}" ${state.promptTask===t.id?'selected':''}>${t.id}: ${escapeHtml(t.title)}</option>`).join('')}</select></div><div class="form-group"><span class="form-label">Документация Outline</span>${docs.slice(0,5).map(d=>`<label class="check-row"><input type="checkbox" data-prompt-doc="${d.id}" ${state.promptDocs.has(d.id)?'checked':''}>${escapeHtml(d.title)}</label>`).join('')}</div><div class="notice">${icons('lock')} Проверяйте корпоративные данные, прежде чем вставлять промпт в облачную AI-систему. Hub сам ничего не отправляет.</div></section><section class="card"><div class="section-header"><h2 class="section-title">Готовый промпт</h2><button class="btn btn-primary" data-copy-prompt>${icons('copy')} Скопировать</button></div><pre id="prompt-preview" class="prompt-output">${escapeHtml(promptText())}</pre><p class="subheading" style="margin-top:14px">Вывод формируется обычными шаблонами. Никаких AI-запросов.</p></section></div>`;}
function settingsPage(){return `${heading('SYSTEM / PREFERENCES','Настройки','Подключение существующих корпоративных аккаунтов и локальные параметры Hub.',demo())}<div class="grid-equal"><section class="card"><div class="section-header"><h2 class="section-title">Интеграции</h2>${pill('Не подключено','todo')}</div><div class="settings-list">${[{name:'ClickUp',initial:'CU',cls:'click',desc:'Задачи, статусы и комментарии'},{name:'Outline',initial:'O',cls:'',desc:'Wiki, документы, индекс поиска'},{name:'Slack',initial:'S',cls:'slack',desc:'Новости отдела и сообщения'}].map(s=>`<div class="setting-row"><span class="setting-logo ${s.cls}">${s.initial}</span><div class="setting-body"><strong>${s.name}</strong><p>${s.desc}</p></div><button class="btn btn-quiet btn-small" data-modal="connect">Подключить</button></div>`).join('')}</div></section><section class="card"><h2 class="section-title" style="margin-bottom:18px">Локальное приложение</h2><div class="setting-help"><h3>Обновления программы</h3><p>Проверка новых версий через GitHub Releases. В релизе присутствуют установщик и подписанные updater-файлы.</p><h3>Корпоративные инструкции</h3><p>Отдельная проверка AGENTS.md в Git. Изменение документа не требует нового релиза приложения.</p><h3>Хранение данных</h3><p>SQLite и поисковый индекс находятся локально. Токены корпоративных сервисов должны храниться в защищённом хранилище ОС.</p></div></section></div><div class="card" style="margin-top:18px"><h2 class="section-title" style="margin-bottom:13px">Принципы безопасности</h2><div class="setting-description"><div class="setting-help"><h3>Нет отдельного аккаунта Hub</h3><p>Пользователь подключает ClickUp, Outline и Slack со своими правами. Общие административные ключи запрещены.</p></div><div class="setting-help"><h3>Чтение локальными агентами</h3><p>Экспорт Markdown и AGENTS.md. При добавлении HTTP API нужны ограничения доступа, origin-проверки и защита токенов.</p></div></div></div>`;}
const renderers = {home,tasks:tasksPage,knowledge,news:newsPage,agents:agentsPage,prompts:promptsPage,settings:settingsPage};
const routeScroll = new Map();
function navigate(route, origin){
  if(!Object.hasOwn(renderers,route)||route===state.route)return;
  routeScroll.set(state.route,window.scrollY);
  state.route=route;
  render(Boolean(origin));
  window.scrollTo({top:routeScroll.get(route)||0,behavior:'instant'});
  revealFromDock(byId('page'),origin);
}
let disposePrism = () => {};
function render(fromDock=false){
  disposeGraph();
  disposePrism();
  const page = byId('page');
  page.classList.toggle('route-enter', !fromDock && page.dataset.route !== state.route);
  page.dataset.route = state.route;
  page.innerHTML=renderers[state.route]();
  const graph = page.querySelector('.graph-container');
  disposeGraph = graph ? mountGraph(graph) : () => {};
  const prism = page.querySelector('[data-prism]');
  disposePrism = prism ? mountPrism(prism) : () => {};
  byId('current-location').textContent=pages[state.route];
  document.querySelectorAll('.nav-item[data-route]').forEach(el=>{
    el.classList.toggle('active',el.dataset.route===state.route);
    el.setAttribute('aria-current',el.dataset.route===state.route?'page':'false');
  });
  moveDockMarker();
}
function moveDockMarker(){
  const dock=document.querySelector('.dock');
  const active=dock.querySelector('.nav-item.active');
  if(!active)return;
  dock.style.setProperty('--marker-x',active.offsetLeft+'px');
  dock.style.setProperty('--marker-width',active.offsetWidth+'px');
  dock.style.setProperty('--marker-y',active.offsetTop+'px');
  dock.style.setProperty('--marker-height',active.offsetHeight+'px');
}
const workspaceDock=document.querySelector('.dock');
setupDock(workspaceDock,moveDockMarker);
new ResizeObserver(moveDockMarker).observe(workspaceDock);
function toast(text){const holder=byId('toast');holder.innerHTML=`<div class="toast">${icons('checkcircle')} ${escapeHtml(text)}</div>`;clearTimeout(state.toastId);state.toastId=setTimeout(()=>holder.innerHTML='',2800);}
async function copy(text){try{await navigator.clipboard.writeText(text);toast('Скопировано в буфер обмена');}catch(e){let ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.append(ta);ta.select();try{document.execCommand('copy');toast('Скопировано в буфер обмена');}catch(err){toast('Не удалось скопировать. Откройте в браузере через localhost.');}ta.remove();}}
function docMarkdown(d){return `# ${d.title}\n\n${d.desc}\n\n## Основные положения\n\n${d.body.map(x=>`- ${x}`).join('\n')}\n`}
let overlayTrigger = null;
function activateOverlay(focus){document.querySelector('.app-shell').inert=true;focus.focus({preventScroll:true});}
function modal(html,title='',drawer=false){overlayTrigger = document.activeElement;state.modal=title;byId('overlay-root').innerHTML=`<div class="modal-shade ${drawer?'drawer-shade':''}" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><div class="modal-head"><strong>${escapeHtml(title)}</strong><button class="close" data-close-modal aria-label="Закрыть">${icons('close')}</button></div><div class="modal-content">${html}</div></div></div>`;activateOverlay(byId('overlay-root').querySelector('[data-close-modal]'));}
function closeModal(){
  if (!state.modal && !state.searchOpen) return;
  const shade=byId('overlay-root').firstElementChild;
  state.modal=null;
  state.searchOpen=false;
  if (reduceMotion.matches) shade?.remove();
  else if (shade) {
    shade.inert=true;
    shade.setAttribute('aria-hidden','true');
    shade.classList.add('exiting');
    setTimeout(()=>shade.remove(),240);
  }
  document.querySelector('.app-shell').inert=false;
  if (overlayTrigger?.isConnected) overlayTrigger.focus({preventScroll:true});
  overlayTrigger=null;
}
function taskModal(id){const t=tasks.find(x=>x.id===id);if(!t)return;modal(`<div class="flex" style="justify-content:space-between">${pill(t.project,'todo')}${taskBadge(t.status)}</div><h3>${escapeHtml(t.title)}</h3><p style="color:#8999ae;font-size:11px">${t.id} · ${priorityName[t.priority]} приоритет</p><div class="divider"></div><strong>Описание</strong><p>${escapeHtml(t.description)}</p><strong>Связанные документы</strong><div class="tag-list" style="margin:13px 0 20px">${t.docs.map(id=>`<button class="btn btn-small btn-quiet" data-modal-doc="${id}">${escapeHtml(docs.find(d=>d.id===id)?.title||id)}</button>`).join('')}</div><div class="notice">${icons('info')} Пример задачи. Изменения в ClickUp и переходы к реальным задачам появятся после интеграции.</div><div class="flex" style="margin-top:18px"><button class="btn btn-primary" data-to-prompt="${t.id}">${icons('wand')} Подготовить промпт</button><button class="btn btn-quiet" data-copy-task="${t.id}">${icons('copy')} Копировать описание</button></div>`,'Задача · '+t.id,true);}
function showDiff(){modal(`<p>В рабочей версии это будет diff конкретных Git-коммитов. Ниже пример содержимого изменений.</p><div class="diff"><span class="del">- Prefer implicit service lookup.</span>\n<span class="add">+ Register scene dependencies explicitly in LifetimeScope.</span>\n<span class="add">+ Use typed MessagePipe events with payload DTOs.</span>\n<span class="add">+ Validate each feature against its acceptance criteria.</span></div><div class="flex" style="margin-top:18px"><button class="btn btn-primary" data-update-agents>${icons('download')} Обновить демо-версию</button><button class="btn btn-quiet" data-close-modal>Закрыть</button></div>`,'Обновление AGENTS.md · v1.3 → v1.4');}
function bugModal(){modal(`<p>В настоящем приложении эта кнопка откроет личный диалог с руководителем разработки в Slack. Для этого потребуется настроить <span class="inline-code">team ID</span> и <span class="inline-code">user ID</span>.</p><div class="notice">${icons('info')} В прототип не встроена выдуманная ссылка на личный аккаунт. Используйте корпоративную ссылку при интеграции.</div><div class="flex" style="margin-top:20px"><button class="btn btn-primary" data-copy-bug>${icons('copy')} Скопировать шаблон сообщения</button><button class="btn btn-quiet" data-close-modal>Закрыть</button></div>`,'Нашли проблему или баг?');}
function openSearch(){if (!state.searchOpen && !state.modal) overlayTrigger=document.activeElement; state.searchOpen=true;state.searchQuery='';byId('overlay-root').innerHTML=`<div class="modal-shade" role="presentation"><div class="modal search-dialog" role="dialog" aria-modal="true" aria-label="Глобальный поиск"><div class="search-field">${icons('search','big')}<input id="global-search-input" autocomplete="off" placeholder="Поиск по задачам, документам, разделам..." aria-label="Глобальный поиск"><kbd style="color:#8193aa;font-size:11px">ESC</kbd></div><div class="search-results" id="global-search-results"></div><div class="modal-footer" style="justify-content:space-between"><span class="kicker">Enter: открыть · Esc: закрыть</span><span class="kicker">Демо · локальный поиск</span></div></div></div>`;searchResults();activateOverlay(byId('global-search-input'));}
function searchResults(){const q=state.searchQuery.toLowerCase(),all=[...Object.entries(pages).map(([id,title])=>({type:'Раздел',title,route:id,icon:'home'})),...docs.map(d=>({type:'Документ',title:d.title,route:'knowledge',doc:d.id,icon:'file'})),...tasks.map(t=>({type:'Задача',title:`${t.id} · ${t.title}`,task:t.id,icon:'checksquare'}))];const matches=all.filter(x=>(x.title+' '+x.type).toLowerCase().includes(q)).slice(0,12);const root=byId('global-search-results');if(!root)return;root.innerHTML=matches.length?matches.map(x=>`<button class="search-result" ${x.task?`data-task="${x.task}"`:x.doc?`data-search-doc="${x.doc}"`:`data-route="${x.route}"`}>${icons(x.icon)}<span>${escapeHtml(x.title)}</span><small>${x.type}</small>${icons('chevron')}</button>`).join(''):'<div class="empty">Ничего не найдено</div>';}
function handleClick(e){const target=e.target.closest('[data-show-graph],[data-route],[data-task],[data-filter],[data-doc],[data-mode],[data-modal],[data-close-modal],[data-search-doc],[data-modal-doc],[data-to-prompt],[data-copy-task],[data-copy-doc],[data-copy-agents],[data-copy-prompt],[data-update-agents],[data-project-install],[data-copy-bug]');if(!target){if(e.target.classList?.contains('modal-shade'))closeModal();return;}
  if(target.dataset.closeModal!==undefined){closeModal();return;}
  if(target.dataset.task){closeModal();taskModal(target.dataset.task);return;}
  if(target.dataset.searchDoc){state.activeDoc=target.dataset.searchDoc;state.knowledgeMode='read';closeModal();navigate('knowledge');return;}
  if(target.dataset.doc){state.activeDoc=target.dataset.doc;state.knowledgeMode='read';render();return;}
  if(target.dataset.modalDoc){state.activeDoc=target.dataset.modalDoc;closeModal();navigate('knowledge');return;}
  if(target.hasAttribute('data-show-graph')){state.knowledgeMode='graph';navigate('knowledge');window.scrollTo({top:0,behavior:'instant'});return;}
  if(target.dataset.route){closeModal();navigate(target.dataset.route,target.closest('.dock')?target.getBoundingClientRect():null);return;}
  if(target.dataset.filter){state.taskFilter=target.dataset.filter;render();return;}
  if(target.dataset.mode){state.knowledgeMode=target.dataset.mode;render();return;}
  if(target.dataset.modal){if(target.dataset.modal==='diff')showDiff();else if(target.dataset.modal==='connect')modal('<p>Подключение сервисов будет реализовано через персональные разрешения ClickUp, Outline и Slack. Этот прототип не запрашивает и не хранит токены.</p>','Подключить сервис');else modal('<p>В полноценном Hub здесь будет системный диалог выбора папки Unity-проекта и настройка установки AGENTS.md.</p>','Добавление проекта');return;}
  if(target.dataset.copyTask){const t=tasks.find(x=>x.id===target.dataset.copyTask);copy(`${t.id}: ${t.title}\n${t.description}`);return;}
  if(target.dataset.toPrompt){state.promptTask=target.dataset.toPrompt;closeModal();navigate('prompts');return;}
  if(target.dataset.copyDoc){const d=docs.find(x=>x.id===target.dataset.copyDoc);copy(docMarkdown(d));return;}
  if(target.dataset.copyAgents!==undefined){copy(corporateAgents);return;}
  if(target.dataset.copyPrompt!==undefined){copy(promptText());return;}
  if(target.dataset.copyBug!==undefined){copy('Раздел: \nЧто произошло: \nКак воспроизвести: \nОжидаемый результат: \nВерсия Hub: ');return;}
  if(target.dataset.updateAgents!==undefined){state.agentVersion=state.agentLatest;state.projects.forEach(p=>p.version=state.agentLatest);closeModal();navigate('agents');toast('Демо обновлено. Файлы на компьютере не изменились.');return;}
  if(target.dataset.projectInstall!==undefined){state.projects[Number(target.dataset.projectInstall)].version=state.agentLatest;render();toast('Демо установки выполнено. Файлы на компьютере не изменились.');return;}
}
document.addEventListener('click',handleClick);
document.addEventListener('click',e=>{if(e.target.closest('#open-search'))openSearch();if(e.target.closest('#report-bug'))bugModal();if(e.target.closest('#brand-home'))navigate('home');});
document.addEventListener('input',e=>{if(e.target.id==='task-search'){const caret=e.target.selectionStart;state.taskQuery=e.target.value;render();const el=byId('task-search');el.focus();el.setSelectionRange(caret,caret);}else if(e.target.id==='doc-search'){const caret=e.target.selectionStart;state.docQuery=e.target.value;render();const el=byId('doc-search');el.focus();el.setSelectionRange(caret,caret);}else if(e.target.id==='global-search-input'){state.searchQuery=e.target.value;searchResults();}});
document.addEventListener('change',e=>{if(e.target.id==='prompt-type'){state.promptType=e.target.value;render();}else if(e.target.id==='prompt-task'){state.promptTask=e.target.value;render();}else if(e.target.dataset.promptDoc){e.target.checked?state.promptDocs.add(e.target.dataset.promptDoc):state.promptDocs.delete(e.target.dataset.promptDoc);render();}});
function handleOverlayKeys(event){
  if (!state.modal && !state.searchOpen) return false;
  const root=byId('overlay-root');
  if (event.key==='Tab'){
    const controls=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
    const first=controls[0],last=controls.at(-1);
    if (event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();return true;}
    if (!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();return true;}
  }
  if (state.searchOpen && ['ArrowUp','ArrowDown'].includes(event.key)){
    const results=[...root.querySelectorAll('.search-result')];
    if (!results.length) return false;
    const selected=results.indexOf(document.activeElement);
    const delta=event.key==='ArrowDown'?1:-1;
    const next=selected<0?(delta>0?0:results.length-1):(selected+delta+results.length)%results.length;
    event.preventDefault();results[next].focus();return true;
  }
  return false;
}
document.addEventListener('keydown',e=>{if(byId('welcome').open)return;if(handleOverlayKeys(e))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}if(e.key==='Escape'){closeModal();}if(e.key==='Enter'&&e.target.closest('[data-task][role="button"]'))taskModal(e.target.dataset.task);if(e.key==='Enter'&&state.searchOpen&&e.target.id==='global-search-input'){const first=byId('global-search-results')?.querySelector('.search-result');first?.click();}});
document.addEventListener('pointermove',event=>{
  if(reduceMotion.matches||event.pointerType!=='mouse')return;
  const card=event.target.closest('.card[data-route]');
  if(!card)return;
  const rect=card.getBoundingClientRect();
  card.style.setProperty('--glow-x',event.clientX-rect.left+'px');
  card.style.setProperty('--glow-y',event.clientY-rect.top+'px');
});
render();
setupWelcome();
