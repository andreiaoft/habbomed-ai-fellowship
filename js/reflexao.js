// A conversa é iniciada pelo estudante na própria conta do Workspace.
(() => {
  const panel = document.getElementById("reflexao");
  const segmentSelect = document.getElementById("trechoReflexao");
  const promptField = document.getElementById("promptGemini");
  const reflectionField = document.getElementById("reflexaoAluno");
  const status = document.getElementById("estadoReflexao");
  const labels = { correct: "correto", omission: "omissão", hallucination: "erro" };
  const references = {
    "CASO-001": ["Ministério da Saúde · Manejo clínico da dengue", "https://www.gov.br/saude/pt-br/centrais-de-conteudo/publicacoes/svsa/dengue/dengue-diagnostico-e-manejo-clinico-adulto-e-crianca/view"],
    "CASO-002": ["ACC/AHA · Síndromes coronarianas agudas", "https://www.jacc.org/doi/10.1016/j.jacc.2024.11.009"],
    "CASO-003": ["NICE · Lombalgia e ciática", "https://www.nice.org.uk/guidance/ng59/chapter/Recommendations"],
    "CASO-004": ["ACOG · Infecções urinárias na gestação", "https://www.acog.org/clinical/clinical-guidance/clinical-consensus/articles/2023/08/urinary-tract-infections-in-pregnant-individuals"],
    "CASO-005": ["American Geriatrics Society · Critérios de Beers", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12478568/"]
  };

  function updatePrompt() {
    const app = window.medAuditApp;
    const result = app.evaluationResult;
    const caseData = app.cases[app.currentCaseIndex];
    const segment = caseData.aiSegments.find(item => item.id === segmentSelect.value);
    const decision = result.segmentComparisons.find(item => item.segId === segment.id);
    const findings = caseData.anamnesisOptions
      .filter(item => app.askedQuestions.has(item.id))
      .map(item => item.patientAnswer);

    promptField.value = [
      "Sou estudante de medicina em uma simulação com um paciente fictício. Atue como tutor de raciocínio crítico.",
      "Queixa da triagem: " + caseData.chiefComplaint,
      "Achados que investiguei: " + (findings.join(" ") || "Ainda não investiguei achados adicionais."),
      "Trecho do parecer didático que estou auditando: “" + segment.text + "”",
      "Minha classificação foi “" + labels[decision.userStatus] + "”. Minha decisão sobre o parecer completo foi " +
        (result.userVerdict === "approve" ? "aprovar." : "rejeitar."),
      "Faça uma única pergunta que me obrigue a citar um dado do caso que sustente ou contrarie minha classificação. Aguarde minha resposta. Depois, pergunte qual informação faltante mudaria meu julgamento. Trabalhe apenas com o caso fictício, sem acrescentar fatos, prescrever ou dar a resposta por mim."
    ].join("\n\n");
  }

  document.addEventListener("audit:submitted", () => {
    const app = window.medAuditApp;
    const caseData = app.cases[app.currentCaseIndex];
    const [title, url] = references[caseData.id];
    const reference = document.getElementById("fonteDoCaso");
    reference.textContent = title;
    reference.href = url;
    segmentSelect.replaceChildren(...caseData.aiSegments.map((segment, index) =>
      new Option((index + 1) + ". " + segment.section, segment.id)
    ));
    const chosen = app.evaluationResult.segmentComparisons.find(item => item.userStatus !== item.expectedStatus)
      || app.evaluationResult.segmentComparisons.find(item => item.userStatus !== "correct");
    if (chosen) segmentSelect.value = chosen.segId;
    reflectionField.value = "";
    status.textContent = "";
    updatePrompt();
    panel.classList.remove("hidden");
  });

  segmentSelect.addEventListener("change", () => {
    updatePrompt();
    status.textContent = "";
  });

  document.getElementById("copiarPrompt").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(promptField.value);
      status.textContent = "Texto copiado. Cole na conversa do Gemini.";
    } catch {
      promptField.focus();
      promptField.select();
      status.textContent = "Texto selecionado. Use o comando Copiar do navegador.";
    }
  });

  document.getElementById("salvarReflexao").addEventListener("click", () => {
    const app = window.medAuditApp;
    const text = reflectionField.value.trim();
    if (!text) {
      status.textContent = "Escreva a evidência que sustenta sua conclusão.";
      reflectionField.focus();
      return;
    }
    if (!app.researchLogs.includes(app.evaluationResult)) {
      status.textContent = "Esta tentativa foi apagada. Faça uma nova auditoria para registrar a reflexão.";
      return;
    }
    app.evaluationResult.reflexao = { trecho: segmentSelect.value, texto: text };
    app._saveLogs();
    status.textContent = "Reflexão registrada. Ela acompanha esta tentativa na exportação JSON.";
  });
})();
