export interface PortfolioSlide {
  id: string
  title: string
  note: string
  tag: string
  variant:
    | 'royal'
    | 'classic'
    | 'porcelain'
    | 'glow'
    | 'midnight'
    | 'espresso'
    | 'portrait'
  imageUrl?: string
}

export const portfolioSlides: PortfolioSlide[] = [
  {
    id: 'portfolio-royal',
    title: 'Azul intenso nas unhas naturais',
    note: 'Acabamento uniforme, brilho forte e visual marcante para mãos.',
    tag: 'Mão tradicional',
    variant: 'royal',
  },
  {
    id: 'portfolio-classic',
    title: 'Vermelho clássico e duradouro',
    note: 'Esmaltação tradicional com secagem rápida para quem ama cor aberta.',
    tag: 'Clássico Alyssa',
    variant: 'classic',
  },
  {
    id: 'portfolio-porcelain',
    title: 'Branco delicado para pés',
    note: 'Pedicure tradicional com visual limpo e elegante.',
    tag: 'Pé tradicional',
    variant: 'porcelain',
  },
  {
    id: 'portfolio-glow',
    title: 'Brilho suave com destaque pontual',
    note: 'Combina esmaltação tradicional e detalhe discreto para eventos.',
    tag: 'Pé especial',
    variant: 'glow',
  },
  {
    id: 'portfolio-midnight',
    title: 'Tons profundos para quem gosta de sofisticação',
    note: 'Cobertura espelhada que valoriza unhas naturais mais longas.',
    tag: 'Azul noite',
    variant: 'midnight',
  },
  {
    id: 'portfolio-espresso',
    title: 'Esmaltação escura com acabamento elegante',
    note: 'Cor sóbria com brilho firme e aparência profissional.',
    tag: 'Marrom café',
    variant: 'espresso',
  },
  {
    id: 'portfolio-portrait',
    title: 'Atendimento pensado para unhas naturais',
    note: 'Visual delicado, profissional e totalmente focado em hora marcada.',
    tag: 'Alyssa Unhas',
    variant: 'portrait',
  },
]
