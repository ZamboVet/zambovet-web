import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
              <p className="mt-2 text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="prose max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
                <p className="text-gray-700 mb-4">
                  By accessing and using ZamboVet's services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
                <p className="text-gray-700 mb-4">
                  ZamboVet provides a digital platform for veterinary services, including:
                </p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Online appointment scheduling</li>
                  <li>Pet medical record management</li>
                  <li>Communication between pet owners and veterinarians</li>
                  <li>Access to veterinary professionals and clinics</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
                <p className="text-gray-700 mb-4">As a user of ZamboVet, you agree to:</p>
                <ul className="list-disc pl-6 text-gray-700 mb-4">
                  <li>Provide accurate and complete information</li>
                  <li>Keep your account credentials secure</li>
                  <li>Use the service in compliance with applicable laws</li>
                  <li>Not misuse or abuse the platform</li>
                  <li>Respect the rights and privacy of other users</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Medical Disclaimer</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 font-medium">Important Notice:</p>
                  <p className="text-yellow-700 mt-2">
                    ZamboVet is a platform that connects pet owners with veterinary professionals. We do not provide medical advice directly. All medical advice and treatment decisions should be made in consultation with qualified veterinary professionals.
                  </p>
                </div>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Always consult with a licensed veterinarian for medical concerns</li>
                  <li>In case of emergency, contact your nearest veterinary clinic immediately</li>
                  <li>ZamboVet is not responsible for medical decisions or outcomes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Terms</h2>
                <ul className="list-disc pl-6 text-gray-700">
                  <li>Payment is due at the time of service or as agreed with the veterinarian</li>
                  <li>Cancellation policies may apply for missed appointments</li>
                  <li>Refunds are subject to individual veterinarian policies</li>
                  <li>ZamboVet may charge platform fees for certain services</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">
                  ZamboVet provides the platform "as is" and makes no warranties regarding the availability, accuracy, or reliability of the service. We are not liable for any indirect, incidental, or consequential damages arising from your use of our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy</h2>
                <p className="text-gray-700">
                  Your privacy is important to us. Please review our{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
                    Privacy Policy
                  </Link>{' '}
                  to understand how we collect and use your information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
                <p className="text-gray-700">
                  We reserve the right to modify these terms at any time. We will notify users of significant changes via email or platform notifications. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <p className="text-gray-700">
                  If you have questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-4 text-gray-700">
                  <p>Email: legal@zambovet.com</p>
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