document.getElementById("ano").textContent = new Date().getFullYear();

const navToggle = document.getElementById("nav-toggle");
const nav = document.getElementById("nav");

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const revealEls = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
);
revealEls.forEach((el) => revealObserver.observe(el));

const marqueeStrip = document.querySelector(".marquee-strip");
const marqueeTrack = document.getElementById("marquee-track");

function setupMarquee() {
  const baseHTML = marqueeTrack.dataset.base || marqueeTrack.innerHTML;
  marqueeTrack.dataset.base = baseHTML;
  marqueeTrack.innerHTML = baseHTML;

  let guard = 0;
  while (marqueeTrack.scrollWidth < marqueeStrip.offsetWidth && guard < 20) {
    marqueeTrack.insertAdjacentHTML("beforeend", baseHTML);
    guard++;
  }

  marqueeTrack.insertAdjacentHTML("beforeend", marqueeTrack.innerHTML);
}

if (marqueeStrip && marqueeTrack) {
  setupMarquee();
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setupMarquee, 200);
  });
}

const bgMesh = document.querySelector(".bg-mesh");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasHover = window.matchMedia("(hover: hover)").matches;

// Blobs reagem sutilmente ao mouse (profundidade), sem empurrar o fundo pra fora da tela
if (bgMesh && !reduceMotion && hasHover) {
  const blobs = bgMesh.querySelectorAll(".m-blob");
  window.addEventListener(
    "mousemove",
    (e) => {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      blobs.forEach((blob, i) => {
        const depth = (i + 1) * 5;
        // usa a propriedade "translate" (independente de "transform") pra não
        // brigar com a animação de deriva que já roda em transform
        blob.style.translate = `${px * depth}px ${py * depth}px`;
      });
    },
    { passive: true }
  );
}

// Brilho de ferro em brasa que segue o cursor pela página inteira
const cursorGlow = document.querySelector(".cursor-glow");
const glowMarks = document.querySelectorAll(".section-mark, .hero-mark");
if (cursorGlow && !reduceMotion && hasHover) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight * 0.3;
  let curX = targetX;
  let curY = targetY;

  window.addEventListener(
    "mousemove",
    (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    },
    { passive: true }
  );

  const tickGlow = () => {
    curX += (targetX - curX) * 0.12;
    curY += (targetY - curY) * 0.12;
    document.documentElement.style.setProperty("--mx", `${curX}px`);
    document.documentElement.style.setProperty("--my", `${curY}px`);

    // background-attachment: fixed não é confiável junto com background-clip:
    // text (o Chrome/WebKit trata como local ao elemento), então calculamos a
    // posição do brilho relativa a cada palavra fantasma na mão, em vez de
    // depender do viewport inteiro.
    glowMarks.forEach((mark) => {
      const rect = mark.getBoundingClientRect();
      mark.style.setProperty("--gx", `${curX - rect.left}px`);
      mark.style.setProperty("--gy", `${curY - rect.top}px`);
    });

    requestAnimationFrame(tickGlow);
  };
  requestAnimationFrame(tickGlow);
}

// Formulário de contato — envia via Web3Forms sem sair da página
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  const status = contactForm.querySelector(".form-status");
  const submitBtn = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (contactForm.access_key.value.includes("COLOQUE_SUA_CHAVE")) {
      status.textContent = "Formulário ainda não configurado — fala pelo WhatsApp por enquanto.";
      status.className = "form-status is-error";
      return;
    }

    submitBtn.disabled = true;
    status.textContent = "Enviando...";
    status.className = "form-status";

    try {
      const res = await fetch(contactForm.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(contactForm),
      });
      const data = await res.json();

      if (data.success) {
        status.textContent = "Mensagem enviada. Retorno em breve.";
        status.className = "form-status is-success";
        contactForm.reset();
      } else {
        throw new Error(data.message || "Erro ao enviar");
      }
    } catch (err) {
      status.textContent = "Não deu pra enviar agora. Tenta pelo WhatsApp.";
      status.className = "form-status is-error";
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// Faíscas de forja ao clicar
if (!reduceMotion && hasHover) {
  document.addEventListener("click", (e) => {
    const count = 7;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = 36 + Math.random() * 48;
      const spark = document.createElement("span");
      spark.className = "spark";
      spark.style.left = `${e.clientX}px`;
      spark.style.top = `${e.clientY}px`;
      spark.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      spark.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      spark.addEventListener("animationend", () => spark.remove());
      document.body.appendChild(spark);
    }
  });
}
