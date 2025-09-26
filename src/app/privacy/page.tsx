import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="mt-2 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="prose max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Welcome to ZamboVet. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and protect your information when you use our veterinary services platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
                <div className="text-gray-700">
                  <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Name, email address, and phone number</li>
                    <li>Address and contact information</li>
                    <li>Pet information (name, species, breed, medical history)</li>
                    <li>Appointment and medical record data</li>
                  </ul>

                  <h3 className="text-lg font-medium mb-2">Technical Information</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>IP address and device information</li>
                    <li>Browser type and version</li>
                    <li>Usage patterns and preferences</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>To provide veterinary services and appointment scheduling</li>
                  <li>To maintain medical records and treatment history</li>
                  <li>To communicate about appointments and treatments</li>
                  <li>To improve our services and user experience</li>
                  <li>To comply with legal and regulatory requirements</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement industry-standard security measures to protect your personal information. This includes encryption, secure data storage, and access controls. However, no system is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
                <p className="text-gray-700 mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your data (subject to legal requirements)</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-700">
                  If you have any questions about this Privacy Policy or your personal information, please contact us at:
                </p>
                <div className="mt-4 text-gray-700">
                  <p>Email: privacy@zambovet.com</p>
                  <p>Phone: [Your phone number]</p>
                  <p>Address: [Your business address]</p>
                </div>
              </section>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}