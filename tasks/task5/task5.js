(function () {
  const medicines = [
    { id: 'cuddle', emoji: '💕', name: 'Cuddle Therapy', type: 'good', effect: 'love', scheduleConfig: { mode: 'duration', values: [2, 3, 5], unit: 'minutes', fixedMoment: 'Whenever needed', fixedPrompt: 'A cozy cuddle break, whenever it feels right' } },
    { id: 'forehead-kiss', emoji: '😘', name: 'Forehead Kisses', type: 'good', effect: 'kiss', scheduleConfig: { mode: 'kisses', values: [1, 2, 3], moments: [{ id: 'before-work', label: 'Before going to work' }, { id: 'after-work', label: 'After returning from work' }] } },
    { id: 'cheek-kiss', emoji: '💋', name: 'Cheek Kisses', type: 'good', effect: 'kiss', scheduleConfig: { mode: 'kisses', values: [1, 2, 3], moments: [{ id: 'wake', label: 'After waking up' }, { id: 'before-sleep', label: 'Before going to sleep' }] } },
    { id: 'hand-holding', emoji: '🤝', name: 'Hand Holding', type: 'good', effect: 'hug', scheduleConfig: { mode: 'fixed', fixedMoment: 'Whenever needed', fixedPrompt: 'A hand to hold whenever you need one' } },
    { id: 'unconditional-love', emoji: '💖', name: 'Unconditional Love', type: 'good', effect: 'love', scheduleConfig: { mode: 'fixed', fixedMoment: 'Always', fixedPrompt: 'A forever promise, for every kind of day' } },
    { id: 'hiding-feelings', emoji: '🤐', name: 'Hiding Feelings', type: 'naughty' },
    { id: 'scolding', emoji: '😤', name: 'Scolding', type: 'naughty' },
    { id: 'not-talking', emoji: '🙊', name: 'Not Talking', type: 'naughty' },
    { id: 'angry-face', emoji: '😠', name: 'Angry Face', type: 'naughty' }
  ];
  const diagnosticSteps = [
    'Analyzing heartbeat...',
    'Detecting unusual patterns...',
    'Checking romantic activity...',
    'Identifying root cause...',
    'Finalizing diagnosis...'
  ];
  window.startHeartClinicMission = function (host, options = {}) {
    const messageConfig = options.config?.messages || {};
    const dialogue = messageConfig.consultation;
    const prescribed = new Set();
    const chatHistory = [];
    let dialogueIndex = 0, timer = 0, closed = false;
    const root = document.createElement('main'); root.className = 'clinic-shell';
    root.setAttribute('aria-label', 'Task 5: The Love Clinic');
    host.replaceChildren(root);
    function clearTimer() { if (timer) { clearTimeout(timer); timer = 0 } }
    function frame(step, title) {
      root.replaceChildren(); root.className = 'clinic-shell';
      const header = document.createElement('header'); header.className = 'clinic-header';
      const back = document.createElement('button'); back.type = 'button'; back.className = 'clinic-back'; back.textContent = '← Garden';
      back.addEventListener('click', () => { closed = true; clearTimer(); options.onBack?.() });
      const stepText = document.createElement('span'); stepText.className = 'clinic-step'; stepText.textContent = step;
      header.append(back, stepText);
      const heading = document.createElement('h1'); heading.className = 'clinic-title'; heading.textContent = title;
      root.append(header, heading);
      return root;
    }
    function action(label, handler, className = 'clinic-action') {
      const button = document.createElement('button'); button.type = 'button'; button.className = className; button.textContent = label; button.addEventListener('click', handler); return button;
    }
    function appendChatMessage(messages, line) {
      const row = document.createElement('div'); row.className = `clinic-message-row ${line.speaker === 'doctor' ? 'from-doctor' : 'from-patient'}`;
      const avatar = document.createElement('span'); avatar.className = `clinic-chat-avatar ${line.speaker === 'doctor' ? 'clinic-chat-avatar-doctor' : 'clinic-chat-avatar-patient'}`; avatar.setAttribute('aria-hidden', 'true'); avatar.textContent = messageConfig.avatars[line.speaker];
      const bubble = document.createElement('article'); bubble.className = 'clinic-message-bubble';
      const who = document.createElement('strong'); who.textContent = messageConfig.speakers[line.speaker];
      const words = document.createElement('p'); words.textContent = line.text;
      bubble.append(who, words);
      if (line.speaker === 'doctor') row.append(bubble, avatar); else row.append(avatar, bubble);
      messages.append(row); messages.scrollTop = messages.scrollHeight;
    }
    function showAdmission() {
      frame('EMERGENCY ADMISSION', 'The Love Clinic 🏥');
      const card = document.createElement('section'); card.className = 'clinic-admission clinic-card';
      const siren = document.createElement('div'); siren.className = 'clinic-siren'; siren.textContent = '🚨';
      const roleplay = document.createElement('p'); roleplay.className = 'clinic-roleplay-note'; roleplay.textContent = 'This is a role-play game—you’re in the hospital now. 🏥';
      const alert = document.createElement('h2'); alert.className = 'clinic-alert'; alert.textContent = 'EMERGENCY CASE DETECTED';
      const details = document.createElement('dl'); details.className = 'clinic-case';
      [['Patient', 'Arshad Suraj'], ['Department', 'Cardiology ❤️'], ['Condition', 'Unknown'], ['Severity', 'Extremely Serious'], ['Emergency Contact', 'Afrin']].forEach(([term, value]) => {
        const row = document.createElement('div'); row.className = 'clinic-case-row'; const dt = document.createElement('dt'); dt.textContent = term; const dd = document.createElement('dd'); dd.textContent = value; row.append(dt, dd); details.append(row);
      });
      const warning = document.createElement('p'); warning.className = 'clinic-warning'; warning.textContent = '⚠️ Warning: Patient refuses treatment from any other doctor!';
      card.append(siren, alert, details, warning, action('Admit Patient 🏥', showConsultation)); root.append(roleplay, card);
    }
    function showConsultation() {
      frame('CONSULTATION · CARDIOLOGY', 'Arshad’s consultation');
      const scene = document.createElement('section'); scene.className = 'clinic-chat clinic-card';
      const contact = document.createElement('div'); contact.className = 'clinic-chat-contact';
      contact.innerHTML = `<span class="clinic-chat-avatar clinic-chat-avatar-patient" aria-hidden="true"></span><span class="clinic-chat-contact-copy"><b></b><small><i></i></small></span><span class="clinic-chat-secure"></span>`;
      contact.querySelector('.clinic-chat-avatar').textContent = messageConfig.contact.avatar;
      contact.querySelector('.clinic-chat-contact-copy b').textContent = messageConfig.contact.name;
      contact.querySelector('.clinic-chat-contact-copy small').append(document.createTextNode(` ${messageConfig.contact.status}`));
      contact.querySelector('.clinic-chat-secure').textContent = messageConfig.contact.secureLabel;
      const messages = document.createElement('div'); messages.className = 'clinic-chat-stack'; messages.setAttribute('role', 'log'); messages.setAttribute('aria-live', 'polite');
      const next = action(messageConfig.buttons.next, advanceDialogue); next.className = 'clinic-action clinic-next';
      scene.append(contact, messages, next); root.append(scene);
      function appendDialogue() {
        const line = dialogue[dialogueIndex++];
        chatHistory.push(line);
        appendChatMessage(messages, line);
        next.textContent = dialogueIndex === dialogue.length ? messageConfig.buttons.review : messageConfig.buttons.next;
      }
      function advanceDialogue() {
        if (dialogueIndex < dialogue.length) appendDialogue();
        else showObservations();
      }
      appendDialogue();
    }
    function showObservations() {
      frame('CLINICAL REVIEW · CARDIOLOGY', 'Doctor’s observations');
      const report = document.createElement('section'); report.className = 'clinic-observation-report clinic-card';
      const header = document.createElement('div'); header.className = 'clinic-observation-header';
      header.innerHTML = '<span aria-hidden="true">✚</span><div><b>CLINICAL OBSERVATIONS</b><small>Physician review · Arshad Suraj</small></div><span class="clinic-observation-stamp">CONFIDENTIAL</span>';
      const list = document.createElement('div'); list.className = 'clinic-observation-list';
      dialogue.filter(line => line.observation).forEach((line, index) => {
        const item = document.createElement('article'); item.className = 'clinic-observation-item';
        const number = document.createElement('span'); number.className = 'clinic-observation-number'; number.textContent = `0${index + 1}`;
        const detail = document.createElement('div'); detail.className = 'clinic-observation-detail';
        const symptom = document.createElement('small'); symptom.textContent = 'PATIENT REPORT';
        const words = document.createElement('p'); words.textContent = line.text;
        const finding = document.createElement('strong'); finding.textContent = line.observation;
        detail.append(symptom, words, finding); item.append(number, detail); list.append(item);
      });
      const stamp = document.createElement('p'); stamp.className = 'clinic-observation-doctor'; stamp.textContent = 'Dr. Afrin';
      report.append(header, list, stamp, action('Next →', showTestIntro)); root.append(report);
    }
    function showTestIntro() {
      frame('DIAGNOSTIC EXAMINATION', 'Let’s run a few tests');
      const card = document.createElement('section'); card.className = 'clinic-card clinic-test-intro';
      const message = document.createElement('p'); message.textContent = 'These symptoms are quite unusual. I need to run a few tests before making a diagnosis.';
      card.append(makeMonitor(false), action('Run Diagnostics', runDiagnostics)); root.append(message, card);
    }
    function makeMonitor(normal) {
      const monitor = document.createElement('div'); monitor.className = `clinic-monitor${normal ? ' is-normal' : ''}`;
      monitor.setAttribute('aria-label', normal ? 'Normal heartbeat' : 'Heartbeat monitor');
      const label = document.createElement('span'); label.textContent = normal ? 'HEARTBEAT · NORMAL' : 'ECG · LIVE';
      const wave = document.createElement('div'); wave.className = 'clinic-wave';
      const path = normal ? 'M0 48 H52 Q60 35 68 48 T84 48 H145 Q153 35 161 48 T177 48 H238 Q246 35 254 48 T270 48 H331 Q339 35 347 48 T363 48 H424 Q432 35 440 48 T456 48 H500' : 'M0 48 H95 L111 47 L122 50 L135 48 L147 48 L158 48 L170 45 L180 51 L194 48 L207 48 L220 46 L232 50 L245 48 L258 48 L273 44 L283 52 L296 48 L309 48 L321 47 L333 49 L346 48 L360 48 L372 23 L380 73 L391 8 L402 64 L414 48 H500';
      wave.innerHTML = `<svg viewBox="0 0 500 90" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" /></svg>`;
      monitor.append(label, wave); return monitor;
    }
    function runDiagnostics() {
      frame('DIAGNOSTICS IN PROGRESS', 'Checking Arshad’s heart');
      const card = document.createElement('section'); card.className = 'clinic-card clinic-diagnostics';
      card.append(makeMonitor(false));
      const heart = document.createElement('div'); heart.className = 'clinic-scan-heart'; heart.innerHTML = '<span>♥</span><i></i>'; card.append(heart);
      const status = document.createElement('p'); status.className = 'clinic-diagnostic-status'; status.setAttribute('aria-live', 'polite');
      const progress = document.createElement('div'); progress.className = 'clinic-progress'; const bar = document.createElement('i'); progress.append(bar);
      card.append(status, progress); root.append(card);
      let index = 0;
      function advance() {
        if (closed || !host.contains(root)) return;
        status.textContent = diagnosticSteps[index]; bar.style.width = `${((index + 1) / diagnosticSteps.length) * 100}%`; index++;
        if (index < diagnosticSteps.length) timer = setTimeout(advance, 850);
        else timer = setTimeout(showReport, 900);
      }
      advance();
    }
    function showReport() {
      frame('DIAGNOSIS COMPLETE', 'Medical diagnostic report');
      const report = document.createElement('section'); report.className = 'clinic-report clinic-card';
      report.innerHTML = '<p class="clinic-report-label">MEDICAL DIAGNOSTIC REPORT</p><p class="clinic-report-patient"><b>Patient:</b> Arshad Suraj</p><p class="clinic-primary-label">PRIMARY DIAGNOSIS</p><h2 class="clinic-diagnosis">AFRINITIS MAXIMA</h2><p class="clinic-diagnosis-copy">Severe Afrin-Associated Romantic Syndrome.</p><h3>Clinical findings</h3><ul class="clinic-findings"><li>Recurrent Romantic Euphoria <b>Detected</b></li><li>Afrin Notification Dependency <b>Severe</b></li><li>Acute Hug Deficiency <b>Critical</b></li><li>Chronic Romantic Attachment <b>Confirmed</b></li></ul><div class="clinic-report-grid"><p><b>Severity</b><span>Extremely High</span></p><p><b>Prognosis</b><span>No known cure.</span></p></div><p class="clinic-treatment"><b>Recommended treatment:</b> Continuous exposure to Afrin’s love.</p><p class="clinic-signature">Reported and approved by Dr. Afrin 🩺</p>';
      report.append(action('Back to Patient →', showPrescriptionIntro)); root.append(report);
    }
    function showPrescriptionIntro() {
      frame('TREATMENT PLAN · CHAT CONTINUES', 'A message from Dr. Afrin');
      const scene = document.createElement('section'); scene.className = 'clinic-chat clinic-card';
      const contact = document.createElement('div'); contact.className = 'clinic-chat-contact';
      contact.innerHTML = `<span class="clinic-chat-avatar clinic-chat-avatar-patient" aria-hidden="true"></span><span class="clinic-chat-contact-copy"><b></b><small><i></i></small></span><span class="clinic-chat-secure"></span>`;
      contact.querySelector('.clinic-chat-avatar').textContent = messageConfig.contact.avatar;
      contact.querySelector('.clinic-chat-contact-copy b').textContent = messageConfig.contact.name;
      contact.querySelector('.clinic-chat-contact-copy small').append(document.createTextNode(` ${messageConfig.contact.status}`));
      contact.querySelector('.clinic-chat-secure').textContent = messageConfig.contact.secureLabel;
      const messages = document.createElement('div'); messages.className = 'clinic-chat-stack'; messages.setAttribute('role', 'log'); messages.setAttribute('aria-live', 'polite');
      chatHistory.forEach(line => appendChatMessage(messages, line));
      const treatmentMessages = messageConfig.treatment;
      let messageIndex = 0;
      const next = action(messageConfig.buttons.next, advanceTreatmentChat); next.className = 'clinic-action clinic-next';
      scene.append(contact, messages, next); root.append(scene);
      messages.scrollTop = messages.scrollHeight;
      function advanceTreatmentChat() {
        if (messageIndex >= treatmentMessages.length) { showMedicines(); return }
        const line = treatmentMessages[messageIndex++]; chatHistory.push(line); appendChatMessage(messages, line);
        next.textContent = messageIndex === treatmentMessages.length ? messageConfig.buttons.prescription : messageConfig.buttons.next;
      }
    }
    function showMedicines() {
      frame('PRESCRIPTION', 'Choose Arshad’s treatment');
      const goodMedicineCount = medicines.filter(medicine => medicine.type === 'good').length;
      const intro = document.createElement('p'); intro.className = 'clinic-medicine-intro'; intro.textContent = 'Prescribe some medicine for Arshad.'; root.append(intro);
      const grid = document.createElement('div'); grid.className = 'clinic-medicine-grid';
      const summary = document.createElement('section'); summary.className = 'clinic-summary clinic-card';
      const summaryTitle = document.createElement('h2'); summaryTitle.textContent = 'Prescription summary'; const list = document.createElement('ul'); list.className = 'clinic-prescribed-list';
      const feedback = document.createElement('p'); feedback.className = 'clinic-feedback'; feedback.setAttribute('aria-live', 'polite');
      const next = action('Continue', showTreatmentSuccess); next.disabled = prescribed.size < goodMedicineCount;
      summary.append(summaryTitle, list, feedback, next); root.append(grid, summary);
      function updateSummary() {
        list.replaceChildren();
        medicines.filter(medicine => prescribed.has(medicine.id)).forEach(medicine => {
          const item = document.createElement('li'); item.innerHTML = `<span>${medicine.emoji} <b></b></span><span></span>`;
          item.querySelector('b').textContent = medicine.name;
          item.lastChild.textContent = medicine.scheduleText || '';
          list.append(item);
        });
        next.disabled = prescribed.size < goodMedicineCount;
        if (prescribed.size === goodMedicineCount) feedback.textContent = 'All his love-filled treatments are prescribed and ready! 💊';
      }
      function openSchedule(medicine, card, state) {
        const overlay = document.createElement('div'); overlay.className = 'clinic-prescription-modal';
        overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-labelledby', 'clinic-schedule-title');
        const panel = document.createElement('section'); panel.className = 'clinic-schedule-card clinic-card';
        const header = document.createElement('header'); header.className = 'clinic-schedule-header';
        const icon = document.createElement('span'); icon.className = 'clinic-schedule-icon'; icon.textContent = medicine.emoji;
        const heading = document.createElement('div'); const title = document.createElement('h2'); title.id = 'clinic-schedule-title'; title.textContent = medicine.name;
        const config = medicine.scheduleConfig, current = medicine.schedule || {};
        const subtitle = document.createElement('p'); subtitle.textContent = config.mode === 'kisses' ? 'A little kiss, right on schedule' : config.mode === 'duration' ? 'Pick a cozy cuddle length' : 'A standing love prescription'; heading.append(title, subtitle); header.append(icon, heading);
        let quantityChoices = null, momentChoices = null, fixedConsent = null;
        if (config.values) {
          const quantity = document.createElement('fieldset'); quantity.className = 'clinic-frequency';
          const legend = document.createElement('legend'); legend.textContent = config.mode === 'kisses' ? 'How many kisses?' : 'Choose cuddle time';
          quantityChoices = document.createElement('div'); quantityChoices.className = 'clinic-frequency-choices';
          config.values.forEach(value => {
            const label = document.createElement('label'); label.className = 'clinic-frequency-choice';
            const input = document.createElement('input'); input.type = 'radio'; input.name = `schedule-value-${medicine.id}`; input.value = String(value); input.checked = (current.value ?? config.values[0]) === value;
            const text = document.createElement('span'); text.textContent = config.mode === 'kisses' ? `${value} ${value === 1 ? 'kiss' : 'kisses'}` : `${value} ${config.unit}`;
            label.append(input, text); quantityChoices.append(label);
          });
          quantity.append(legend, quantityChoices); panel.append(header, quantity);
        } else panel.append(header);
        if (config.moments) {
          const moments = document.createElement('fieldset'); moments.className = 'clinic-moments';
          const legend = document.createElement('legend'); legend.textContent = 'When should the kisses happen?';
          const hint = document.createElement('small'); hint.className = 'clinic-moments-hint'; hint.textContent = 'Choose one or both moments';
          momentChoices = document.createElement('div'); momentChoices.className = 'clinic-moment-choices';
          config.moments.forEach(moment => {
            const label = document.createElement('label'); label.className = 'clinic-moment-choice';
            const input = document.createElement('input'); input.type = 'checkbox'; input.value = moment.id; input.checked = (current.moments || [config.moments[0].id]).includes(moment.id);
            const text = document.createElement('span'); text.textContent = moment.label;
            label.append(input, text); momentChoices.append(label);
          });
          moments.append(legend, hint, momentChoices); panel.append(moments);
        } else {
          const fixed = document.createElement('div'); fixed.className = 'clinic-schedule-fixed';
          const prompt = document.createElement('small'); prompt.textContent = config.fixedPrompt || 'Choose this option to include it in the prescription';
          const label = document.createElement('label'); label.className = 'clinic-fixed-option';
          fixedConsent = document.createElement('input'); fixedConsent.type = 'checkbox'; fixedConsent.checked = current.confirmed === true;
          const value = document.createElement('strong'); value.textContent = config.fixedMoment;
          label.append(fixedConsent, value); fixed.append(prompt, label); panel.append(fixed);
        }
        const validation = document.createElement('p'); validation.className = 'clinic-schedule-validation'; validation.setAttribute('aria-live', 'polite');
        const actions = document.createElement('div'); actions.className = 'clinic-schedule-actions';
        const cancel = action('Cancel', () => overlay.remove(), 'clinic-schedule-cancel');
        const save = action(medicine.schedule ? 'Update prescription' : 'Add to prescription', saveSchedule, 'clinic-action clinic-schedule-save');
        if (fixedConsent) {
          save.disabled = !fixedConsent.checked;
          fixedConsent.addEventListener('change', () => { save.disabled = !fixedConsent.checked });
        }
        actions.append(cancel, save); panel.append(validation, actions); overlay.append(panel);
        overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove() });
        function saveSchedule() {
          if (fixedConsent && !fixedConsent.checked) {
            validation.textContent = 'Please check this option before adding it to the prescription.';
            return;
          }
          if (config.mode === 'kisses') {
            const selectedMoments = [...momentChoices.querySelectorAll('input:checked')].map(input => input.value);
            if (!selectedMoments.length) { validation.textContent = 'Choose at least one kiss moment.'; return }
            const value = Number(quantityChoices.querySelector('input:checked')?.value) || config.values[0];
            const labels = selectedMoments.map(id => config.moments.find(moment => moment.id === id).label);
            medicine.schedule = { mode: config.mode, value, moments: selectedMoments };
            medicine.scheduleText = `${value} ${value === 1 ? 'kiss' : 'kisses'} · ${labels.join(', ')}`;
          } else if (config.mode === 'duration') {
            const value = Number(quantityChoices.querySelector('input:checked')?.value) || config.values[0];
            medicine.schedule = { mode: config.mode, value, confirmed: true };
            medicine.scheduleText = `${value} minutes · ${config.fixedMoment}`;
          } else {
            medicine.schedule = { mode: config.mode, confirmed: true };
            medicine.scheduleText = config.fixedMoment;
          }
          prescribed.add(medicine.id); card.classList.add('is-prescribed'); state.textContent = '✓ Prescribed';
          card.classList.add(`clinic-effect-${medicine.effect}`); feedback.textContent = `${medicine.name} added with love!`;
          overlay.remove(); updateSummary(); setTimeout(() => card.classList.remove(`clinic-effect-${medicine.effect}`), 1100);
        }
        root.append(overlay); (fixedConsent && !fixedConsent.checked ? fixedConsent : save).focus();
      }
      let dodgeCount = 0;
      medicines.forEach(medicine => {
        const card = document.createElement('button'); card.type = 'button'; card.className = `clinic-medicine${medicine.type === 'naughty' ? ' is-naughty' : ''}`;
        const bottle = document.createElement('span'); bottle.className = 'clinic-bottle'; bottle.textContent = medicine.emoji;
        const name = document.createElement('strong'); name.textContent = medicine.name;
        const dose = document.createElement('small'); dose.textContent = medicine.type === 'good' ? 'Choose schedule' : ''; dose.hidden = medicine.type === 'naughty';
        const state = document.createElement('span'); state.className = 'clinic-medicine-state';
        card.append(bottle, name, dose, state);
        if (medicine.type === 'good') {
          card.addEventListener('click', () => openSchedule(medicine, card, state));
        } else {
          const dodge = () => {
            const siblings = [...grid.children], currentIndex = siblings.indexOf(card), targetIndex = (currentIndex + 2 + (dodgeCount++ % 2)) % siblings.length, target = siblings[targetIndex];
            const before = card.getBoundingClientRect();
            if (target && target !== card) grid.insertBefore(card, target);
            const after = card.getBoundingClientRect(), dx = before.left - after.left, dy = before.top - after.top;
            if (typeof card.animate === 'function') card.animate([{ transform: `translate(${dx}px,${dy}px) scale(.96)` }, { transform: 'translate(0,0) scale(1)' }], { duration: 320, easing: 'cubic-bezier(.22,.8,.3,1)' });
            feedback.textContent = 'Hey Doctor! Why are you trying to hurt your patient? 😂';
          };
          card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') dodge() }); card.addEventListener('click', dodge);
        }
        grid.append(card);
      });
      updateSummary();
    }
    function showTreatmentSuccess() {
      frame('TREATMENT COMPLETE', 'Prescribed successfully!!');
      const card = document.createElement('section'); card.className = 'clinic-success clinic-card';
      card.innerHTML = '<div class="clinic-success-hearts" aria-hidden="true">🫂 💋 🤝 💖</div><p>From today on, Arshad will get his prescribed treatments from his wife, without missing a dose and right on time. 🥰💊🫂💋🤝💖</p>';
      card.append(action('Discharge patient ❤️', completeMission)); root.append(card);
    }
    function completeMission() {
      if (closed || prescribed.size < medicines.filter(medicine => medicine.type === 'good').length) return;
      closed = true;
      options.onComplete?.({
        taskName: options.config?.name || 'The Love Clinic'
      });
    }
    showAdmission();
  };
})();
