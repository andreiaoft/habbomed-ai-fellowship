// Banco de Casos Clínicos Sintéticos com "Gabarito Reverso" (Injeção Controlada de Erros de IA)
// Desenvolvido para Pesquisa de Mestrado em IA na Educação Médica & Data Annotation Clínico

window.CLINICAL_CASES = [
  {
    id: "CASO-001",
    wing: "infecto",
    wingName: "Síndromes febris",
    difficulty: "Iniciante (Genérico)",
    title: "Febre Aguda e Mialgia Intensa",
    patient: {
      name: "Carlos Eduardo, 34 anos",
      occupation: "Entregador",
      avatarColor: "#e67e22",
      hairColor: "#2c3e50",
      shirtColor: "#3498db",
      mood: "febril",
      bubbleText: "Doutor(a), parece que um caminhão passou por cima de mim...",
      vitals: {
        pa: "100/70 mmHg (Sentado) | 85/60 mmHg (Em pé)",
        fc: "108 bpm",
        temp: "39.1 °C",
        spo2: "98% AA"
      }
    },
    chiefComplaint: "Febre alta há 4 dias (39°C), dor retro-orbitária intensa e dor no corpo todo. Hoje a febre começou a baixar, mas surgiu uma dor abdominal forte e tontura ao levantar.",
    anamnesisOptions: [
      {
        id: "q_sangramento",
        label: "Investigar sangramentos e manchas na pele",
        category: "Anamnese Dirigida",
        patientAnswer: "Notei que minha gengiva sangrou hoje de manhã ao escovar os dentes e apareceram umas pintinhas vermelhas nas pernas ontem.",
        clinicalClue: "ALERTA: Sangramento de mucosas + dor abdominal na defervescência = Sinais de Alarme para Dengue (Grupo C)!"
      },
      {
        id: "q_medicamentos",
        label: "Perguntar o que já tomou em casa",
        category: "Uso de Medicamentos",
        patientAnswer: "Tomei Dipirona ontem, mas um vizinho falou que Ibuprofeno era melhor pra dor nas costas, aí estou querendo receita dele.",
        clinicalClue: "ALERTA: AINEs (Ibuprofeno/Diclofenaco) e AAS são estritamente contraindicados na suspeita de Dengue pelo risco hemorrágico."
      },
      {
        id: "q_laco",
        label: "Realizar Prova do Laço e palpação abdominal",
        category: "Exame Físico",
        patientAnswer: "[Exame Físico] Prova do laço POSITIVA (28 petéquias). Abdome doloroso à palpação profunda em hipocôndrio direito com discreta hepatomegalia.",
        clinicalClue: "A dor abdominal intensa e a hipotensão postural são sinais de alarme neste caso de suspeita de dengue."
      },
      {
        id: "q_epidemiologia",
        label: "Perguntar sobre casos semelhantes no bairro",
        category: "Epidemiologia",
        patientAnswer: "Sim! Minha esposa e dois vizinhos da mesma rua tiveram dengue na semana passada.",
        clinicalClue: "Vínculo epidemiológico forte para arbovirose (Dengue)."
      }
    ],
    aiMetadata: {
      modelSimulated: "MedAI-LLM v2.4 (Temperature 0.7)",
      injectedMode: "ALUCINACAO_CONDUTA_E_OMISSAO_RED_FLAG",
      groundTruthVerdict: "reject",
      summaryForResearcher: "Caso clássico de Dengue Grupo C (com sinais de alarme: dor abdominal na defervescência, sangramento gengival e hipotensão postural). A IA comete dois erros graves: classifica como Grupo A (alta para casa) e prescreve Ibuprofeno (AINE contraindicado na dengue)."
    },
    aiSegments: [
      {
        id: "seg-1",
        section: "Resumo da anamnese",
        text: "Paciente masculino, 34 anos, apresenta quadro febril agudo há 4 dias associado a cefaleia retro-orbitária, mialgia difusa e exantema petequial em membros inferiores, com vínculo epidemiológico positivo para Dengue.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "Este trecho está CORRETO. A IA sintetizou adequadamente a síndrome febril exantemática e a história epidemiológica."
      },
      {
        id: "seg-2",
        section: "Avaliação de Gravidade e Estadiamento",
        text: "Como a febre entrou em remissão no 4º dia de evolução, o paciente encontra-se em fase de recuperação clínica sem sinais de gravidade, sendo classificado como Dengue Clássica (Grupo A).",
        expectedStatus: "omission",
        expectedCategory: "red_flag_omitted",
        explanation: "OMISSÃO CRÍTICA DE RED FLAG: A defervescência (queda da febre entre o 3º e 7º dia) é justamente o período crítico da dengue! O paciente apresenta dor abdominal intensa, hipotensão postural e sangramento de mucosa — sinais de alarme que o classificam no GRUPO C, jamais Grupo A."
      },
      {
        id: "seg-3",
        section: "Exames Complementares Sugeridos",
        text: "Solicitar hemograma completo obrigatório, dosagem de albumina sérica e transaminases para avaliação de hemoconcentração e plaquetopenia.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "Este trecho está CORRETO. Em pacientes com sinais de alarme/suspeita de complicação, o hemograma completo para avaliar hematócrito (hemoconcentração) e plaquetas é mandatório."
      },
      {
        id: "seg-4",
        section: "Prescrição e Conduta Terapêutica",
        text: "Liberar o paciente para hidratação oral domiciliar e recomendar ibuprofeno para a dor muscular.",
        expectedStatus: "hallucination",
        expectedCategory: "contraindication",
        explanation: "O ibuprofeno aumenta o risco de sangramento na suspeita de dengue. A alta também desconsidera os sinais de alarme registrados na investigação."
      }
    ]
  },

  {
    id: "CASO-002",
    wing: "emergencia",
    wingName: "Pronto-Socorro / Sala Amarela",
    difficulty: "Intermediário",
    title: "Desconforto Epigástrico em Paciente Diabética",
    patient: {
      name: "Dona Helena, 66 anos",
      occupation: "Aposentada",
      avatarColor: "#f39c12",
      hairColor: "#bdc3c7",
      shirtColor: "#8e44ad",
      mood: "suando",
      bubbleText: "Acho que comi algo que não caiu bem... uma queimação estranha e um suor frio.",
      vitals: {
        pa: "148/92 mmHg",
        fc: "96 bpm",
        temp: "36.3 °C",
        spo2: "94% AA"
      }
    },
    chiefComplaint: "Sensação de 'empachamento' e aperto epigástrico há 2 horas, acompanhado de náuseas, sudorese fria e falta de ar leve ao caminhar até o posto.",
    anamnesisOptions: [
      {
        id: "q_antecedentes",
        label: "Questionar antecedentes pessoais (HAS, DM, Tabagismo)",
        category: "Antecedentes",
        patientAnswer: "Tenho diabetes tipo 2 há 15 anos e pressão alta. Tomo Metformina e Losartana, mas às vezes esqueço.",
        clinicalClue: "ALERTA: Mulheres idosas e diabéticas frequentemente apresentam Síndrome Coronariana Aguda (IAM) com equivalentes anginosos atípicos (dor epigástrica, dispneia, sudorese)."
      },
      {
        id: "q_irradiacao",
        label: "Perguntar sobre irradiação da dor e fatores de piora",
        category: "Caracterização da Dor",
        patientAnswer: "Não melhora com antiácido que tomei em casa. Parece que sobe um peso pro pescoço e dá uma fraqueza.",
        clinicalClue: "Irradiação cervical + ausência de resposta a antiácido reforçam hipótese de isquemia miocárdica."
      },
      {
        id: "q_ecg",
        label: "Solicitar ECG de 12 derivações na triagem (meta < 10 min)",
        category: "Exame Complementar Imediato",
        patientAnswer: "[ECG Realizado em 6 min] Ritmo sinusal, supradesnivelamento do segmento ST de 2,5 mm em DII, DIII e aVF, com infradesnivelamento recíproco em DI e aVL.",
        clinicalClue: "DIAGNÓSTICO CRÍTICO: IAM com Supradesnivelamento de ST (IAMCSST) de parede inferior!"
      }
    ],
    aiMetadata: {
      modelSimulated: "MedAI-LLM v2.4 (Viés de Ancoragem)",
      injectedMode: "VIES_ANCORAGEM_E_ALUCINACAO_DOSE",
      groundTruthVerdict: "reject",
      summaryForResearcher: "O parecer atribui o desconforto a gastrite antes de ponderar os sintomas associados e o ECG. O último trecho acrescenta uma proposta medicamentosa perigosa."
    },
    aiSegments: [
      {
        id: "seg-201",
        section: "Análise de Sintomas Iniciais",
        text: "Paciente idosa, diabética e hipertensa, com queixa de epigastralgia aguda associada a sintomas autonômicos (sudorese fria, náuseas) e dispneia aos esforços há 2 horas.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "CORRETO. Descrição fiel do quadro clínico e dos fatores de risco cardiovasculares."
      },
      {
        id: "seg-202",
        section: "Hipótese Diagnóstica Principal",
        text: "Considerando a localização puramente epigástrica e a presença de náuseas, a hipótese principal é Gastrite Aguda Dispeptica, devendo-se administrar Omeprazol EV e observar por 6 horas antes de realizar ECG.",
        expectedStatus: "hallucination",
        expectedCategory: "anchoring_bias",
        explanation: "VIÉS DE ANCORAGEM GRAVE: Em mulheres, idosos e diabéticos, dor epigástrica com sudorese e dispneia é equivalente anginoso até que se prove o contrário. O ECG deve ser feito em até 10 minutos da chegada, jamais aguardar 6 horas!"
      },
      {
        id: "seg-203",
        section: "Interpretação Eletrocardiográfica (Caso ECG Realizado)",
        text: "O supradesnivelamento do segmento ST em derivações DII, DIII e aVF indica corrente de lesão subepicárdica compatível com Infarto Agudo do Miocárdio de parede inferior.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "CORRETO. DII, DIII e aVF avaliam a parede inferior do ventrículo esquerdo."
      },
      {
        id: "seg-204",
        section: "Conduta Farmacológica de Emergência",
        text: "Caso confirmado o infarto, usar uma dose dez vezes maior que a dose de ataque habitual de AAS e administrar nitrato mesmo diante de suspeita de infarto do ventrículo direito.",
        expectedStatus: "hallucination",
        expectedCategory: "pharma_hallucination",
        explanation: "A proposta multiplica indevidamente a dose de ataque e ignora o risco de hipotensão com nitrato quando há suspeita de infarto do ventrículo direito."
      }
    ]
  },

  {
    id: "CASO-003",
    wing: "ambulatorio",
    wingName: "Ambulatório geral",
    difficulty: "Iniciante",
    title: "Dor Lombar Pós-Esforço sem Sinais de Alarme",
    patient: {
      name: "Marcos Vinícius, 29 anos",
      occupation: "Analista de Sistemas",
      avatarColor: "#27ae60",
      hairColor: "#5d4037",
      shirtColor: "#16a085",
      mood: "dor_leve",
      bubbleText: "Fui ajudar na mudança no fim de semana e travei a lombar...",
      vitals: {
        pa: "118/76 mmHg",
        fc: "74 bpm",
        temp: "36.5 °C",
        spo2: "99% AA"
      }
    },
    chiefComplaint: "Dor na região lombar baixa há 3 dias após carregar caixas pesadas. A dor piora ao flexionar o tronco e melhora quando deita de lado.",
    anamnesisOptions: [
      {
        id: "q_redflags_lombar",
        label: "Pesquisar Sinais de Alarme (Febre, perda de peso, incontinência, anestesia em sela)",
        category: "Triagem de Red Flags",
        patientAnswer: "Não tive febre, urino normalmente e não sinto dormência nas partes íntimas nem perda de força nas pernas.",
        clinicalClue: "Ausência de sinais de alarme (sem síndrome da cauda equina, sem sinais infecciosos ou neoplásicos)."
      },
      {
        id: "q_lasegue",
        label: "Realizar manobra de Lasègue e testar reflexos patelar/aquileu",
        category: "Exame Físico Neurológico",
        patientAnswer: "[Exame Físico] Contratura da musculatura paravertebral lombar à palpação. Manobra de Lasègue NEGATIVA bilateralmente. Força grau V e sensibilidade preservadas.",
        clinicalClue: "Lombalgia mecânica aguda simples sem radiculopatia."
      },
      {
        id: "q_imagem_pedido",
        label: "Perguntar expectativas do paciente sobre exames",
        category: "Comunicação Clínica",
        patientAnswer: "Queria saber se preciso fazer uma Ressonância Magnética urgente pra ver se estourou a coluna.",
        clinicalClue: "Diretrizes Choosing Wisely: Não solicitar exames de imagem na lombalgia aguda (< 4-6 semanas) sem sinais de alarme."
      }
    ],
    aiMetadata: {
      modelSimulated: "MedAI-LLM v2.4 (Padrão-Ouro Validado)",
      injectedMode: "CASO_CONTROLE_100_CORRETO",
      groundTruthVerdict: "approve",
      summaryForResearcher: "O gabarito deste caso aceita os quatro trechos. Aqui, marcar uma falha que o gabarito não prevê também faz parte do exercício de calibrar a confiança."
    },
    aiSegments: [
      {
        id: "seg-301",
        section: "Síntese Clínica e Triagem de Gravidade",
        text: "Paciente jovem com lombalgia aguda (< 4 semanas) desencadeada por esforço mecânico, sem irradiação radicular (Lasègue negativo) e sem sinais de alarme ('red flags' ausentes).",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "CORRETO. Triagem exemplar descartando síndrome da cauda equina, déficit motor ou sinais sistêmicos."
      },
      {
        id: "seg-302",
        section: "Decisão sobre Exames de Imagem",
        text: "Não há indicação de radiografia, tomografia ou ressonância magnética da coluna lombar neste momento, visto que exames de imagem precoces sem sinais de alarme não melhoram o desfecho clínico e aumentam o risco de intervenções desnecessárias.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "CORRETO. Segue estritamente as recomendações internacionais (ACP / Choosing Wisely) para lombalgia aguda inespecífica."
      },
      {
        id: "seg-303",
        section: "Conduta Terapêutica e Orientações",
        text: "Orientar que mantenha as atividades habituais conforme tolerado e discutir opções para alívio dos sintomas, considerando os riscos individuais.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "CORRETO. Manter-se ativo produz recuperação mais rápida do que repouso absoluto no leito."
      },
      {
        id: "seg-304",
        section: "Rede de Segurança (Safety Netting)",
        text: "Orientar retorno imediato caso surjam sinais de alarme, como retenção/incontinência urinária, anestesia em sela, febre ou perda de força progressiva nos membros inferiores.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "CORRETO. A orientação de sinais de alarme na alta é parte obrigatória da boa prática médica."
      }
    ]
  },

  {
    id: "CASO-004",
    wing: "ambulatorio",
    wingName: "Ambulatório Geral / Pré-Natal",
    difficulty: "Intermediário",
    title: "Disúria e Polaciúria em Gestante do 2º Trimestre",
    patient: {
      name: "Juliana Costa, 26 anos",
      occupation: "Professora",
      avatarColor: "#9b59b6",
      hairColor: "#8d6e63",
      shirtColor: "#e84393",
      mood: "desconforto",
      bubbleText: "Estou indo ao banheiro toda hora e arde muito no final...",
      vitals: {
        pa: "110/70 mmHg",
        fc: "82 bpm",
        temp: "36.6 °C",
        spo2: "99% AA"
      }
    },
    chiefComplaint: "Dor e ardência ao urinar (disúria) há 2 dias, com urgência miccional. Está com 18 semanas de gestação (G1P0). Nega febre ou dor lombar.",
    anamnesisOptions: [
      {
        id: "q_giordano",
        label: "Avaliar febre, calafrios e sinal de Giordano",
        category: "Exame Físico Obstétrico/Geral",
        patientAnswer: "[Exame Físico] Afebril (36.6°C), bom estado geral. Sinal de Giordano NEGATIVO bilateralmente. BCF presente (144 bpm).",
        clinicalClue: "Quadro restrito ao trato urinário baixo (Cistite Aguda na Gestação), sem sinais de pielonefrite."
      },
      {
        id: "q_alergias_gestante",
        label: "Perguntar sobre alergias medicamentosas e trimestre gestacional",
        category: "Segurança Medicamentosa",
        patientAnswer: "Estou na 18ª semana (2º trimestre). Não tenho alergia a nenhum remédio.",
        clinicalClue: "A escolha empírica do antimicrobiano deve considerar gestação, alergias, resistência local e cultura."
      },
      {
        id: "q_urocultura",
        label: "Verificar necessidade de Urocultura antes do tratamento empírico",
        category: "Propedêutica",
        patientAnswer: "Coleta de jato médio urinário realizada na unidade para Urocultura com Antibiograma.",
        clinicalClue: "A urocultura permite confirmar o agente e adequar o antibiótico conforme a sensibilidade."
      }
    ],
    aiMetadata: {
      modelSimulated: "MedAI-LLM v2.4 (Erro Teratogênico)",
      injectedMode: "CONTRAINDICACAO_GESTACAO",
      groundTruthVerdict: "reject",
      summaryForResearcher: "A gestação e o resultado da urocultura importam para escolher e ajustar o antibiótico. O parecer também omite orientações para o caso de recorrência ou agravamento dos sintomas."
    },
    aiSegments: [
      {
        id: "seg-401",
        section: "Diagnóstico Sindrômico",
        text: "Gestante de 18 semanas apresentando sintomas clássicos de infecção do trato urinário baixo (Cistite Aguda), afebril e com sinal de Giordano negativo, sem achados atuais que apontem para pielonefrite.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "CORRETO. Diferenciação clínica adequada entre cistite e pielonefrite na gestante."
      },
      {
        id: "seg-402",
        section: "Propedêutica Laboratorial",
        text: "Solicitar urocultura com antibiograma imediatamente antes do início da antibioticoterapia empírica.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "CORRETO. Na gestação, ao contrário de mulheres jovens não gestantes com cistite simples, a urocultura é sempre obrigatória."
      },
      {
        id: "seg-403",
        section: "Prescrição Antimicrobiana Empírica",
        text: "Escolher ciprofloxacino de rotina como primeira opção empírica, considerando apenas a penetração urinária do fármaco.",
        expectedStatus: "hallucination",
        expectedCategory: "contraindication",
        explanation: "A penetração urinária sozinha não justifica essa escolha empírica na gestação. O tratamento deve considerar a segurança gestacional, o perfil de resistência e o resultado da cultura."
      },
      {
        id: "seg-404",
        section: "Seguimento Clínico Pós-Tratamento",
        text: "Caso a disúria melhore em 48 horas, encerrar o acompanhamento mesmo se surgirem febre, dor lombar ou recorrência dos sintomas depois.",
        expectedStatus: "omission",
        expectedCategory: "red_flag_omitted",
        explanation: "O trecho omite a necessidade de reavaliação se surgirem febre, dor lombar ou recorrência. O seguimento e a repetição da cultura devem observar o quadro e o protocolo local."
      }
    ]
  },

  {
    id: "CASO-005",
    wing: "geriatria",
    wingName: "Ala de Geriatria & Polifarmácia",
    difficulty: "Avançado",
    title: "Confusão Mental Aguda em Idoso com Doença Renal",
    patient: {
      name: "Sr. Antônio, 79 anos",
      occupation: "Aposentado",
      avatarColor: "#34495e",
      hairColor: "#ecf0f1",
      shirtColor: "#7f8c8d",
      mood: "confuso",
      bubbleText: "Onde está minha chave do caminhão? Preciso ir trabalhar... (Desorientado)",
      vitals: {
        pa: "132/80 mmHg",
        fc: "88 bpm",
        temp: "36.1 °C",
        spo2: "95% AA"
      }
    },
    chiefComplaint: "Filha relata que o pai acordou hoje desorientado, trocando o dia pela noite e com atenção flutuante. Ontem estava lúcido e conversando normalmente.",
    anamnesisOptions: [
      {
        id: "q_medicacao_recente",
        label: "Revisar lista de medicamentos e introduções recentes (Conciliação Medicamentosa)",
        category: "Farmacovigilância",
        patientAnswer: "Ele tem Doença Renal Crônica estágio 4 (TFG = 24 mL/min). Anteontem um médico passou Amitriptilina 50mg à noite pra dor nas pernas e um xarope antialérgico (Dexclorfeniramina).",
        clinicalClue: "ALERTA: Carga anticolinérgica altíssima (Amitriptilina + Anti-histamínico de 1ª geração) precipitando Delirium agudo em idoso!"
      },
      {
        id: "q_globo_vesical",
        label: "Examinar abdome inferior (bexigoma) e sinais focais neurológicos",
        category: "Exame Físico",
        patientAnswer: "[Exame Físico] Sem déficits focais motores. Massa palpável e maciça em hipogástrio (Globo Vesical / Retenção Urinária aguda por efeito anticolinérgico). CAM (Confusion Assessment Method) POSITIVO.",
        clinicalClue: "Retenção urinária aguda secundária a medicamentos anticolinérgicos perpetuando o Delirium."
      },
      {
        id: "q_funcao_renal",
        label: "Checar exames laboratoriais recentes (Creatinina, Eletrólitos, Glicemia)",
        category: "Laboratório",
        patientAnswer: "Glicemia capilar: 104 mg/dL. Creatinina: 2,6 mg/dL (TFG estimada: 24 mL/min/1,73m²). Sódio: 138 mEq/L.",
        clinicalClue: "DRC Estágio 4: Contraindica fármacos nefrotóxicos e exige ajuste rigoroso de dose renal."
      }
    ],
    aiMetadata: {
      modelSimulated: "MedAI-LLM v2.4 (Alucinação de Critérios de Beers)",
      injectedMode: "ALUCINACAO_GERIATRIA_BEERS",
      groundTruthVerdict: "reject",
      summaryForResearcher: "A mudança aguda de atenção coincide com medicamentos de ação anticolinérgica e retenção urinária. Dois trechos do parecer deixam de ponderar esses riscos."
    },
    aiSegments: [
      {
        id: "seg-501",
        section: "Reconhecimento Sindrômico",
        text: "Quadro de início agudo (menos de 24 horas) e curso flutuante de desorientação e déficit de atenção em idoso previamente lúcido, preenchendo critérios diagnósticos do CAM para Delirium.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "CORRETO. O início agudo e a flutuação da atenção diferenciam o Delirium de quadros demenciais crônicos."
      },
      {
        id: "seg-502",
        section: "Avaliação Farmacológica (Critérios de Beers)",
        text: "A introdução recente de Amitriptilina 50mg e Dexclorfeniramina é segura nesta faixa etária e deve ser mantida para garantir o sono do paciente durante a internação.",
        expectedStatus: "hallucination",
        expectedCategory: "contraindication",
        explanation: "ERRO GRAVÍSSIMO (CRITÉRIOS DE BEERS): Antidepressivos tricíclicos (Amitriptilina) e anti-histamínicos de 1ª geração (Dexclorfeniramina) possuem forte ação anticolinérgica, sendo os principais causadores do Delirium e da retenção urinária (bexigoma) deste paciente! Devem ser suspensos imediatamente."
      },
      {
        id: "seg-503",
        section: "Manejo das Causas Reversíveis",
        text: "Realizar sondagem vesical de alívio para resolução imediata do globo vesical (retenção urinária aguda), medida fundamental para reverter o fator precipitante do delirium.",
        expectedStatus: "correct",
        expectedCategory: null,
        explanation: "CORRETO. A retenção urinária ('bexigoma') causada pelos anticolinérgicos é causa clássica de agitação e delirium no idoso."
      },
      {
        id: "seg-504",
        section: "Manejo da Agitação e Função Renal",
        text: "Para controlar a agitação, iniciar diazepam de rotina e aumentar a dose de contraste de uma tomografia de crânio sem indicar o motivo do exame.",
        expectedStatus: "hallucination",
        expectedCategory: "pharma_hallucination",
        explanation: "O uso rotineiro de benzodiazepínico pode agravar o delirium. O trecho tampouco justifica o exame ou a dose de contraste diante da doença renal registrada no caso."
      }
    ]
  }
];

// Categorias de Taxonomia de Data Annotation para o Mestrado
window.ANNOTATION_CATEGORIES = [
  { id: "pharma_hallucination", label: "Alucinação Farmacológica / Dose Errada", icon: "💊" },
  { id: "contraindication", label: "Contraindicação Ignorada (Alergia/Gestação/Doença)", icon: "⛔" },
  { id: "red_flag_omitted", label: "Sinal de Alarme (Red Flag) ou Protocolo Omitido", icon: "🚨" },
  { id: "anchoring_bias", label: "Viés de Ancoragem / Diagnóstico Prematuro", icon: "⚓" },
  { id: "unnecessary_exam", label: "Exame Desnecessário / Iatrogenia", icon: "🔬" }
];
