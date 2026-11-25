const STORAGE_KEY = "urbanpet_consultas";
const PROFILE_KEY = "urbanpet_perfil";

const profissionais = [
  { nome: "Dra. Ana Costa", especialidade: "Clínica geral" },
  { nome: "Dr. Lucas Mendes", especialidade: "Dermatologia veterinária" },
  { nome: "Dra. Beatriz Lima", especialidade: "Vacinação e prevenção" }
];

function obterConsultas() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function salvarConsultas(consultas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consultas));
}

function perfilAtual() {
  return localStorage.getItem(PROFILE_KEY) || "tutor";
}

function mostrarMensagem(elemento, mensagem, tipo) {
  if (!elemento) return;
  elemento.textContent = mensagem;
  elemento.className = `form-message ${tipo}`;
}

// Login demonstrativo: não existe autenticação real ou conexão com servidor.
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const perfil = document.getElementById("perfil").value;
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const mensagem = document.getElementById("loginMessage");

    if (!perfil || !email || !senha) {
      mostrarMensagem(mensagem, "Preencha o tipo de acesso, o e-mail e a senha.", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mostrarMensagem(mensagem, "Informe um endereço de e-mail válido.", "error");
      return;
    }
    if (senha.length < 4) {
      mostrarMensagem(mensagem, "A senha deve ter pelo menos 4 caracteres.", "error");
      return;
    }

    localStorage.setItem(PROFILE_KEY, perfil);
    localStorage.setItem("urbanpet_email", email);
    mostrarMensagem(mensagem, "Acesso realizado! Redirecionando...", "success");
    setTimeout(() => window.location.href = "lista.html", 450);
  });
}

// A listagem muda conforme o perfil escolhido na tela de login.
const appointmentList = document.getElementById("appointmentList");
if (appointmentList) {
  const perfil = perfilAtual();
  const ehVeterinario = perfil === "veterinario";
  const consultas = obterConsultas();
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  document.getElementById("profileLabel").textContent = ehVeterinario ? "Veterinário autônomo" : "Área do tutor";
  document.getElementById("listTitle").textContent = ehVeterinario ? "Consultas recebidas" : "Minhas consultas";
  document.getElementById("listSubtitle").textContent = ehVeterinario
    ? "Acompanhe os pedidos de consulta direcionados aos profissionais."
    : "Acompanhe os agendamentos do seu pet.";
  document.getElementById("tableHeading").textContent = ehVeterinario ? "Solicitações de consulta" : "Seus agendamentos";
  document.getElementById("tableDescription").textContent = ehVeterinario
    ? "Demonstração dos agendamentos registrados neste navegador."
    : "As consultas salvas neste navegador aparecem aqui.";
  document.getElementById("newAppointmentLink").style.display = ehVeterinario ? "none" : "inline-flex";
  document.getElementById("emptyAction").style.display = ehVeterinario ? "none" : "inline-flex";
  document.getElementById("professionalsCard").style.display = ehVeterinario ? "none" : "block";
  document.getElementById("thirdLabel").textContent = ehVeterinario ? "Profissionais cadastrados" : "Veterinários disponíveis";

  const exibidas = ehVeterinario
    ? consultas
    : consultas.filter(item => item.emailTutor === localStorage.getItem("urbanpet_email"));
  const proximas = exibidas.filter(item => new Date(`${item.data}T00:00:00`) >= hoje);

  document.getElementById("totalCount").textContent = exibidas.length;
  document.getElementById("nextCount").textContent = proximas.length;
  document.getElementById("professionalCount").textContent = profissionais.length;
  document.getElementById("listCount").textContent = `${exibidas.length} ${exibidas.length === 1 ? "registro" : "registros"}`;

  if (exibidas.length === 0) {
    document.getElementById("emptyState").style.display = "block";
  } else {
    document.getElementById("emptyState").style.display = "none";
    exibidas.sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
    appointmentList.innerHTML = exibidas.map(item => {
      const data = new Date(`${item.data}T00:00:00`);
      const dia = String(data.getDate()).padStart(2, "0");
      const mes = data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const detalhe = ehVeterinario
        ? `Tutor: ${item.emailTutor} · ${item.especie} · ${item.motivo}`
        : `${item.veterinario} · ${item.motivo}`;
      return `<article class="appointment-item">
        <div class="date-tile"><strong>${dia}</strong><span>${mes} · ${item.horario}</span></div>
        <div class="appointment-info"><strong>${item.pet}</strong><span>${detalhe}</span></div>
        <span class="status">Solicitada</span>
      </article>`;
    }).join("");
  }
}

const appointmentForm = document.getElementById("appointmentForm");
if (appointmentForm) {
  const dataInput = document.getElementById("date");
  const hojeISO = new Date();
  hojeISO.setMinutes(hojeISO.getMinutes() - hojeISO.getTimezoneOffset());
  dataInput.min = hojeISO.toISOString().slice(0, 10);

  appointmentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const pet = document.getElementById("petName").value.trim();
    const especie = document.getElementById("species").value;
    const motivo = document.getElementById("reason").value;
    const vetSelecionado = document.getElementById("vet").value;
    const data = dataInput.value;
    const horario = document.getElementById("time").value;
    const mensagem = document.getElementById("appointmentMessage");

    if (!pet || !especie || !motivo || !vetSelecionado || !data || !horario) {
      mostrarMensagem(mensagem, "Preencha todos os campos obrigatórios antes de confirmar.", "error");
      return;
    }
    const dataEscolhida = new Date(`${data}T00:00:00`);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataEscolhida < hoje) {
      mostrarMensagem(mensagem, "Escolha uma data igual ou posterior à data de hoje.", "error");
      return;
    }

    const [veterinario, especialidade] = vetSelecionado.split("|");
    const consultas = obterConsultas();
    const conflito = consultas.some(item =>
      item.veterinario === veterinario && item.data === data && item.horario === horario
    );
    if (conflito) {
      mostrarMensagem(mensagem, "Esse profissional já possui uma solicitação nesse dia e horário. Escolha outro horário.", "error");
      return;
    }

    consultas.push({
      id: Date.now(),
      pet,
      especie,
      idade: document.getElementById("petAge").value.trim(),
      motivo,
      veterinario,
      especialidade,
      data,
      horario,
      observacoes: document.getElementById("notes").value.trim(),
      emailTutor: localStorage.getItem("urbanpet_email") || "tutor@urbanpet.com"
    });
    salvarConsultas(consultas);
    mostrarMensagem(mensagem, "Agendamento registrado com sucesso!", "success");
    appointmentForm.reset();
    setTimeout(() => window.location.href = "lista.html", 700);
  });
}

document.querySelectorAll("#logoutButton").forEach(botao => {
  botao.addEventListener("click", () => {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem("urbanpet_email");
    window.location.href = "index.html";
  });
});
