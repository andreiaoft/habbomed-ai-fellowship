// Motor Isométrico 2.5D (Estilo Habbo Hotel / Theme Hospital) para Simulação Clínica
// Renderiza o consultório, avatares, caminhada em grid isométrico, balões de fala e objetos clicáveis

class IsometricHospitalRoom {
  constructor(canvasId, onObjectClick) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.onObjectClick = onObjectClick || (() => {});

    // Grid isométrico 8x8 tiles
    this.gridSize = 8;
    this.tileW = 64;
    this.tileH = 32;

    this.originX = this.canvas.width / 2;
    this.originY = 125;

    this.wingTheme = "infecto";
    this.tick = 0;
    this.hoveredObject = null;
    this.hoverTile = null;

    // Estado do paciente no mundo isométrico
    this.patientState = {
      visible: true,
      gridX: 1,
      gridY: 6,
      targetPath: [],
      walking: false,
      sitting: false,
      name: "Paciente",
      hairColor: "#2c3e50",
      shirtColor: "#3498db",
      mood: "febril",
      bubbleText: "Aguardando chamada...",
      statusIcon: "🤒"
    };

    // Estado do Médico / Aluno e Terminal IA
    this.doctorState = {
      bubbleText: "Pronto para iniciar anamnese.",
      aiActive: false,
      verdictEffect: null // 'success' | 'error' | null
    };

    // Partículas flutuantes (ex: XP, alerta de IA, batimento)
    this.particles = [];

    this._bindEvents();
    this._startLoop();
  }

  _bindEvents() {
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      this.hoverTile = this.screenToIso(mx, my);
      this.hoveredObject = this._hitTestObjects(mx, my);
      this.canvas.style.cursor = this.hoveredObject ? "pointer" : "default";
    });

    this.canvas.addEventListener("click", (e) => {
      if (this.hoveredObject) {
        this.onObjectClick(this.hoveredObject);
        this.spawnParticle(this.hoveredObject.x, this.hoveredObject.y - 30, "✨", "#38bdf8");
      }
    });
  }

  isoToScreen(gx, gy, gz = 0) {
    const sx = this.originX + (gx - gy) * (this.tileW / 2);
    const sy = this.originY + (gx + gy) * (this.tileH / 2) - gz;
    return { x: sx, y: sy };
  }

  screenToIso(sx, sy) {
    const dx = sx - this.originX;
    const dy = sy - this.originY;
    const gx = Math.floor((dx / (this.tileW / 2) + dy / (this.tileH / 2)) / 2);
    const gy = Math.floor((dy / (this.tileH / 2) - dx / (this.tileW / 2)) / 2);
    return { gx, gy };
  }

  setWingTheme(wing) {
    this.wingTheme = wing;
  }

  loadPatient(patientData) {
    // Paciente entra pela porta (0, 6) e caminha até a cadeira de atendimento (3, 4)
    this.patientState = {
      visible: true,
      gridX: 0.2,
      gridY: 6.0,
      targetPath: [
        { x: 1, y: 6 },
        { x: 2, y: 5 },
        { x: 3, y: 4 }
      ],
      walking: true,
      sitting: false,
      name: patientData.name,
      hairColor: patientData.hairColor || "#2c3e50",
      shirtColor: patientData.shirtColor || "#3498db",
      mood: patientData.mood || "normal",
      bubbleText: patientData.bubbleText || "Olá, doutor(a)...",
      statusIcon: this._getMoodIcon(patientData.mood)
    };
    this.doctorState.aiActive = false;
    this.doctorState.verdictEffect = null;
    this.doctorState.bubbleText = "Paciente entrando no consultório...";
  }

  _getMoodIcon(mood) {
    const map = {
      febril: "🤒",
      suando: "😰",
      dor_leve: "😣",
      desconforto: "😟",
      confuso: "😵‍💫"
    };
    return map[mood] || "💬";
  }

  setSpeechBubble(who, text, icon = null) {
    if (who === "patient") {
      this.patientState.bubbleText = text;
      if (icon) this.patientState.statusIcon = icon;
    } else {
      this.doctorState.bubbleText = text;
    }
  }

  setAIMode(active) {
    this.doctorState.aiActive = active;
    if (active) {
      const pos = this.isoToScreen(4, 2.5, 45);
      this.spawnParticle(pos.x, pos.y, "🤖 MedAI Analisando...", "#38bdf8");
    }
  }

  triggerVerdictFeedback(isSuccess, labelText) {
    this.doctorState.verdictEffect = isSuccess ? "success" : "error";
    const pos = this.isoToScreen(3.5, 3.5, 60);
    this.spawnParticle(
      pos.x,
      pos.y,
      labelText || (isSuccess ? "✅ Auditoria Precisa!" : "⚠️ Erro na Auditoria!"),
      isSuccess ? "#22c55e" : "#ef4444"
    );
  }

  spawnParticle(x, y, text, color = "#38bdf8") {
    this.particles.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -0.7,
      life: 95
    });
  }

  _getThemePalette() {
    const themes = {
      infecto: {
        wallLeft: "#1e3a5f",
        wallRight: "#172d4a",
        wallTrim: "#38bdf8",
        tileLight: "#f1f5f9",
        tileDark: "#e2e8f0",
        rugColor: "#0284c7",
        accent: "#0ea5e9",
        badge: "ALA DE INFECTOLOGIA & VIGILÂNCIA"
      },
      emergencia: {
        wallLeft: "#4c1d24",
        wallRight: "#3b151b",
        wallTrim: "#f43f5e",
        tileLight: "#f8fafc",
        tileDark: "#e2e8f0",
        rugColor: "#e11d48",
        accent: "#f43f5e",
        badge: "PRONTO-SOCORRO • SALA AMARELA"
      },
      ambulatorio: {
        wallLeft: "#1e3f3b",
        wallRight: "#16302d",
        wallTrim: "#10b981",
        tileLight: "#f8fafc",
        tileDark: "#e2e8f0",
        rugColor: "#059669",
        accent: "#10b981",
        badge: "AMBULATÓRIO DE CLÍNICA MÉDICA"
      },
      geriatria: {
        wallLeft: "#3b2751",
        wallRight: "#2c1d3d",
        wallTrim: "#a855f7",
        tileLight: "#faf5ff",
        tileDark: "#f3e8ff",
        rugColor: "#7e22ce",
        accent: "#a855f7",
        badge: "ALA DE GERIATRIA & POLIFARMÁCIA"
      }
    };
    return themes[this.wingTheme] || themes.infecto;
  }

  _hitTestObjects(mx, my) {
    const targets = this._getInteractiveTargets();
    for (const t of targets) {
      const dx = mx - t.x;
      const dy = my - t.y;
      if (Math.abs(dx) <= t.w / 2 && Math.abs(dy) <= t.h / 2) {
        return t;
      }
    }
    return null;
  }

  _getInteractiveTargets() {
    const pPos = this.isoToScreen(this.patientState.gridX, this.patientState.gridY, 32);
    const aiPos = this.isoToScreen(4.1, 2.6, 38);
    const vitalsPos = this.isoToScreen(1.2, 1.2, 42);
    const bedPos = this.isoToScreen(2.0, 1.3, 25);
    const docPos = this.isoToScreen(4.7, 2.2, 40);

    return [
      { id: "patient", label: "Paciente (Anamnese)", x: pPos.x, y: pPos.y, w: 54, h: 68 },
      { id: "medai", label: "Terminal MedAI Co-Pilot", x: aiPos.x, y: aiPos.y, w: 52, h: 48 },
      { id: "vitals", label: "Monitor Multiparamétrico", x: vitalsPos.x, y: vitalsPos.y, w: 48, h: 58 },
      { id: "bed", label: "Maca de Exame Físico", x: bedPos.x, y: bedPos.y, w: 72, h: 46 },
      { id: "doctor", label: "Médico / Auditor Clínico", x: docPos.x, y: docPos.y, w: 50, h: 64 }
    ];
  }

  _update() {
    this.tick++;

    // Caminhada suave do paciente pelos tiles isométricos
    if (this.patientState.walking && this.patientState.targetPath.length > 0) {
      const target = this.patientState.targetPath[0];
      const dx = target.x - this.patientState.gridX;
      const dy = target.y - this.patientState.gridY;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.06) {
        this.patientState.gridX = target.x;
        this.patientState.gridY = target.y;
        this.patientState.targetPath.shift();
        if (this.patientState.targetPath.length === 0) {
          this.patientState.walking = false;
          this.patientState.sitting = true;
          this.doctorState.bubbleText = "Clique nas perguntas ou examine o paciente.";
        }
      } else {
        this.patientState.gridX += (dx / dist) * 0.045;
        this.patientState.gridY += (dy / dist) * 0.045;
      }
    }

    // Atualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.y += p.vy;
      p.life--;
      p.alpha = Math.min(1, p.life / 30);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  _drawTile(gx, gy, fillStyle, strokeStyle = "rgba(148, 163, 184, 0.45)") {
    const p1 = this.isoToScreen(gx, gy);
    const p2 = this.isoToScreen(gx + 1, gy);
    const p3 = this.isoToScreen(gx + 1, gy + 1);
    const p4 = this.isoToScreen(gx, gy + 1);

    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }

  _drawIsoBlock(gx, gy, gw, gd, height, topColor, leftColor, rightColor, gz = 0) {
    const ctx = this.ctx;
    const t1 = this.isoToScreen(gx, gy, gz + height);
    const t2 = this.isoToScreen(gx + gw, gy, gz + height);
    const t3 = this.isoToScreen(gx + gw, gy + gd, gz + height);
    const t4 = this.isoToScreen(gx, gy + gd, gz + height);

    const b2 = this.isoToScreen(gx + gw, gy, gz);
    const b3 = this.isoToScreen(gx + gw, gy + gd, gz);
    const b4 = this.isoToScreen(gx, gy + gd, gz);

    // Face Esquerda
    ctx.beginPath();
    ctx.moveTo(t4.x, t4.y);
    ctx.lineTo(t3.x, t3.y);
    ctx.lineTo(b3.x, b3.y);
    ctx.lineTo(b4.x, b4.y);
    ctx.closePath();
    ctx.fillStyle = leftColor;
    ctx.fill();
    ctx.strokeStyle = "rgba(15, 23, 42, 0.25)";
    ctx.stroke();

    // Face Direita
    ctx.beginPath();
    ctx.moveTo(t2.x, t2.y);
    ctx.lineTo(t3.x, t3.y);
    ctx.lineTo(b3.x, b3.y);
    ctx.lineTo(b2.x, b2.y);
    ctx.closePath();
    ctx.fillStyle = rightColor;
    ctx.fill();
    ctx.stroke();

    // Topo
    ctx.beginPath();
    ctx.moveTo(t1.x, t1.y);
    ctx.lineTo(t2.x, t2.y);
    ctx.lineTo(t3.x, t3.y);
    ctx.lineTo(t4.x, t4.y);
    ctx.closePath();
    ctx.fillStyle = topColor;
    ctx.fill();
    ctx.stroke();
  }

  _drawWalls(palette) {
    const ctx = this.ctx;
    const wallH = 105;

    // Parede Noroeste (Eixo Y, gx = 0)
    const nw1 = this.isoToScreen(0, 0, wallH);
    const nw2 = this.isoToScreen(0, this.gridSize, wallH);
    const nw3 = this.isoToScreen(0, this.gridSize, 0);
    const nw4 = this.isoToScreen(0, 0, 0);

    ctx.beginPath();
    ctx.moveTo(nw1.x, nw1.y);
    ctx.lineTo(nw2.x, nw2.y);
    ctx.lineTo(nw3.x, nw3.y);
    ctx.lineTo(nw4.x, nw4.y);
    ctx.closePath();
    ctx.fillStyle = palette.wallLeft;
    ctx.fill();

    // Parede Nordeste (Eixo X, gy = 0)
    const ne1 = this.isoToScreen(0, 0, wallH);
    const ne2 = this.isoToScreen(this.gridSize, 0, wallH);
    const ne3 = this.isoToScreen(this.gridSize, 0, 0);
    const ne4 = this.isoToScreen(0, 0, 0);

    ctx.beginPath();
    ctx.moveTo(ne1.x, ne1.y);
    ctx.lineTo(ne2.x, ne2.y);
    ctx.lineTo(ne3.x, ne3.y);
    ctx.lineTo(ne4.x, ne4.y);
    ctx.closePath();
    ctx.fillStyle = palette.wallRight;
    ctx.fill();

    // Faixa hospitalar luminosa nas paredes
    ctx.strokeStyle = palette.wallTrim;
    ctx.lineWidth = 3;
    const sL1 = this.isoToScreen(0, 0, 38);
    const sL2 = this.isoToScreen(0, this.gridSize, 38);
    const sR2 = this.isoToScreen(this.gridSize, 0, 38);
    ctx.beginPath();
    ctx.moveTo(sL2.x, sL2.y);
    ctx.lineTo(sL1.x, sL1.y);
    ctx.lineTo(sR2.x, sR2.y);
    ctx.stroke();

    // Porta de Entrada do Consultório na Parede Esquerda (gy = 5.5 a 6.8)
    const d1 = this.isoToScreen(0, 5.4, 78);
    const d2 = this.isoToScreen(0, 6.9, 78);
    const d3 = this.isoToScreen(0, 6.9, 0);
    const d4 = this.isoToScreen(0, 5.4, 0);
    ctx.beginPath();
    ctx.moveTo(d1.x, d1.y);
    ctx.lineTo(d2.x, d2.y);
    ctx.lineTo(d3.x, d3.y);
    ctx.lineTo(d4.x, d4.y);
    ctx.closePath();
    ctx.fillStyle = "#334155";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Visor de vidro na porta
    const v1 = this.isoToScreen(0, 5.8, 66);
    const v2 = this.isoToScreen(0, 6.5, 66);
    const v3 = this.isoToScreen(0, 6.5, 42);
    const v4 = this.isoToScreen(0, 5.8, 42);
    ctx.beginPath();
    ctx.moveTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    ctx.lineTo(v3.x, v3.y);
    ctx.lineTo(v4.x, v4.y);
    ctx.closePath();
    ctx.fillStyle = "#7dd3fc";
    ctx.fill();

    // Janela panorâmica na Parede Direita (gx = 3.2 a 5.5)
    const w1 = this.isoToScreen(3.0, 0, 88);
    const w2 = this.isoToScreen(5.6, 0, 88);
    const w3 = this.isoToScreen(5.6, 0, 44);
    const w4 = this.isoToScreen(3.0, 0, 44);
    ctx.beginPath();
    ctx.moveTo(w1.x, w1.y);
    ctx.lineTo(w2.x, w2.y);
    ctx.lineTo(w3.x, w3.y);
    ctx.lineTo(w4.x, w4.y);
    ctx.closePath();
    ctx.fillStyle = "#0ea5e9";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Pôster Anatômico na parede esquerda (gy = 2.2 a 3.4)
    const p1 = this.isoToScreen(0, 2.3, 86);
    const p2 = this.isoToScreen(0, 3.5, 86);
    const p3 = this.isoToScreen(0, 3.5, 48);
    const p4 = this.isoToScreen(0, 2.3, 48);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  _drawFurniture(palette) {
    const ctx = this.ctx;

    // 1. Maca de Exame Físico (Canto Superior Esquerdo: gx 1.2..2.8, gy 0.8..1.8)
    this._drawIsoBlock(1.2, 0.8, 1.7, 1.0, 18, "#38bdf8", "#0284c7", "#0369a1", 0);
    // Travesseiro branco na maca
    this._drawIsoBlock(1.25, 0.85, 0.45, 0.9, 5, "#ffffff", "#e2e8f0", "#cbd5e1", 18);

    // 2. Monitor Multiparamétrico (Com traçado ECG animado!) em (0.8, 0.8)
    this._drawIsoBlock(0.5, 0.7, 0.5, 0.5, 34, "#64748b", "#475569", "#334155", 0);
    this._drawIsoBlock(0.45, 0.65, 0.6, 0.6, 18, "#1e293b", "#0f172a", "#020617", 34);
    // Linha de ECG verde piscando no monitor
    const monScreen = this.isoToScreen(0.75, 0.95, 44);
    ctx.save();
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = -12; i <= 12; i += 2) {
      const wave = ((i + Math.floor(this.tick / 3)) % 12 === 0) ? -7 : (i % 4 === 0 ? 2 : 0);
      if (i === -12) ctx.moveTo(monScreen.x + i, monScreen.y + wave);
      else ctx.lineTo(monScreen.x + i, monScreen.y + wave);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Armário de Medicamentos / Pia Clínica (gx 6.2, gy 0.5)
    this._drawIsoBlock(6.1, 0.4, 1.2, 0.8, 46, "#f8fafc", "#cbd5e1", "#94a3b8", 0);
    // Cruz vermelha/verde no armário
    const cabPos = this.isoToScreen(6.7, 1.0, 26);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(cabPos.x - 5, cabPos.y - 2, 10, 4);
    ctx.fillRect(cabPos.x - 2, cabPos.y - 5, 4, 10);

    // 4. Cadeira do Médico (atrás da mesa: gx 4.7, gy 2.2)
    this._drawIsoBlock(4.5, 2.0, 0.7, 0.7, 16, "#334155", "#1e293b", "#0f172a", 0);

    // 5. Avatar do Médico / Aluno (Sentado na mesa)
    this._drawAvatar(4.8, 2.3, {
      skinColor: "#fcd34d",
      coatColor: "#ffffff",
      hairColor: "#1e293b",
      isDoctor: true,
      sitting: true
    });

    // 6. Mesa do Consultório (gx 3.8..5.1, gy 2.5..3.5)
    this._drawIsoBlock(3.7, 2.4, 1.4, 1.0, 22, "#d97706", "#b45309", "#92400e", 0);

    // 7. Terminal MedAI Co-Pilot em cima da mesa
    const aiGlow = this.doctorState.aiActive
      ? (Math.sin(this.tick * 0.15) > 0 ? "#38bdf8" : "#818cf8")
      : "#0f172a";
    this._drawIsoBlock(4.0, 2.6, 0.55, 0.45, 14, "#e2e8f0", aiGlow, "#64748b", 22);

    // Ícone flutuante sobre o computador MedAI
    const pcPos = this.isoToScreen(4.25, 2.8, 44);
    ctx.save();
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = this.doctorState.aiActive ? "#38bdf8" : "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText(this.doctorState.aiActive ? "⚡ MedAI ON" : "💻 MedAI", pcPos.x, pcPos.y);
    ctx.restore();

    // 8. Cadeira do Paciente (frente da mesa: gx 3.0, gy 4.0)
    this._drawIsoBlock(2.8, 3.8, 0.75, 0.75, 14, palette.rugColor, "#1e293b", "#0f172a", 0);

    // 9. Banco da Recepção / Espera perto da porta (gx 0.6, gy 6.8)
    this._drawIsoBlock(0.5, 6.7, 1.8, 0.7, 13, "#64748b", "#475569", "#334155", 0);
  }

  _drawAvatar(gx, gy, opts) {
    const ctx = this.ctx;
    const bounce = opts.walking ? Math.abs(Math.sin(this.tick * 0.28)) * 5 : Math.sin(this.tick * 0.06) * 1.2;
    const base = this.isoToScreen(gx, gy, bounce);

    ctx.save();

    // Sombra no piso
    const shadowPos = this.isoToScreen(gx, gy, 0);
    ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
    ctx.beginPath();
    ctx.ellipse(shadowPos.x, shadowPos.y, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pernas
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(base.x - 7, base.y - 14, 5, 12);
    ctx.fillRect(base.x + 2, base.y - 14, 5, 12);

    // Tronco (Jaleco branco para médico ou camisa colorida para paciente)
    ctx.fillStyle = opts.isDoctor ? "#f8fafc" : (opts.shirtColor || "#3498db");
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(base.x - 11, base.y - 34, 22, 22, 5);
    ctx.fill();
    ctx.stroke();

    // Estetoscópio no médico
    if (opts.isDoctor) {
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(base.x, base.y - 30, 6, 0, Math.PI);
      ctx.stroke();
      // Cruz médica no bolso
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(base.x + 3, base.y - 25, 5, 5);
    }

    // Cabeça (Estilo Habbo: arredondada/isométrica expressiva)
    ctx.fillStyle = opts.skinColor || "#fdba74";
    ctx.beginPath();
    ctx.arc(base.x, base.y - 44, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cabelo
    ctx.fillStyle = opts.hairColor || "#1e293b";
    ctx.beginPath();
    ctx.arc(base.x, base.y - 47, 11, Math.PI, Math.PI * 2);
    ctx.fill();

    // Olhos
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(base.x - 5, base.y - 45, 2.5, 3);
    ctx.fillRect(base.x + 3, base.y - 45, 2.5, 3);

    // Efeito visual de febre/suor no paciente
    if (!opts.isDoctor && opts.mood === "febril") {
      ctx.fillStyle = "rgba(239, 68, 68, 0.35)";
      ctx.beginPath();
      ctx.arc(base.x - 5, base.y - 41, 3, 0, Math.PI * 2);
      ctx.arc(base.x + 5, base.y - 41, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ícone de status flutuando sobre o paciente
    if (!opts.isDoctor && opts.statusIcon) {
      ctx.font = "15px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(opts.statusIcon, base.x, base.y - 62 + Math.sin(this.tick * 0.1) * 2);
    }

    ctx.restore();
  }

  _drawHabboChatBar(palette) {
    const ctx = this.ctx;
    // Balão estilo Habbo Hotel no topo da cena mostrando a fala atual do Paciente
    const text = this.patientState.bubbleText || "";
    if (!text) return;

    const barX = 24;
    const barY = 14;
    const barW = this.canvas.width - 48;
    const barH = 44;

    ctx.save();
    // Fundo branco estilo Habbo Chat Bubble com borda dupla preta/cinza
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 8);
    ctx.fill();
    ctx.stroke();

    // Faixa lateral da cor da ala
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.roundRect(barX + 4, barY + 4, 8, barH - 8, 4);
    ctx.fill();

    // Nome do Paciente + Fala
    ctx.font = "bold 12px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(`${this.patientState.statusIcon} ${this.patientState.name}:`, barX + 20, barY + 18);

    ctx.font = "12.5px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#334155";
    const maxChars = 88;
    const clipped = text.length > maxChars ? text.slice(0, maxChars - 3) + "..." : text;
    ctx.fillText(`"${clipped}"`, barX + 20, barY + 35);
    ctx.restore();
  }

  _drawHUD(palette) {
    const ctx = this.ctx;

    // Etiqueta da Ala no canto inferior esquerdo
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = palette.wallTrim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(14, this.canvas.height - 40, 290, 28, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`🏥 ${palette.badge}`, 24, this.canvas.height - 22);

    // Tooltip de objeto sob o mouse
    if (this.hoveredObject) {
      const t = this.hoveredObject;
      ctx.font = "bold 11px sans-serif";
      const tw = ctx.measureText(t.label).width + 20;
      ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
      ctx.strokeStyle = "#38bdf8";
      ctx.beginPath();
      ctx.roundRect(t.x - tw / 2, t.y - 48, tw, 24, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.textAlign = "center";
      ctx.fillText(t.label, t.x, t.y - 32);
    }

    // Partículas flutuantes
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.font = "bold 13px sans-serif";
      ctx.fillStyle = p.color;
      ctx.textAlign = "center";
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 4;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }

    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    const palette = this._getThemePalette();

    // Fundo escuro espacial estilo Habbo Hotel
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grade sutil no background
    ctx.strokeStyle = "rgba(30, 41, 59, 0.35)";
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    // 1. Paredes Isométricas
    this._drawWalls(palette);

    // 2. Piso Isométrico (8x8 tiles)
    for (let gx = 0; gx < this.gridSize; gx++) {
      for (let gy = 0; gy < this.gridSize; gy++) {
        const isChecker = (gx + gy) % 2 === 0;
        let tileColor = isChecker ? palette.tileLight : palette.tileDark;

        // Tapete da zona de consulta (ao redor da cadeira do paciente)
        if (gx >= 2 && gx <= 4 && gy >= 3 && gy <= 5) {
          tileColor = isChecker ? "#bae6fd" : "#7dd3fc";
        }

        // Destaque do tile sob o mouse
        if (this.hoverTile && this.hoverTile.gx === gx && this.hoverTile.gy === gy) {
          tileColor = "#fde047";
        }

        this._drawTile(gx, gy, tileColor);
      }
    }

    // 3. Mobiliário e Médico
    this._drawFurniture(palette);

    // 4. Avatar do Paciente
    if (this.patientState.visible) {
      this._drawAvatar(this.patientState.gridX, this.patientState.gridY, {
        skinColor: "#fdba74",
        shirtColor: this.patientState.shirtColor,
        hairColor: this.patientState.hairColor,
        walking: this.patientState.walking,
        sitting: this.patientState.sitting,
        mood: this.patientState.mood,
        statusIcon: this.patientState.statusIcon,
        isDoctor: false
      });
    }

    // 5. Balão de Fala estilo Habbo + HUD
    this._drawHabboChatBar(palette);
    this._drawHUD(palette);
  }

  _startLoop() {
    const step = () => {
      this._update();
      this.render();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

window.IsometricHospitalRoom = IsometricHospitalRoom;
