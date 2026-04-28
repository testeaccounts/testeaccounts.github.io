import portfolio1 from '../../portifolio/1.jpg'
import portfolio2 from '../../portifolio/2.jpg'
import portfolio3 from '../../portifolio/3.jpg'
import portfolio4 from '../../portifolio/4.jpg'
import portfolio5 from '../../portifolio/5.jpg'
import portfolio6 from '../../portifolio/6.jpg'
import portfolio7 from '../../portifolio/download.png'
import portfolio8 from '../../portifolio/rotoalissa.jpg'

export interface PortfolioSlide {
  id: string
  imageUrl: string
}

export const portfolioSlides: PortfolioSlide[] = [
  { id: 'portfolio-1', imageUrl: portfolio1 },
  { id: 'portfolio-2', imageUrl: portfolio2 },
  { id: 'portfolio-3', imageUrl: portfolio3 },
  { id: 'portfolio-4', imageUrl: portfolio4 },
  { id: 'portfolio-5', imageUrl: portfolio5 },
  { id: 'portfolio-6', imageUrl: portfolio6 },
  { id: 'portfolio-7', imageUrl: portfolio7 },
  { id: 'portfolio-8', imageUrl: portfolio8 },
]
