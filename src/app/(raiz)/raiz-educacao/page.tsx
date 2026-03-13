"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

interface StatItem {
  value: string;
  label: string;
}

interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  initials: string;
  color: string;
}

interface NewsItem {
  title: string;
  date: string;
  summary: string;
  category: string;
  color: string;
}

interface SidewaysSection {
  title: string;
  subtitle: string;
  description: string;
  linkLabel: string;
  href: string;
  imageAlt: string;
  bgColor: string;
  imageBg: string;
  imageSvg: React.ReactNode;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const mainNavItems: NavItem[] = [
  {
    label: "A Escola",
    href: "/raiz-educacao/sobre",
    children: [
      { label: "Nossa História", href: "/raiz-educacao/sobre/historia" },
      { label: "Missão e Valores", href: "/raiz-educacao/sobre/missao" },
      { label: "Equipe Pedagógica", href: "/raiz-educacao/sobre/equipe" },
      { label: "Infraestrutura", href: "/raiz-educacao/sobre/infraestrutura" },
      { label: "Trabalhe Conosco", href: "/raiz-educacao/sobre/carreiras" },
    ],
  },
  {
    label: "Ensino",
    href: "/raiz-educacao/ensino",
    children: [
      { label: "Educação Infantil", href: "/raiz-educacao/ensino/infantil" },
      { label: "Ensino Fundamental I", href: "/raiz-educacao/ensino/fundamental-i" },
      { label: "Ensino Fundamental II", href: "/raiz-educacao/ensino/fundamental-ii" },
      { label: "Ensino Médio", href: "/raiz-educacao/ensino/medio" },
      { label: "Projeto Pedagógico", href: "/raiz-educacao/ensino/projeto" },
      { label: "Resultados ENEM", href: "/raiz-educacao/ensino/resultados" },
    ],
  },
  {
    label: "Atividades",
    href: "/raiz-educacao/atividades",
    children: [
      { label: "Esportes", href: "/raiz-educacao/atividades/esportes" },
      { label: "Artes", href: "/raiz-educacao/atividades/artes" },
      { label: "Tecnologia", href: "/raiz-educacao/atividades/tecnologia" },
      { label: "Clube de Leitura", href: "/raiz-educacao/atividades/leitura" },
      { label: "Projetos Sociais", href: "/raiz-educacao/atividades/social" },
    ],
  },
  {
    label: "Comunidade",
    href: "/raiz-educacao/comunidade",
    children: [
      { label: "Pais e Responsáveis", href: "/raiz-educacao/comunidade/pais" },
      { label: "Ex-Alunos", href: "/raiz-educacao/comunidade/ex-alunos" },
      { label: "Calendário", href: "/raiz-educacao/comunidade/calendario" },
      { label: "Notícias", href: "/raiz-educacao/noticias" },
    ],
  },
  {
    label: "Admissões",
    href: "/raiz-educacao/admissoes",
    children: [
      { label: "Como se Inscrever", href: "/raiz-educacao/admissoes/inscricao" },
      { label: "Bolsas de Estudo", href: "/raiz-educacao/admissoes/bolsas" },
      { label: "Mensalidades", href: "/raiz-educacao/admissoes/mensalidades" },
      { label: "Agende uma Visita", href: "/raiz-educacao/admissoes/visita" },
    ],
  },
];

const utilityNavItems = [
  { label: "Notícias", href: "/raiz-educacao/noticias" },
  { label: "Calendário", href: "/raiz-educacao/comunidade/calendario" },
  { label: "Ex-Alunos", href: "/raiz-educacao/comunidade/ex-alunos" },
  { label: "Portal do Aluno", href: "/raiz-educacao/portal", highlight: true },
];

const stats: StatItem[] = [
  { value: "32", label: "Anos de História" },
  { value: "98%", label: "Aprovação no ENEM" },
  { value: "12:1", label: "Alunos por Professor" },
  { value: "40%", label: "Alunos com Bolsa" },
  { value: "1.200", label: "Alunos Matriculados" },
  { value: "85", label: "Professores Especializados" },
  { value: "18", label: "Atividades Extracurriculares" },
  { value: "6", label: "Laboratórios Modernos" },
];

const testimonials: TestimonialItem[] = [
  {
    quote:
      "A Raiz Educação transformou minha visão de mundo. Aprendi que o conhecimento é a semente mais poderosa que podemos plantar em nosso futuro.",
    author: "Ana Beatriz Souza",
    role: "Ex-aluna, turma de 2022 — FUVEST",
    initials: "AB",
    color: "bg-emerald-700",
  },
  {
    quote:
      "Nossa escola acredita que cada criança tem um potencial único. Aqui, cultivamos não apenas o saber, mas a curiosidade, a empatia e a coragem de sonhar alto.",
    author: "Prof. Marcos Andrade",
    role: "Diretor Pedagógico",
    initials: "MA",
    color: "bg-amber-700",
  },
  {
    quote:
      "Quando entrei na Raiz, eu mal acreditava que conseguiria chegar à faculdade. O suporte dos professores e o ambiente acolhedor fizeram toda a diferença.",
    author: "Pedro Henrique Lima",
    role: "Aluno do 3º ano do Ensino Médio",
    initials: "PH",
    color: "bg-teal-700",
  },
];

const sidewaysSections: SidewaysSection[] = [
  {
    title: "Pertencimento",
    subtitle: "um lugar para",
    description:
      "Na Raiz, cada aluno é acolhido como parte de uma grande família. Construímos vínculos que vão além da sala de aula — formamos pessoas que se importam umas com as outras e com o mundo ao redor.",
    linkLabel: "Conheça a Comunidade",
    href: "/raiz-educacao/comunidade",
    imageAlt: "Alunos em atividade colaborativa",
    bgColor: "bg-emerald-800",
    imageBg: "bg-emerald-100",
    imageSvg: (
      <svg viewBox="0 0 400 300" className="w-full h-full" fill="none">
        <rect width="400" height="300" fill="#d1fae5" />
        <circle cx="120" cy="150" r="60" fill="#10b981" opacity="0.3" />
        <circle cx="200" cy="120" r="45" fill="#059669" opacity="0.4" />
        <circle cx="280" cy="150" r="55" fill="#10b981" opacity="0.3" />
        <rect x="60" y="180" width="280" height="8" rx="4" fill="#6ee7b7" />
        <rect x="80" y="198" width="240" height="6" rx="3" fill="#a7f3d0" />
        <rect x="100" y="214" width="200" height="6" rx="3" fill="#a7f3d0" />
        <path d="M120 150 Q160 100 200 120 Q240 140 280 150" stroke="#047857" strokeWidth="3" fill="none" />
      </svg>
    ),
  },
  {
    title: "Excelência Acadêmica",
    subtitle: "compromisso com a",
    description:
      "Professores altamente qualificados, metodologias inovadoras e um currículo robusto preparam nossos alunos para os maiores desafios — sejam vestibulares, olimpíadas do conhecimento ou simplesmente a vida.",
    linkLabel: "Explore o Ensino",
    href: "/raiz-educacao/ensino",
    imageAlt: "Professora conduzindo aula interativa",
    bgColor: "bg-stone-800",
    imageBg: "bg-amber-50",
    imageSvg: (
      <svg viewBox="0 0 400 300" className="w-full h-full" fill="none">
        <rect width="400" height="300" fill="#fef3c7" />
        <rect x="40" y="60" width="200" height="140" rx="8" fill="#92400e" opacity="0.15" />
        <rect x="50" y="70" width="180" height="8" rx="3" fill="#d97706" opacity="0.5" />
        <rect x="50" y="86" width="160" height="6" rx="3" fill="#d97706" opacity="0.4" />
        <rect x="50" y="100" width="170" height="6" rx="3" fill="#d97706" opacity="0.4" />
        <rect x="50" y="114" width="140" height="6" rx="3" fill="#d97706" opacity="0.3" />
        <rect x="50" y="130" width="165" height="6" rx="3" fill="#d97706" opacity="0.3" />
        <circle cx="310" cy="120" r="55" fill="#f59e0b" opacity="0.2" />
        <path d="M285 120 L300 105 L315 120 L300 135 Z" fill="#d97706" opacity="0.6" />
        <circle cx="310" cy="120" r="10" fill="#92400e" opacity="0.4" />
        <rect x="60" y="230" width="280" height="4" rx="2" fill="#fbbf24" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: "Diversidade e Inclusão",
    subtitle: "força na",
    description:
      "Acreditamos que a riqueza de uma escola está em sua pluralidade. Valorizamos cada história, cada cultura e cada jeito de aprender. Nossa política de bolsas garante que talento não seja limitado por condição financeira.",
    linkLabel: "Saiba Mais sobre Bolsas",
    href: "/raiz-educacao/admissoes/bolsas",
    imageAlt: "Alunos de diferentes origens em conjunto",
    bgColor: "bg-teal-800",
    imageBg: "bg-teal-50",
    imageSvg: (
      <svg viewBox="0 0 400 300" className="w-full h-full" fill="none">
        <rect width="400" height="300" fill="#f0fdfa" />
        <circle cx="140" cy="130" r="40" fill="#0d9488" opacity="0.25" />
        <circle cx="200" cy="110" r="35" fill="#14b8a6" opacity="0.3" />
        <circle cx="260" cy="130" r="38" fill="#0d9488" opacity="0.25" />
        <circle cx="170" cy="160" r="30" fill="#5eead4" opacity="0.4" />
        <circle cx="230" cy="155" r="32" fill="#5eead4" opacity="0.35" />
        <path d="M100 220 Q200 190 300 220" stroke="#0f766e" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="80" y="240" width="240" height="6" rx="3" fill="#99f6e4" />
        <rect x="100" y="255" width="200" height="5" rx="2.5" fill="#b2f5ea" />
      </svg>
    ),
  },
];

const newsItems: NewsItem[] = [
  {
    title: "Alunos da Raiz conquistam medalhas na Olimpíada Brasileira de Matemática",
    date: "10 Mar 2026",
    summary:
      "Sete estudantes do Ensino Médio representaram a escola na OBMEP e trouxeram três medalhas de ouro e quatro de prata — melhor resultado da história da instituição.",
    category: "Destaque",
    color: "bg-emerald-700",
  },
  {
    title: "Novo laboratório de robótica e IA é inaugurado para o Ensino Fundamental II",
    date: "24 Fev 2026",
    summary:
      "Com equipamentos de última geração, o espaço acolherá projetos de programação, automação e inteligência artificial a partir do 6º ano.",
    category: "Infraestrutura",
    color: "bg-teal-700",
  },
  {
    title: "Raiz Educação lança programa de mentoria para alunos do 3º ano do Médio",
    date: "18 Fev 2026",
    summary:
      "Ex-alunos aprovados nas melhores universidades do país retornam à escola para orientar os formandos durante a jornada de vestibulares.",
    category: "Comunidade",
    color: "bg-amber-700",
  },
  {
    title: "Feira Cultural celebra a diversidade com apresentações de 12 países",
    date: "5 Fev 2026",
    summary:
      "O evento anual reuniu famílias, alunos e professores em uma celebração da pluralidade cultural que marca a identidade da Raiz Educação.",
    category: "Eventos",
    color: "bg-stone-600",
  },
  {
    title: "Parceria com universidade pública oferece aulas experimentais de ciências",
    date: "28 Jan 2026",
    summary:
      "Em convênio com a USP, alunos do Ensino Médio visitarão laboratórios de pesquisa e participarão de projetos científicos reais ao longo de 2026.",
    category: "Acadêmico",
    color: "bg-emerald-700",
  },
];

const ctaCards = [
  {
    title: "Agende uma Visita",
    description: "Venha conhecer nossa estrutura e sentir a energia do nosso ambiente de aprendizagem.",
    linkLabel: "Agendar Visita",
    href: "/raiz-educacao/admissoes/visita",
    bg: "bg-emerald-700",
    icon: (
      <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Conheça as Bolsas",
    description: "Acreditamos que nenhum talento deve ser desperdiçado por falta de oportunidade.",
    linkLabel: "Ver Bolsas Disponíveis",
    href: "/raiz-educacao/admissoes/bolsas",
    bg: "bg-amber-700",
    icon: (
      <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: "Faça sua Matrícula",
    description: "Vagas limitadas para 2027. Garanta já o futuro do seu filho em uma escola de excelência.",
    linkLabel: "Iniciar Matrícula",
    href: "/raiz-educacao/admissoes/inscricao",
    bg: "bg-teal-700",
    icon: (
      <svg className="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RaizLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* Leaf/root icon */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="flex-shrink-0">
        <rect width="40" height="40" rx="10" fill="#1a5c3a" />
        <path
          d="M20 32 C20 32 10 26 10 18 C10 13.6 14.5 10 20 10 C25.5 10 30 13.6 30 18 C30 26 20 32 20 32Z"
          fill="#4ade80"
          opacity="0.9"
        />
        <path
          d="M20 32 L20 18"
          stroke="#1a5c3a"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20 22 C17 20 14 20 12 21"
          stroke="#1a5c3a"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M20 25 C23 23 26 23 28 24"
          stroke="#1a5c3a"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <div className="leading-tight">
        <div className="font-black text-xl text-emerald-900 tracking-tight">Raiz</div>
        <div className="font-medium text-xs text-emerald-700 tracking-widest uppercase">Educação</div>
      </div>
    </div>
  );
}

function TestimonialSlider({ items }: { items: TestimonialItem[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {items.map((t, i) => (
          <div key={i} className="min-w-full px-4 md:px-16 py-8">
            <div className="max-w-3xl mx-auto text-center">
              <div
                className={`w-20 h-20 rounded-full ${t.color} flex items-center justify-center text-white text-2xl font-black mx-auto mb-6`}
              >
                {t.initials}
              </div>
              <blockquote className="text-xl md:text-2xl font-light text-white leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="text-emerald-300 font-semibold">{t.author}</div>
              <div className="text-emerald-500 text-sm mt-1">{t.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-4 pb-4">
        <button
          onClick={() => setCurrent((c) => (c - 1 + items.length) % items.length)}
          className="w-10 h-10 rounded-full border border-emerald-600 text-emerald-400 hover:bg-emerald-800 transition-colors flex items-center justify-center"
          aria-label="Anterior"
        >
          ‹
        </button>
        <div className="flex gap-1">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-8 h-6 flex items-center justify-center"
              aria-label={`Slide ${i + 1}`}
            >
              <span
                className={`block w-6 h-2.5 rounded-full transition-transform duration-300 ${
                  i === current ? "bg-emerald-400 scale-x-100" : "bg-emerald-700 scale-x-[0.42]"
                }`}
              />
            </button>
          ))}
        </div>
        <button
          onClick={() => setCurrent((c) => (c + 1) % items.length)}
          className="w-10 h-10 rounded-full border border-emerald-600 text-emerald-400 hover:bg-emerald-800 transition-colors flex items-center justify-center"
          aria-label="Próximo"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function NewsSlider({ items }: { items: NewsItem[] }) {
  const [current, setCurrent] = useState(0);
  return (
    <div className="relative">
      {/* Desktop: show 3 cards */}
      <div className="hidden lg:grid grid-cols-3 gap-6">
        {items.slice(0, 3).map((item, i) => (
          <article key={i} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:-translate-y-1 transition-transform">
            <div className={`h-3 ${item.color}`} />
            <div className="p-6">
              <span className={`inline-block text-xs font-bold uppercase tracking-wider text-white ${item.color} px-3 py-1 rounded-full mb-4`}>
                {item.category}
              </span>
              <h3 className="font-bold text-stone-800 text-base leading-snug mb-3 group-hover:text-emerald-700 transition-colors">
                {item.title}
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed line-clamp-3">{item.summary}</p>
              <div className="mt-4 text-xs text-stone-500 font-medium">{item.date}</div>
            </div>
          </article>
        ))}
      </div>

      {/* Mobile: slider */}
      <div className="lg:hidden relative overflow-hidden">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {items.map((item, i) => (
            <article key={i} className="min-w-full px-2">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
                <div className={`h-3 ${item.color}`} />
                <div className="p-6">
                  <span className={`inline-block text-xs font-bold uppercase tracking-wider text-white ${item.color} px-3 py-1 rounded-full mb-4`}>
                    {item.category}
                  </span>
                  <h3 className="font-bold text-stone-800 text-base leading-snug mb-3">{item.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.summary}</p>
                  <div className="mt-4 text-xs text-stone-500 font-medium">{item.date}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="flex justify-center gap-1 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-8 h-6 flex items-center justify-center"
              aria-label={`Notícia ${i + 1}`}
            >
              <span
                className={`block w-5 h-2 rounded-full transition-transform duration-300 ${
                  i === current ? "bg-emerald-700 scale-x-100" : "bg-stone-300 scale-x-[0.4]"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RaizEducacaoPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Inter Variable', 'Inter', sans-serif" }}>
      <style>{`
        [data-reveal] {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity 0.7s cubic-bezier(.4,0,.2,1), transform 0.7s cubic-bezier(.4,0,.2,1);
        }
        [data-reveal="left"] { transform: translateX(-40px); }
        [data-reveal="right"] { transform: translateX(40px); }
        [data-reveal="scale"] { transform: scale(0.92); }
        [data-reveal][data-revealed] {
          opacity: 1;
          transform: translateY(0) translateX(0) scale(1);
        }
        [data-delay="100"] { transition-delay: 0.1s; }
        [data-delay="200"] { transition-delay: 0.2s; }
        [data-delay="300"] { transition-delay: 0.3s; }
        [data-delay="400"] { transition-delay: 0.4s; }
        [data-delay="500"] { transition-delay: 0.5s; }
      `}</style>

      {/* ── Utility Bar ──────────────────────────────────────────────────────── */}
      <div className="bg-emerald-900 text-white hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-end gap-6 text-xs font-medium">
          {utilityNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                item.highlight
                  ? "bg-amber-500 hover:bg-amber-400 text-white px-4 py-1 rounded-full font-semibold transition-colors"
                  : "text-emerald-200 hover:text-white transition-colors"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main Header ──────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 bg-white border-b transition-shadow duration-300 ${scrolled ? "shadow-md border-stone-200" : "border-transparent"}`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/raiz-educacao">
              <RaizLogo />
            </Link>

            {/* Desktop Nav */}
            <nav ref={dropdownRef} className="hidden lg:flex items-center gap-1">
              {mainNavItems.map((item) => (
                <div key={item.label} className="relative">
                  <button
                    className={`flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      activeDropdown === item.label
                        ? "text-emerald-700 bg-emerald-50"
                        : "text-stone-700 hover:text-emerald-700 hover:bg-stone-50"
                    }`}
                    onMouseEnter={() => setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                    onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                  >
                    {item.label}
                    {item.children && (
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${activeDropdown === item.label ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {/* Dropdown */}
                  {item.children && activeDropdown === item.label && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-stone-100 min-w-[200px] py-2 z-50"
                      onMouseEnter={() => setActiveDropdown(item.label)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-100 bg-white max-h-[80vh] overflow-y-auto">
            {mainNavItems.map((item) => (
              <div key={item.label}>
                <div className="px-6 py-3 font-semibold text-sm text-stone-800 border-b border-stone-50">
                  {item.label}
                </div>
                {item.children?.map((child) => (
                  <Link
                    key={child.label}
                    href={child.href}
                    className="block px-10 py-2.5 text-sm text-stone-600 hover:text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="p-4 border-t border-stone-100">
              <Link
                href="/raiz-educacao/portal"
                className="block text-center bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Portal do Aluno
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-end overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800">
          {/* Decorative overlays */}
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 1440 900" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#4ade80" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="1440" height="900" fill="url(#grid)" />
              <circle cx="300" cy="200" r="300" fill="#065f46" opacity="0.4" />
              <circle cx="1200" cy="600" r="400" fill="#0d9488" opacity="0.3" />
              <circle cx="800" cy="100" r="200" fill="#4ade80" opacity="0.1" />
            </svg>
          </div>
          {/* Large decorative leaf */}
          <div className="absolute right-0 top-0 w-1/2 h-full opacity-10">
            <svg viewBox="0 0 600 800" className="w-full h-full" fill="none">
              <path
                d="M600 0 C400 100 100 300 200 600 C300 800 500 700 600 800 L600 0Z"
                fill="#4ade80"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24 pt-32 w-full">
          <div className="max-w-3xl">
            <p className="text-emerald-400 text-sm font-bold uppercase tracking-[0.3em] mb-6">
              bem-vindo à
            </p>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-8">
              Raiz<br />
              <span className="text-emerald-400">Educação</span>
            </h1>
            <p className="text-emerald-100 text-lg md:text-xl leading-relaxed max-w-xl mb-10 font-light">
              Plantamos as raízes do conhecimento para que cada aluno floresça com propósito, caráter e visão de futuro.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/raiz-educacao/admissoes/visita"
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-xl"
              >
                Agende uma Visita
              </Link>
              <Link
                href="/raiz-educacao/sobre"
                className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-2xl transition-colors"
              >
                Conheça a Escola
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── Intro Section ────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p data-reveal className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-4">nossa essência é</p>
          <h2 data-reveal data-delay="100" className="text-5xl md:text-6xl font-black text-stone-900 leading-tight mb-6">
            Educação com<br />
            <span className="text-emerald-700">Propósito</span>
          </h2>
          <p data-reveal data-delay="200" className="text-stone-600 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
            Fundada em 1993, a Raiz Educação acredita que o verdadeiro aprendizado começa quando cada aluno se sente
            visto, valorizado e desafiado. Combinamos excelência acadêmica, formação humana e inovação pedagógica para
            preparar jovens que transformarão o Brasil e o mundo.
          </p>
        </div>
      </section>

      {/* ── Stats Section ────────────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 to-teal-800">
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 1200 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              <circle cx="200" cy="200" r="300" fill="#4ade80" />
              <circle cx="1000" cy="100" r="250" fill="#2dd4bf" />
              <circle cx="600" cy="350" r="200" fill="#4ade80" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} data-reveal data-delay={String(i * 100)} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-emerald-300 text-sm font-medium leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sideways Sections ────────────────────────────────────────────────── */}
      <div>
        {sidewaysSections.map((section, i) => (
          <section
            key={i}
            className={`py-0 ${i % 2 === 0 ? "bg-stone-50" : "bg-white"}`}
          >
            <div className="max-w-7xl mx-auto">
              <div
                className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} items-stretch min-h-[480px]`}
              >
                {/* Image */}
                <div data-reveal={i % 2 === 0 ? "left" : "right"} className="w-full md:w-1/2 relative overflow-hidden">
                  <div className={`absolute inset-0 ${section.imageBg} flex items-center justify-center p-12`}>
                    {section.imageSvg}
                  </div>
                </div>

                {/* Text */}
                <div data-reveal={i % 2 === 0 ? "right" : "left"} data-delay="100" className="w-full md:w-1/2 flex items-center">
                  <div className="p-12 md:p-16">
                    <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">
                      {section.subtitle}
                    </p>
                    <h2 className="text-4xl md:text-5xl font-black text-stone-900 mb-6 leading-tight">
                      {section.title}
                    </h2>
                    <p className="text-stone-600 text-lg leading-relaxed mb-8">
                      {section.description}
                    </p>
                    <Link
                      href={section.href}
                      className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors group"
                    >
                      {section.linkLabel}
                      <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="bg-emerald-950 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p data-reveal className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-3">quem faz a raiz</p>
            <h2 data-reveal data-delay="100" className="text-4xl md:text-5xl font-black text-white">Vozes da Comunidade</h2>
          </div>
          <TestimonialSlider items={testimonials} />
        </div>
      </section>

      {/* ── CTA Cards ────────────────────────────────────────────────────────── */}
      <section className="bg-stone-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p data-reveal className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">próximo passo</p>
            <h2 data-reveal data-delay="100" className="text-4xl md:text-5xl font-black text-stone-900">Faça Parte da Raiz</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ctaCards.map((card, i) => (
              <div
                key={i}
                data-reveal
                data-delay={String(i * 150)}
                className={`${card.bg} rounded-3xl p-8 text-white flex flex-col group hover:-translate-y-2 transition-transform shadow-lg`}
              >
                <div className="mb-6">{card.icon}</div>
                <h3 className="text-2xl font-black mb-3">{card.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed flex-1 mb-6">{card.description}</p>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors self-start group-hover:gap-3"
                >
                  {card.linkLabel}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── News Section ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
            <div data-reveal>
              <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest mb-2">o que está acontecendo</p>
              <h2 className="text-4xl md:text-5xl font-black text-stone-900">Notícias & Destaques</h2>
            </div>
            <Link
              href="/raiz-educacao/noticias"
              className="inline-flex items-center gap-2 text-emerald-700 font-semibold hover:gap-3 transition-all whitespace-nowrap"
            >
              Ver Todas as Notícias
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          <NewsSlider items={newsItems} />
        </div>
      </section>

      {/* ── Social Section ───────────────────────────────────────────────────── */}
      <section className="bg-emerald-900 py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p data-reveal className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">nos acompanhe</p>
          <h2 data-reveal data-delay="100" className="text-3xl font-black text-white mb-8">Conecte-se com a Raiz</h2>
          <div data-reveal data-delay="200" className="flex justify-center gap-4 flex-wrap">
            {[
              { label: "Instagram", icon: "📷", href: "#" },
              { label: "YouTube", icon: "▶", href: "#" },
              { label: "Facebook", icon: "f", href: "#" },
              { label: "LinkedIn", icon: "in", href: "#" },
              { label: "WhatsApp", icon: "💬", href: "#" },
            ].map((social) => (
              <Link
                key={social.label}
                href={social.href}
                className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-medium transition-colors"
              >
                <span>{social.icon}</span>
                {social.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-stone-900 text-white">
        {/* Top footer with background */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg viewBox="0 0 1440 400" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              <circle cx="200" cy="200" r="400" fill="#4ade80" />
              <circle cx="1200" cy="200" r="300" fill="#4ade80" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {/* Brand */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect width="40" height="40" rx="10" fill="#1a5c3a" />
                    <path d="M20 32 C20 32 10 26 10 18 C10 13.6 14.5 10 20 10 C25.5 10 30 13.6 30 18 C30 26 20 32 20 32Z" fill="#4ade80" opacity="0.9" />
                    <path d="M20 32 L20 18" stroke="#1a5c3a" strokeWidth="2" strokeLinecap="round" />
                    <path d="M20 22 C17 20 14 20 12 21" stroke="#1a5c3a" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M20 25 C23 23 26 23 28 24" stroke="#1a5c3a" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <div>
                    <div className="font-black text-xl text-white">Raiz Educação</div>
                    <div className="text-emerald-400 text-xs">Desde 1993</div>
                  </div>
                </div>
                <p className="text-stone-400 text-sm leading-relaxed max-w-xs mb-6">
                  <strong className="text-emerald-400">Nossa Missão:</strong> Formar cidadãos íntegros, criativos e comprometidos com a construção de um Brasil mais justo e desenvolvido.
                </p>
                <div className="text-stone-500 text-sm">
                  <div>Rua das Acácias, 200 — Jardim das Flores</div>
                  <div>São Paulo, SP — CEP 04567-000</div>
                  <div className="mt-1">
                    <a href="tel:+551134567890" className="text-emerald-400 hover:text-emerald-300">(11) 3456-7890</a>
                  </div>
                  <div>
                    <a href="mailto:contato@raizeducacao.com.br" className="text-emerald-400 hover:text-emerald-300 text-xs">
                      contato@raizeducacao.com.br
                    </a>
                  </div>
                </div>
              </div>

              {/* Nav columns */}
              <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">A Escola</h3>
                <ul className="space-y-2 text-stone-400 text-sm">
                  {["Nossa História", "Missão e Valores", "Equipe Pedagógica", "Infraestrutura", "Trabalhe Conosco"].map((l) => (
                    <li key={l}>
                      <Link href="#" className="hover:text-emerald-400 transition-colors">{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Ensino</h3>
                <ul className="space-y-2 text-stone-400 text-sm">
                  {["Educação Infantil", "Ensino Fundamental I", "Ensino Fundamental II", "Ensino Médio", "Resultados ENEM"].map((l) => (
                    <li key={l}>
                      <Link href="#" className="hover:text-emerald-400 transition-colors">{l}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400">
            <div suppressHydrationWarning>© {new Date().getFullYear()} Raiz Educação. Todos os direitos reservados.</div>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-stone-300 transition-colors">Política de Privacidade</Link>
              <Link href="#" className="hover:text-stone-300 transition-colors">Termos de Uso</Link>
              <Link href="#" className="hover:text-stone-300 transition-colors">Mapa do Site</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
