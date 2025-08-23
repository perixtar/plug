// __tests__/logging.test.ts
import { POST } from '@/app/api/chat/ai/route'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { UserIntentEnum } from '@/lib/schema'
import templates from '@/lib/templates'
import { streamObject, CoreMessage, streamText } from 'ai'
import { describe, it, expect } from 'vitest'

describe('POST /api/chat/ai', () => {
  it(
    'returns 200 and success message when JSON is well-formed',
    async () => {
      const messages: CoreMessage[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Create a landing page for real estate agent',
            },
          ],
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: "I'll create a modern, responsive landing page for a real estate agent using Next.js 14 and Tailwind CSS. I'll structure the page with several sections including a hero section, featured properties, about section, services, testimonials, and a contact form. I'll use shadcn/ui components where appropriate and implement proper SEO practices.\n\nSteps I'll take:\n1. Set up the main page structure\n2. Create a responsive layout with proper spacing\n3. Add a hero section with a compelling headline\n4. Include sections for properties, services, and testimonials\n5. Add a contact form\n6. Implement proper SEO metadata",
            },
            {
              type: 'text',
              text: 'import { Metadata } from \'next\';\nimport Image from \'next/image\';\nimport { HomeIcon, BuildingOffice2Icon, PhoneIcon, UserGroupIcon } from \'@heroicons/react/24/outline\';\n\nexport const metadata: Metadata = {\n  title: \'Jane Smith - Luxury Real Estate Agent\',\n  description: \'Expert real estate agent specializing in luxury properties. Find your dream home today.\',\n  keywords: \'real estate, luxury homes, property agent, house hunting\',\n};\n\nexport default function Home() {\n  return (\n    <main className="min-h-screen">\n      {/* Hero Section */}\n      <section className="relative h-[90vh] flex items-center justify-center text-white">\n        <div className="absolute inset-0 z-0">\n          <Image\n            src="/hero-house.jpg"\n            alt="Luxury home exterior"\n            fill\n            className="object-cover brightness-50"\n            priority\n          />\n        </div>\n        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">\n          <h1 className="text-4xl md:text-6xl font-bold mb-6">\n            Find Your Dream Home Today\n          </h1>\n          <p className="text-xl md:text-2xl mb-8">\n            Luxury Real Estate Expert with 15+ Years of Experience\n          </p>\n          <button className="bg-white text-black px-8 py-3 rounded-full hover:bg-opacity-90 transition">\n            View Properties\n          </button>\n        </div>\n      </section>\n\n      {/* Services Section */}\n      <section className="py-20 bg-white">\n        <div className="container mx-auto px-4">\n          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">\n            Our Services\n          </h2>\n          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">\n            {[\n              {\n                icon: <HomeIcon className="h-12 w-12" />,\n                title: \'Residential Sales\',\n                description: \'Find your perfect home with our extensive listings\',\n              },\n              {\n                icon: <BuildingOffice2Icon className="h-12 w-12" />,\n                title: \'Commercial Properties\',\n                description: \'Expert guidance in commercial real estate\',\n              },\n              {\n                icon: <UserGroupIcon className="h-12 w-12" />,\n                title: \'Property Management\',\n                description: \'Comprehensive property management services\',\n              },\n              {\n                icon: <PhoneIcon className="h-12 w-12" />,\n                title: \'24/7 Support\',\n                description: \'Always available to assist you\',\n              },\n            ].map((service, index) => (\n              <div\n                key={index}\n                className="text-center p-6 rounded-lg shadow-lg hover:shadow-xl transition"\n              >\n                <div className="text-blue-600 mb-4 flex justify-center">\n                  {service.icon}\n                </div>\n                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>\n                <p className="text-gray-600">{service.description}</p>\n              </div>\n            ))}\n          </div>\n        </div>\n      </section>\n\n      {/* Featured Properties */}\n      <section className="py-20 bg-gray-50">\n        <div className="container mx-auto px-4">\n          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">\n            Featured Properties\n          </h2>\n          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">\n            {[\n              {\n                image: \'/property1.jpg\',\n                title: \'Modern Villa\',\n                price: \'$2,500,000\',\n                location: \'Beverly Hills, CA\',\n              },\n              {\n                image: \'/property2.jpg\',\n                title: \'Luxury Apartment\',\n                price: \'$1,800,000\',\n                location: \'Manhattan, NY\',\n              },\n              {\n                image: \'/property3.jpg\',\n                title: \'Beachfront House\',\n                price: \'$3,200,000\',\n                location: \'Miami Beach, FL\',\n              },\n            ].map((property, index) => (\n              <div\n                key={index}\n                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition"\n              >\n                <div className="relative h-64">\n                  <Image\n                    src={property.image}\n                    alt={property.title}\n                    fill\n                    className="object-cover"\n                  />\n                </div>\n                <div className="p-6">\n                  <h3 className="text-xl font-semibold mb-2">{property.title}</h3>\n                  <p className="text-gray-600 mb-2">{property.location}</p>\n                  <p className="text-blue-600 font-bold">{property.price}</p>\n                </div>\n              </div>\n            ))}\n          </div>\n        </div>\n      </section>\n\n      {/* Contact Form */}\n      <section className="py-20 bg-white">\n        <div className="container mx-auto px-4 max-w-2xl">\n          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">\n            Contact Us\n          </h2>\n          <form className="space-y-6">\n            <div>\n              <label className="block text-gray-700 mb-2" htmlFor="name">\n                Name\n              </label>\n              <input\n                type="text"\n                id="name"\n                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"\n                required\n              />\n            </div>\n            <div>\n              <label className="block text-gray-700 mb-2" htmlFor="email">\n                Email\n              </label>\n              <input\n                type="email"\n                id="email"\n                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"\n                required\n              />\n            </div>\n            <div>\n              <label className="block text-gray-700 mb-2" htmlFor="message">\n                Message\n              </label>\n              <textarea\n                id="message"\n                rows={4}\n                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"\n                required\n              ></textarea>\n            </div>\n            <button\n              type="submit"\n              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"\n            >\n              Send Message\n            </button>\n          </form>\n        </div>\n      </section>\n\n      {/* Footer */}\n      <footer className="bg-gray-900 text-white py-12">\n        <div className="container mx-auto px-4">\n          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">\n            <div>\n              <h3 className="text-xl font-bold mb-4">Contact Info</h3>\n              <p className="mb-2">123 Real Estate Ave</p>\n              <p className="mb-2">Los Angeles, CA 90001</p>\n              <p className="mb-2">Phone: (555) 123-4567</p>\n              <p>Email: info@realestateagent.com</p>\n            </div>\n            <div>\n              <h3 className="text-xl font-bold mb-4">Quick Links</h3>\n              <ul className="space-y-2">\n                <li><a href="#" className="hover:text-blue-400">Home</a></li>\n                <li><a href="#" className="hover:text-blue-400">Properties</a></li>\n                <li><a href="#" className="hover:text-blue-400">Services</a></li>\n                <li><a href="#" className="hover:text-blue-400">Contact</a></li>\n              </ul>\n            </div>\n            <div>\n              <h3 className="text-xl font-bold mb-4">Follow Us</h3>\n              <div className="flex space-x-4">\n                <a href="#" className="hover:text-blue-400">Facebook</a>\n                <a href="#" className="hover:text-blue-400">Twitter</a>\n                <a href="#" className="hover:text-blue-400">Instagram</a>\n                <a href="#" className="hover:text-blue-400">LinkedIn</a>\n              </div>\n            </div>\n          </div>\n          <div className="text-center mt-8 pt-8 border-t border-gray-800">\n            <p>&copy; 2024 Real Estate Agent. All rights reserved.</p>\n          </div>\n        </div>\n      </footer>\n    </main>\n  );\n}\n',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Update the text "View Properties" to "View Houses"',
            },
          ],
        },
      ]

      const model: LLMModel = {
        id: 'claude-3-5-sonnet-latest',
        provider: 'Anthropic',
        providerId: 'anthropic',
        name: 'Claude 3.5 Sonnet',
      }

      const req = new Request('http://localhost/api/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID: '123',
          messages,
          model,
          template: templates['nextjs15-v1'],
          projectId: 'test-project-id',
        }),
      })

      const res = await POST(req)

      // NextResponse.json defaults to status 200
      // expect(res).toBeInstanceOf(NextResponse)
      expect(res.status).toBe(200)

      const data = await res.text()
      console.log('Response data:', data)
    },
    {
      timeout: 120000, // Set a timeout for the test
    },
  )
})
