import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import AiPhilosophy from '@/components/AiPhilosophy';
import CaseStudy from '@/components/CaseStudy';
import Thoughts from '@/components/Thoughts';
import Archive from '@/components/Archive';
import Contact from '@/components/Contact';
import { getLatestThoughts } from '@/lib/thoughts-loader';

/** 首页 - 单页滚动式布局 */
export default function Home() {
  const latestThoughts = getLatestThoughts(3);

  return (
    <main>
      <Navbar />
      <Hero />
      <AiPhilosophy />
      <CaseStudy />
      <Thoughts thoughts={latestThoughts} />
      <Archive />
      <Contact />
    </main>
  );
}
