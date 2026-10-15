import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import CategorySection from '@/components/home/CategorySection'
import FeaturedSpacesSection from '@/components/home/FeaturedSpacesSection'
import HeroSection from '@/components/home/HeroSection'
import HostCtaSection from '@/components/home/HostCtaSection'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import TrustStrip from '@/components/home/TrustStrip'
import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'

// The landing page (the web's HomePage). Each section lives in src/components/home/.
export default function ExploreScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <Navbar />
      <ScrollView>
        <HeroSection />
        <TrustStrip />
        <CategorySection />
        <HowItWorksSection />
        <FeaturedSpacesSection />
        <HostCtaSection />
        <Footer />
      </ScrollView>
    </SafeAreaView>
  )
}
