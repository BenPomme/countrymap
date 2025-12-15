import type { Metadata } from 'next'
import Link from 'next/link'
import { Globe, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | The World Truth Map',
  description: 'Privacy policy for The World Truth Map website, including information about data collection, cookies, and third-party advertising.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Globe className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            <div>
              <h1 className="text-base md:text-xl font-bold text-gray-900">The World Truth Map</h1>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

          <p className="text-gray-600 mb-6">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to The World Truth Map (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed
                to protecting your personal data. This privacy policy explains how we collect, use, and safeguard
                your information when you visit our website at theworldtruth.com.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <p className="text-gray-700 mb-4">
                We do not collect personal information directly from you. However, we use third-party services
                that may collect certain information automatically:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>Usage Data:</strong> Information about how you interact with our website, including
                  pages visited, time spent on pages, and navigation patterns.
                </li>
                <li>
                  <strong>Device Information:</strong> Browser type, operating system, device type, screen
                  resolution, and language preferences.
                </li>
                <li>
                  <strong>IP Address:</strong> Your approximate geographic location based on your IP address.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-4">
                We and our third-party partners use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Analyze website traffic and usage patterns</li>
                <li>Remember your preferences</li>
                <li>Deliver personalized advertisements</li>
                <li>Measure the effectiveness of advertising campaigns</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You can control cookies through your browser settings. Note that disabling cookies may affect
                the functionality of some features on our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use the following analytics and tracking services to understand how visitors use our website:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>
                  <strong>Google Analytics 4:</strong> Tracks page views, user behavior, and traffic sources.{' '}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                    Google Privacy Policy
                  </a>
                </li>
                <li>
                  <strong>Meta (Facebook) Pixel:</strong> Tracks conversions and enables advertising on Meta platforms.{' '}
                  <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                    Meta Privacy Policy
                  </a>
                </li>
                <li>
                  <strong>TikTok Pixel:</strong> Tracks conversions and enables advertising on TikTok.{' '}
                  <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                    TikTok Privacy Policy
                  </a>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Advertising</h2>
              <p className="text-gray-700 mb-4">
                We use Google AdSense to display advertisements on our website. Google AdSense uses cookies
                to serve ads based on your prior visits to our website and other websites. Google&apos;s use of
                advertising cookies enables it and its partners to serve ads based on your visit to our site
                and/or other sites on the Internet.
              </p>
              <p className="text-gray-700 mb-4">
                You may opt out of personalized advertising by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Google Ads Settings
                </a>.
              </p>
              <p className="text-gray-700">
                For more information about how Google uses data, please visit{' '}
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Google&apos;s Privacy & Terms
                </a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                The information collected through third-party services is used to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Improve and optimize our website</li>
                <li>Understand how visitors use our website</li>
                <li>Display relevant advertisements</li>
                <li>Analyze website performance and fix issues</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700">
                We implement appropriate technical and organizational measures to protect any data processed
                through our website. However, no method of transmission over the Internet is 100% secure,
                and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 mb-4">
                Depending on your location, you may have certain rights regarding your personal data, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>The right to access your personal data</li>
                <li>The right to request correction of inaccurate data</li>
                <li>The right to request deletion of your data</li>
                <li>The right to opt out of personalized advertising</li>
                <li>The right to withdraw consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Children&apos;s Privacy</h2>
              <p className="text-gray-700">
                Our website is not intended for children under 13 years of age. We do not knowingly collect
                personal information from children under 13. If you are a parent or guardian and believe
                your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. We will notify you of any changes by
                posting the new privacy policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this privacy policy, please contact us through our website.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} The World Truth Map. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
