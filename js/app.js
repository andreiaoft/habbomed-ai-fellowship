// Controlador do simulador de auditoria clínica.

class MedAuditPlatform {
  constructor() {
    this.cases = [...window.CLINICAL_CASES];
    this.currentCaseIndex = 0;
    this.activeWingFilter = "all";

    // Estado do atendimento atual
    this.askedQuestions = new Set();
    this.aiOpinionGenerated = false;
    this.annotations = {}; // { [segId]: { status: 'correct'|'omission'|'hallucination', category: string, note: string } }
    this.finalVerdict = null; // 'approve' | 'reject'
    this.evaluationResult = null;
    this.caseStartTime = Date.now();

    // Métricas acumuladas do aluno e logs para a dissertação de mestrado
    this.researchLogs = this._loadSavedLogs();
    this.completedCaseIds = new Set(this.researchLogs.map((record) => record.caseId));

    this.isoRoom = null;
    this.init();
  }

  _loadSavedLogs() {
    try {
      const records = JSON.parse(localStorage.getItem("auditoria_clinica_fellowship_v1") || "[]");
      return Array.isArray(records) ? records.filter((record) => record && this.cases.some((c) => c.id === record.caseId) && Number.isFinite(record.spanAccuracy) && Number.isFinite(record.elapsedSeconds)) : [];
    } catch (e) {
      return [];
    }
  }

  _saveLogs() {
    try {
      localStorage.setItem("auditoria_clinica_fellowship_v1", JSON.stringify(this.researchLogs));
    } catch (e) {
      // ignore storage quota errors
    }
  }

  init() {
    // Inicializar motor isométrico no Canvas
    this.isoRoom = new window.IsometricHospitalRoom("isoCanvas", (obj) => {
      this.handleIsoObjectClick(obj);
    });

    this.bindUIEvents();
    this.renderCaseSelector();
    this.loadCase(0);
    this.updateTopHUD();
  }

  bindUIEvents() {
    // Filtro de Alas do Hospital ("Mapa de Alas")
    document.querySelectorAll("[data-wing-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-wing-filter]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeWingFilter = btn.getAttribute("data-wing-filter");
        this.renderCaseSelector();

        // Se o caso atual não pertence à ala filtrada, carrega o primeiro da ala
        if (this.activeWingFilter !== "all") {
          const firstIdx = this.cases.findIndex((c) => c.wing === this.activeWingFilter);
          if (firstIdx !== -1) this.loadCase(firstIdx);
        }
      });
    });

    // Botão de Gerar Parecer da IA
    const btnGenAI = document.getElementById("btnGenerateAIOpinion");
    if (btnGenAI) {
      btnGenAI.addEventListener("click", () => this.unlockAIOpinion());
    }

    // Botões de Veredito Final do Aluno
    document.querySelectorAll("[data-verdict-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-verdict-choice]").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        this.finalVerdict = btn.getAttribute("data-verdict-choice");
      });
    });

    // Submeter Auditoria (Data Annotation)
    const btnSubmit = document.getElementById("btnSubmitAudit");
    if (btnSubmit) {
      btnSubmit.addEventListener("click", () => this.submitAudit());
    }

    // Próximo Caso Clínico
    const btnNextCase = document.getElementById("btnNextCase");
    if (btnNextCase) {
      btnNextCase.addEventListener("click", () => {
        const nextIdx = (this.currentCaseIndex + 1) % this.cases.length;
        this.loadCase(nextIdx);
      });
    }

    document.getElementById("btnOpenResearchModal")?.addEventListener("click", () => {
      this.renderResearchDashboard();
      document.getElementById("researchModal").classList.remove("hidden");
    });
    document.getElementById("btnCloseResearchModal")?.addEventListener("click", () => {
      document.getElementById("researchModal").classList.add("hidden");
    });

    document.getElementById("btnOpenTCLEModal")?.addEventListener("click", () => {
      document.getElementById("tcleModal").classList.remove("hidden");
    });
    document.getElementById("btnCloseTCLEModal")?.addEventListener("click", () => {
      document.getElementById("tcleModal").classList.add("hidden");
    });

    // Exportar CSV e JSON
    document.getElementById("btnExportCSV")?.addEventListener("click", () => this.exportResearchCSV());
    document.getElementById("btnExportJSON")?.addEventListener("click", () => this.exportResearchJSON());
    document.getElementById("btnResetLogs")?.addEventListener("click", () => {
      if (!window.confirm("Apagar as tentativas salvas neste navegador?")) return;
      this.researchLogs = [];
      this.completedCaseIds.clear();
      this.loadCase(this.currentCaseIndex);
      this._saveLogs();
      this.renderResearchDashboard();
      this.updateTopHUD();
    });
  }

  handleIsoObjectClick(obj) {
    const c = this.cases[this.currentCaseIndex];
    if (!c) return;

    if (obj.id === "patient") {
      // Faz a próxima pergunta não realizada na anamnese
      const nextQ = c.anamnesisOptions.find((q) => !this.askedQuestions.has(q.id));
      if (nextQ) {
        this.askAnamnesisQuestion(nextQ.id);
      } else {
        this.isoRoom.setSpeechBubble("patient", "Já contei tudo o que estou sentindo, doutor(a)!", "💬");
      }
    } else if (obj.id === "vitals") {
      this.isoRoom.setSpeechBubble(
        "patient",
        `Sinais Vitais: PA ${c.patient.vitals.pa} | FC ${c.patient.vitals.fc} | Temp ${c.patient.vitals.temp}`,
        "📟"
      );
      this.switchTab("tab-anamnesis");
    } else if (obj.id === "bed") {
      // Dispara pergunta de exame físico se houver
      const examQ = c.anamnesisOptions.find((q) => q.category.toLowerCase().includes("exame"));
      if (examQ) this.askAnamnesisQuestion(examQ.id);
    } else if (obj.id === "medai") {
      this.unlockAIOpinion();
    } else if (obj.id === "doctor") {
      this.isoRoom.setSpeechBubble(
        "patient",
        "Analise com cuidado o prontuário da IA antes de carimbar sua decisão!",
        "🩺"
      );
    }
  }

  renderCaseSelector() {
    const container = document.getElementById("caseListContainer");
    if (!container) return;

    container.innerHTML = "";
    this.cases.forEach((c, idx) => {
      if (this.activeWingFilter !== "all" && c.wing !== this.activeWingFilter) return;

      const isCurrent = idx === this.currentCaseIndex;
      const isDone = this.completedCaseIds.has(c.id);

      const btn = document.createElement("button");
      btn.className = `case-pill ${isCurrent ? "active" : ""} ${isDone ? "done" : ""}`;
      btn.innerHTML = `
        <span class="case-pill-id">${isDone ? "✅" : "📋"} ${c.id}</span>
        <span class="case-pill-title">${c.title}</span>
      `;
      btn.addEventListener("click", () => this.loadCase(idx));
      container.appendChild(btn);
    });
  }

  loadCase(index) {
    this.currentCaseIndex = index;
    const c = this.cases[index];

    this.askedQuestions = new Set();
    this.aiOpinionGenerated = false;
    this.annotations = {};
    this.finalVerdict = null;
    this.evaluationResult = null;
    this.caseStartTime = Date.now();

    // Atualizar sala isométrica
    this.isoRoom.setWingTheme(c.wing);
    this.isoRoom.loadPatient(c.patient);

    // Atualizar Cabeçalho do Prontuário
    document.getElementById("caseHeaderTitle").textContent = `${c.id}: ${c.title}`;
    document.getElementById("caseHeaderWing").textContent = c.wingName.replace(" (Caso Controle)", "");
    document.getElementById("caseHeaderDifficulty").textContent = c.difficulty;

    // Dados do Paciente e Sinais Vitais
    document.getElementById("patientNameLabel").textContent = c.patient.name;
    document.getElementById("patientJobLabel").textContent = c.patient.occupation;
    document.getElementById("chiefComplaintText").textContent = c.chiefComplaint;

    document.getElementById("vitalPA").textContent = c.patient.vitals.pa;
    document.getElementById("vitalFC").textContent = c.patient.vitals.fc;
    document.getElementById("vitalTemp").textContent = c.patient.vitals.temp;
    document.getElementById("vitalSpO2").textContent = c.patient.vitals.spo2;

    // Renderizar opções de Anamnese e Exame Físico
    this.renderAnamnesisPanel();

    // Resetar painel de Auditoria da IA
    document.getElementById("aiLockedOverlay").classList.remove("hidden");
    document.getElementById("aiWorkbenchContent").classList.add("hidden");
    document.getElementById("debriefingPanel").classList.add("hidden");
    document.getElementById("btnSubmitAudit").disabled = false;
    document.querySelectorAll("[data-verdict-choice]").forEach((btn) => {
      btn.classList.remove("selected");
      btn.disabled = false;
    });
    document.getElementById("reflexao")?.classList.add("hidden");
    document.dispatchEvent(new CustomEvent("audit:case-opened", { detail: { caseId: c.id } }));

    this.renderCaseSelector();
    this.switchTab("tab-anamnesis");
  }

  switchTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab-target") === tabId);
    });
    document.querySelectorAll(".tab-pane").forEach((pane) => {
      pane.classList.toggle("hidden", pane.id !== tabId);
    });
  }

  renderAnamnesisPanel() {
    const c = this.cases[this.currentCaseIndex];
    const listEl = document.getElementById("anamnesisOptionsList");
    const logEl = document.getElementById("clinicalCluesLog");

    listEl.innerHTML = "";
    c.anamnesisOptions.forEach((opt) => {
      const asked = this.askedQuestions.has(opt.id);
      const locked = asked || Boolean(this.evaluationResult);
      const item = document.createElement("div");
      item.className = `anamnesis-card ${asked ? "asked" : ""}`;
      item.innerHTML = `
        <div class="anamnesis-card-top">
          <span class="anamnesis-cat">${opt.category}</span>
          <button class="btn-ask ${asked ? "done" : ""}" ${locked ? "disabled" : ""}>
            ${asked ? "✓ Investigado" : "Investigar"}
          </button>
        </div>
        <div class="anamnesis-q-label">${opt.label}</div>
        ${
          asked
            ? `<div class="anamnesis-answer">
                 <strong>Paciente / Exame:</strong> "${opt.patientAnswer}"
                 ${this.evaluationResult ? `<div class="clinical-clue-box">💡 <strong>Interpretação após a auditoria:</strong> ${opt.clinicalClue}</div>` : ""}
               </div>`
            : ""
        }
      `;

      if (!locked) {
        item.querySelector(".btn-ask").addEventListener("click", () => {
          this.askAnamnesisQuestion(opt.id);
        });
      }
      listEl.appendChild(item);
    });

    // Atualizar contador de progresso da investigação
    const progressEl = document.getElementById("anamnesisProgressBadge");
    if (progressEl) {
      progressEl.textContent = `${this.askedQuestions.size}/${c.anamnesisOptions.length} investigados`;
    }

    if (logEl) logEl.replaceChildren();
    if (logEl && this.askedQuestions.size === 0) {
      logEl.innerHTML = `<div class="empty-clue-hint">Clique em "Investigar" acima (ou clique diretamente no Paciente/Maca na sala isométrica) para coletar dados antes de auditar a IA.</div>`;
    }
  }

  askAnamnesisQuestion(questionId) {
    if (this.evaluationResult) return;
    const c = this.cases[this.currentCaseIndex];
    const opt = c.anamnesisOptions.find((q) => q.id === questionId);
    if (!opt) return;

    this.askedQuestions.add(questionId);
    this.isoRoom.setSpeechBubble("patient", opt.patientAnswer, "💬");
    this.renderAnamnesisPanel();
  }

  unlockAIOpinion() {
    this.aiOpinionGenerated = true;
    this.isoRoom.setAIMode(true);
    this.isoRoom.setSpeechBubble("patient", "O computador MedAI acabou de emitir uma sugestão de conduta!", "🤖");

    document.getElementById("aiLockedOverlay").classList.add("hidden");
    document.getElementById("aiWorkbenchContent").classList.remove("hidden");

    this.renderAIAnnotationSegments();
    this.switchTab("tab-audit");
  }

  renderAIAnnotationSegments() {
    const c = this.cases[this.currentCaseIndex];
    const container = document.getElementById("aiSegmentsList");
    document.getElementById("aiModelBadge").textContent = "MedAI · parecer simulado";

    container.innerHTML = "";
    c.aiSegments.forEach((seg, index) => {
      const currentAnn = this.annotations[seg.id] || { status: null, category: "" };

      const card = document.createElement("div");
      card.className = `ai-segment-card ${currentAnn.status ? "status-" + currentAnn.status : ""}`;

      const categoriesHTML = window.ANNOTATION_CATEGORIES.map(
        (cat) =>
          `<option value="${cat.id}" ${currentAnn.category === cat.id ? "selected" : ""}>${cat.icon} ${cat.label}</option>`
      ).join("");

      card.innerHTML = `
        <div class="ai-seg-header">
          <span class="ai-seg-num">TRECHO #${index + 1} • ${seg.section}</span>
          <span class="ai-seg-badge">${this._getStatusBadgeLabel(currentAnn.status)}</span>
        </div>
        <p class="ai-seg-text">"${seg.text}"</p>
        <div class="annotation-toolbar">
          <button type="button" class="ann-btn btn-correct ${currentAnn.status === "correct" ? "active" : ""}" data-status="correct">
            🟢 Validar (Correto)
          </button>
          <button type="button" class="ann-btn btn-omission ${currentAnn.status === "omission" ? "active" : ""}" data-status="omission">
            🟡 Omissão / Incompleto
          </button>
          <button type="button" class="ann-btn btn-hallucination ${currentAnn.status === "hallucination" ? "active" : ""}" data-status="hallucination">
            🔴 Alucinação / Erro Grave
          </button>
        </div>
        <div class="annotation-taxonomy ${currentAnn.status === "omission" || currentAnn.status === "hallucination" ? "" : "hidden"}">
          <label class="tax-label">Classifique o tipo de falha da IA (Data Annotation Tag):</label>
          <select class="tax-select" data-seg-select="${seg.id}">
            <option value="">-- Selecione a categoria do erro clínico --</option>
            ${categoriesHTML}
          </select>
        </div>
      `;

      // Eventos dos botões de anotação
      card.querySelectorAll(".ann-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const chosenStatus = btn.getAttribute("data-status");
          const existing = this.annotations[seg.id] || { category: "" };
          this.annotations[seg.id] = {
            ...existing,
            status: chosenStatus,
            category: chosenStatus === "correct" ? null : existing.category || ""
          };
          this.renderAIAnnotationSegments();
        });
      });

      // Evento de seleção da categoria da falha
      const selectEl = card.querySelector(".tax-select");
      if (selectEl) {
        selectEl.addEventListener("change", (e) => {
          if (this.annotations[seg.id]) {
            this.annotations[seg.id].category = e.target.value;
          }
        });
      }

      if (this.evaluationResult) {
        card.querySelectorAll("button, select").forEach((control) => { control.disabled = true; });
      }
      container.appendChild(card);
    });
  }

  _getStatusBadgeLabel(status) {
    if (status === "correct") return "🟢 Validado pelo Aluno";
    if (status === "omission") return "🟡 Marcado como Omissão";
    if (status === "hallucination") return "🔴 Marcado como Alucinação/Erro";
    return "⏳ Pendente de Anotação";
  }

  submitAudit() {
    if (this.evaluationResult) return;
    const c = this.cases[this.currentCaseIndex];

    // Verificar se todos os trechos foram anotados
    const unannotated = c.aiSegments.filter((s) => !this.annotations[s.id]?.status);
    if (unannotated.length > 0) {
      alert(`Por favor, classifique todos os ${c.aiSegments.length} trechos do prontuário da IA antes de finalizar a auditoria.`);
      return;
    }

    if (c.aiSegments.some((seg) => this.annotations[seg.id].status !== "correct" && !this.annotations[seg.id].category)) {
      alert("Selecione a categoria de cada trecho marcado como omissão ou erro.");
      return;
    }

    if (!this.finalVerdict) {
      alert("Selecione o seu Veredito Final sobre o parecer da IA (Aprovar Conduta ou Rejeitar Conduta por Risco).");
      return;
    }

    // Cálculo das Métricas Científicas contra o Gabarito Reverso
    let exactSpanMatches = 0;
    let totalFlawsInCase = 0;
    let detectedFlaws = 0;
    let missedCriticalHallucinations = 0; // Automation Bias!
    let falsePositives = 0; // Desconfiança em trecho correto

    const segmentComparisons = c.aiSegments.map((seg) => {
      const userAnn = this.annotations[seg.id];
      const isExpectedFlaw = seg.expectedStatus !== "correct";
      const userFlaggedFlaw = userAnn.status !== "correct";

      if (isExpectedFlaw) {
        totalFlawsInCase++;
        if (userFlaggedFlaw) detectedFlaws++;
        if (seg.expectedStatus === "hallucination" && userAnn.status === "correct") {
          missedCriticalHallucinations++;
        }
      } else if (userFlaggedFlaw) {
        falsePositives++;
      }

      const exactMatch = userAnn.status === seg.expectedStatus && (!isExpectedFlaw || userAnn.category === seg.expectedCategory);
      if (exactMatch) exactSpanMatches++;

      return {
        segId: seg.id,
        section: seg.section,
        userStatus: userAnn.status,
        expectedStatus: seg.expectedStatus,
        userCategory: userAnn.category,
        expectedCategory: seg.expectedCategory,
        exactMatch,
        flawDetectionMatch: isExpectedFlaw === userFlaggedFlaw,
        explanation: seg.explanation
      };
    });

    const spanAccuracy = Math.round((exactSpanMatches / c.aiSegments.length) * 100);
    const verdictCorrect = this.finalVerdict === c.aiMetadata.groundTruthVerdict;
    const elapsedSeconds = Math.round((Date.now() - this.caseStartTime) / 1000);

    // Determinar se houve Viés de Automação (aceitou alucinação perigosa)
    const hadAutomationBias =
      missedCriticalHallucinations > 0 ||
      (c.aiMetadata.groundTruthVerdict === "reject" && this.finalVerdict === "approve");

    this.completedCaseIds.add(c.id);

    this.evaluationResult = {
      caseId: c.id,
      caseTitle: c.title,
      wing: c.wingName,
      injectedMode: c.aiMetadata.injectedMode,
      timestamp: new Date().toISOString(),
      elapsedSeconds,
      anamnesisCount: this.askedQuestions.size,
      totalAnamnesisAvailable: c.anamnesisOptions.length,
      spanAccuracy,
      verdictCorrect,
      userVerdict: this.finalVerdict,
      groundTruthVerdict: c.aiMetadata.groundTruthVerdict,
      totalFlawsInCase,
      detectedFlaws,
      falsePositives,
      hadAutomationBias,
      segmentComparisons
    };

    // Salvar no log do Mestrado
    this.researchLogs.push(this.evaluationResult);
    this._saveLogs();

    this.isoRoom.triggerVerdictFeedback(verdictCorrect && spanAccuracy === 100, "Auditoria registrada");
    this.renderAnamnesisPanel();
    this.renderAIAnnotationSegments();
    document.getElementById("btnSubmitAudit").disabled = true;
    document.querySelectorAll("[data-verdict-choice]").forEach((btn) => { btn.disabled = true; });
    this.updateTopHUD();
    this.renderCaseSelector();
    this.renderDebriefingPanel();
    document.dispatchEvent(new CustomEvent("audit:submitted", { detail: this.evaluationResult }));
  }

  renderDebriefingPanel() {
    const res = this.evaluationResult;
    const c = this.cases[this.currentCaseIndex];
    const panel = document.getElementById("debriefingPanel");
    if (!panel || !res) return;

    panel.classList.remove("hidden");

    const categoryName = (value) => window.ANNOTATION_CATEGORIES.find((item) => item.id === value)?.label || "Sem categoria";
    const rowsHTML = res.segmentComparisons
      .map(
        (comp, idx) => `
        <div class="debrief-seg-item ${comp.exactMatch ? "match" : "mismatch"}">
          <div class="debrief-seg-top">
            <strong>Trecho #${idx + 1} (${comp.section})</strong>
            <span class="debrief-pill ${comp.exactMatch ? "ok" : "err"}">
              Você marcou: ${this._formatStatusShort(comp.userStatus)} | Gabarito: ${this._formatStatusShort(comp.expectedStatus)}
            </span>
          </div>
          ${(comp.userCategory || comp.expectedCategory) ? `<p>Sua categoria: ${categoryName(comp.userCategory)} · Gabarito: ${categoryName(comp.expectedCategory)}</p>` : ""}
          <p class="debrief-explanation">${comp.explanation}</p>
        </div>
      `
      )
      .join("");

    panel.innerHTML = `
      <div class="debrief-header ${res.verdictCorrect && res.spanAccuracy === 100 ? "pass" : "warn"}">
        <div>
          <h3>${res.verdictCorrect && res.spanAccuracy === 100 ? "Auditoria concluída · todas as anotações coincidem com o gabarito" : "Auditoria concluída · reveja as diferenças em relação ao gabarito"}</h3>
          <p>${c.aiMetadata.summaryForResearcher}</p>
        </div>
        <div class="debrief-score-box">
          <span class="score-big">${res.spanAccuracy}%</span>
          <span class="score-sub">Acerto de rótulo e categoria</span>
        </div>
      </div>

      <div class="debrief-metrics-grid">
        <div class="metric-mini">
          <span class="m-label">Veredito Final</span>
          <span class="m-val ${res.verdictCorrect ? "text-green" : "text-red"}">
            ${res.verdictCorrect ? "✓ Correto" : "✗ Incorreto"}
          </span>
        </div>
        <div class="metric-mini">
          <span class="m-label">Trechos com falha identificados</span>
          <span class="m-val">${res.totalFlawsInCase ? res.detectedFlaws + " de " + res.totalFlawsInCase : "Nenhuma falha prevista"}</span>
        </div>
        <div class="metric-mini">
          <span class="m-label">Aceite de erro simulado</span>
          <span class="m-val ${res.hadAutomationBias ? "text-red" : "text-green"}">
            ${res.hadAutomationBias ? "Sim, nesta tentativa" : (res.totalFlawsInCase ? "Não observado" : "Não se aplica")}
          </span>
        </div>
        <div class="metric-mini">
          <span class="m-label">Tempo de Auditoria</span>
          <span class="m-val">${res.elapsedSeconds}s (${res.anamnesisCount}/${res.totalAnamnesisAvailable} perguntas)</span>
        </div>
      </div>

      <div class="debrief-segments-list">
        <h4>Gabarito comentado por trecho</h4>
        ${rowsHTML}
      </div>
    `;

    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  _formatStatusShort(st) {
    if (st === "correct") return "🟢 Correto";
    if (st === "omission") return "🟡 Omissão";
    if (st === "hallucination") return "🔴 Alucinação/Erro";
    return st;
  }

  updateTopHUD() {
    const xp = this.researchLogs.reduce((total, r) => total + (r.spanAccuracy >= 75 && r.verdictCorrect ? 80 : 35), 0);
    document.getElementById("hudXP").textContent = xp + " XP";
    document.getElementById("hudCompletedCount").textContent = this.completedCaseIds.size + "/" + this.cases.length + " casos";
    document.getElementById("hudRank").textContent = "Auditoria em simulação";
  }

  // =========================================================================
  // PAINEL DO PESQUISADOR (MESTRADO) & EXPORTAÇÃO DE DATASET
  // =========================================================================
  renderResearchDashboard() {
    const total = this.researchLogs.length;
    const avgAcc =
      total > 0
        ? Math.round(this.researchLogs.reduce((acc, r) => acc + r.spanAccuracy, 0) / total)
        : 0;
    const biasCount = this.researchLogs.filter((r) => r.hadAutomationBias).length;
    const eligible = this.researchLogs.filter((r) => r.totalFlawsInCase > 0).length;
    const biasRate = eligible ? Math.round((biasCount / eligible) * 100) : null;
    const avgTime =
      total > 0
        ? Math.round(this.researchLogs.reduce((acc, r) => acc + r.elapsedSeconds, 0) / total)
        : 0;

    document.getElementById("resTotalAudits").textContent = total;
    document.getElementById("resAvgAccuracy").textContent = total ? `${avgAcc}%` : "—";
    document.getElementById("resAutomationBiasRate").textContent = eligible ? `${biasRate}% (${biasCount}/${eligible})` : "—";
    document.getElementById("resAvgTime").textContent = total ? `${avgTime}s` : "—";

    const tbody = document.getElementById("researchLogsTableBody");
    if (!tbody) return;

    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 18px; color:#94a3b8;">Complete uma auditoria para ver os resultados desta demonstração.</td></tr>`;
      return;
    }

    tbody.replaceChildren();
    this.researchLogs.forEach((log, i) => {
      const row = tbody.insertRow();
      const values = [
        String(i + 1), log.caseId, log.anamnesisCount + "/" + log.totalAnamnesisAvailable,
        log.spanAccuracy + "%", log.detectedFlaws + "/" + log.totalFlawsInCase + " (FP: " + log.falsePositives + ")",
        log.totalFlawsInCase ? (log.hadAutomationBias ? "Sim" : "Não observado") : "Não se aplica",
        log.elapsedSeconds + "s"
      ];
      values.forEach((value) => { row.insertCell().textContent = value; });
    });
  }

  exportResearchCSV() {
    if (this.researchLogs.length === 0) {
      alert("Conclua pelo menos 1 auditoria de caso clínico antes de exportar o CSV.");
      return;
    }

    const headers = [
      "log_index",
      "timestamp",
      "case_id",
      "wing",
      "injected_ai_mode",
      "anamnesis_questions_asked",
      "elapsed_seconds",
      "span_accuracy_pct",
      "total_flaws_in_case",
      "detected_flaws",
      "false_positives",
      "user_verdict",
      "ground_truth_verdict",
      "verdict_correct",
      "automation_bias_detected"
    ];

    const rows = this.researchLogs.map((r, idx) => [
      idx + 1,
      r.timestamp,
      r.caseId,
      `"${r.wing}"`,
      r.injectedMode,
      r.anamnesisCount,
      r.elapsedSeconds,
      r.spanAccuracy,
      r.totalFlawsInCase,
      r.detectedFlaws,
      r.falsePositives,
      r.userVerdict,
      r.groundTruthVerdict,
      r.verdictCorrect,
      r.hadAutomationBias
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    this._downloadFile(csvContent, "demonstracao_auditoria_clinica.csv", "text/csv;charset=utf-8;");
  }

  exportResearchJSON() {
    const dataStr = JSON.stringify(this.researchLogs, null, 2);
    this._downloadFile(dataStr, "demonstracao_auditoria_clinica.json", "application/json");
  }

  _downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }


}

window.addEventListener("DOMContentLoaded", () => {
  window.medAuditApp = new MedAuditPlatform();
});
