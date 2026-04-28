import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { portfolioSlides } from '../data/portfolio'

export function PortfolioCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % portfolioSlides.length)
    }, 4200)

    return () => window.clearInterval(interval)
  }, [])

  function goTo(index: number) {
    setActiveIndex((index + portfolioSlides.length) % portfolioSlides.length)
  }

  const activeSlide = portfolioSlides[activeIndex]
  const shouldShowImage = activeSlide.imageUrl && !failedImages[activeSlide.id]

  return (
    <section className="portfolio-section">
      <div className="panel-chip">Portfólio da Alyssa</div>
      <div className="portfolio-window">
        {shouldShowImage ? (
          <img
            className="portfolio-photo"
            src={activeSlide.imageUrl}
            alt={activeSlide.title}
            loading="lazy"
            onError={() =>
              setFailedImages((current) => ({
                ...current,
                [activeSlide.id]: true,
              }))
            }
          />
        ) : (
          <div className={`portfolio-fallback slide-${activeSlide.variant}`}>
            <div className="portfolio-fallback-mark">
              <ImageIcon size={20} />
              Espaço pronto para fotos reais
            </div>
            <strong>{activeSlide.tag}</strong>
            <p>{activeSlide.title}</p>
          </div>
        )}

        <div className="portfolio-overlay">
          <span className="service-pill">{activeSlide.tag}</span>
          <h2>{activeSlide.title}</h2>
          <p>{activeSlide.note}</p>
        </div>
      </div>

      <div className="portfolio-controls">
        <button
          type="button"
          className="ghost-button icon-only"
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Foto anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="portfolio-dots">
          {portfolioSlides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={`portfolio-dot ${activeIndex === index ? 'active' : ''}`}
              onClick={() => goTo(index)}
              aria-label={`Abrir item ${index + 1} do portfólio`}
            />
          ))}
        </div>

        <button
          type="button"
          className="ghost-button icon-only"
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Próxima foto"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}
