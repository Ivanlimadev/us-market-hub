// Data for Google Web Stories (AMP amp-story pages). Each story is a short,
// tappable, full-screen visual retelling of a full biography article, ending
// with a CTA that links to the complete post. Rendered as raw AMP HTML by
// src/app/web-stories/[slug]/route.ts.
//
// Images are Pexels URLs force-cropped to a uniform 9:16 portrait (720x1280),
// so every slide has the exact dimensions AMP requires.

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=720&h=1280`

export interface StorySlide {
  image: string
  heading: string
  text?: string
}

export interface WebStory {
  slug: string
  title: string
  publisher: string
  /** The full article this story summarizes; used for the closing CTA. */
  articleSlug: string
  slides: StorySlide[]
}

export const WEB_STORIES: Record<string, WebStory> = {
  'the-story-of-nvidia': {
    slug: 'the-story-of-nvidia',
    title: 'The Story of Nvidia',
    publisher: 'Stock Market ROI',
    articleSlug: 'nvidia-complete-history-1993-2026-gpu-to-ai-empire',
    slides: [
      { image: px(2582937), heading: 'The Story of Nvidia', text: 'From a Denny’s booth to a $5 trillion AI empire.' },
      { image: px(3520694), heading: '1993', text: 'Three engineers founded Nvidia at a Denny’s diner in San Jose.' },
      { image: px(6801648), heading: 'Near-death', text: 'Its first chip flopped. The company almost went bankrupt.' },
      { image: px(2582937), heading: '1999', text: 'It launched the GeForce 256, billed as the world’s first GPU.' },
      { image: px(3520694), heading: 'The 2006 bet', text: 'It bet on CUDA. Rivals thought it was a distraction.' },
      { image: px(8566472), heading: 'The AI boom', text: 'That bet became the engine of the entire AI revolution.' },
      { image: px(730564), heading: 'Today', text: 'Nvidia is now one of the most valuable companies on Earth.' },
    ],
  },
  'the-story-of-nubank': {
    slug: 'the-story-of-nubank',
    title: 'The Story of Nubank',
    publisher: 'Stock Market ROI',
    articleSlug: 'nubank-complete-history-2013-2026-david-velez-purple-card-empire',
    slides: [
      { image: px(7621136), heading: 'The Story of Nubank', text: 'How a bad bank visit built a $70 billion empire.' },
      { image: px(4386370), heading: 'The problem', text: 'Five banks controlled 80% of Brazil, charging brutal fees.' },
      { image: px(259200), heading: '2013', text: 'David Vélez built the opposite: a no-fee purple card, run from a phone.' },
      { image: px(6801874), heading: 'Explosive growth', text: 'It spread by word of mouth into the largest digital bank outside Asia.' },
      { image: px(1602726), heading: 'Buffett backs it', text: 'Warren Buffett invested. Nubank IPO’d on the NYSE in 2021.' },
      { image: px(4386370), heading: 'Today', text: 'Around 139 million customers and billion-dollar quarterly profits.' },
    ],
  },
}
