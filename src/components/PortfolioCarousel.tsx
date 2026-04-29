import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { portfolioSlides } from '../data/portfolio'

export function PortfolioCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (portfolioSlides.length <= 1) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % portfolioSlides.length)
    }, 4200)

    return () => window.clearInterval(interval)
  }, [])

  function goTo(index: number) {
    setActiveIndex((index + portfolioSlides.length) % portfolioSlides.length)
  }

  const activeSlide = portfolioSlides[activeIndex]

  if (!activeSlide) {
    return null
  }

  return (
    <section className="portfolio-section" aria-label="Portfólio">
      <div className="section-title">
        <span>Portfólio</span>
      </div>

      <div className="portfolio-window">
        <img
          className="portfolio-photo"
          src={activeSlide.imageUrl}
          alt="Foto do portfólio da Alissa"
          loading="lazy"
        />
      </div>

      {portfolioSlides.length > 1 ? (
        <div className="portfolio-controls">
          <button
            type="button"
            className="icon-button"
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
                aria-label={`Abrir foto ${index + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Proxima foto"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </section>
  )
}
