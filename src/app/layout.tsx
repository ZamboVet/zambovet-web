import { Metadata } from 'next';
import { poppins } from './fonts';
import '@/app/globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'ZamboVet',
  description: 'Veterinarian Appointment System.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="bg-[#faf9f7] text-gray-800">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
