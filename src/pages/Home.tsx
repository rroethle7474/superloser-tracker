import { Nav } from '../components/Nav'
import { Hero } from '../components/Hero'
import { Footer } from '../components/Footer'
import { ContractSection } from '../components/sections/ContractSection'
import { LiveTrackerSection } from '../components/sections/LiveTrackerSection'
import { VideoSection } from '../components/sections/VideoSection'
import { CommentsSection } from '../components/sections/CommentsSection'
import { useAdminToken } from '../hooks/useAdminToken'

export function Home() {
  const adminToken = useAdminToken()
  const isAdmin = adminToken !== null

  return (
    <div className="paper-bg min-h-full">
      <Nav />
      <main>
        <Hero isAdmin={isAdmin} />
        <ContractSection />
        <LiveTrackerSection isAdmin={isAdmin} />
        <VideoSection isAdmin={isAdmin} />
        <CommentsSection isAdmin={isAdmin} />
      </main>
      <Footer />
    </div>
  )
}
