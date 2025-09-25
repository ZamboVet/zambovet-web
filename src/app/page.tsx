'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  HeartIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/solid';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const handleBookAppointment = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0032A0]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}
          ios-safe-area-nav`}
        style={{
          WebkitBackdropFilter: isScrolled ? 'blur(8px)' : undefined,
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#0032A0] to-[#0053d6] rounded-lg flex items-center justify-center">
                <HeartIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className={`text-xl md:text-2xl font-bold ${isScrolled ? 'text-white' : 'text-[#0032A0]'}`}>ZamboVet</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('home')} className={`font-medium transition-colors ${isScrolled ? 'text-white hover:text-[#b3c7e6]' : 'text-[#0032A0] hover:text-[#0053d6]'}`}>Home</button>
              <button onClick={() => scrollToSection('services')} className={`font-medium transition-colors ${isScrolled ? 'text-white hover:text-[#b3c7e6]' : 'text-[#0032A0] hover:text-[#0053d6]'}`}>Services</button>
              <button onClick={() => scrollToSection('about')} className={`font-medium transition-colors ${isScrolled ? 'text-white hover:text-[#b3c7e6]' : 'text-[#0032A0] hover:text-[#0053d6]'}`}>About</button>
              <button onClick={() => scrollToSection('contact')} className={`font-medium transition-colors ${isScrolled ? 'text-white hover:text-[#b3c7e6]' : 'text-[#0032A0] hover:text-[#0053d6]'}`}>Contact</button>
              <button 
                onClick={handleBookAppointment}
                className={`px-6 py-2 rounded-full font-medium transform hover:scale-105 transition-all duration-200 ${isScrolled ? 'bg-white text-[#0032A0] hover:bg-[#b3c7e6] hover:text-[#0032A0]' : 'bg-[#0032A0] text-white hover:bg-[#0053d6] hover:text-white'}`}
              >
                Sign In
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0032A0] focus:ring-offset-2 hover:bg-[#b3c7e6]/20 transition-colors"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-7 h-7 text-[#0032A0]" />
              ) : (
                <Bars3Icon className="w-7 h-7 text-[#0032A0]" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-[#0032A0] border-t border-[#b3c7e6] py-4 space-y-4 rounded-b-xl shadow-xl animate-fade-in">
              <button onClick={() => scrollToSection('home')} className="block w-full text-left px-4 py-3 text-white hover:text-[#b3c7e6] transition-colors font-medium text-lg">Home</button>
              <button onClick={() => scrollToSection('services')} className="block w-full text-left px-4 py-3 text-white hover:text-[#b3c7e6] transition-colors font-medium text-lg">Services</button>
              <button onClick={() => scrollToSection('about')} className="block w-full text-left px-4 py-3 text-white hover:text-[#b3c7e6] transition-colors font-medium text-lg">About</button>
              <button onClick={() => scrollToSection('contact')} className="block w-full text-left px-4 py-3 text-white hover:text-[#b3c7e6] transition-colors font-medium text-lg">Contact</button>
              <div className="px-4">
                <button 
                  onClick={handleBookAppointment}
                  className="w-full bg-white text-[#0032A0] px-6 py-3 rounded-full hover:bg-[#b3c7e6] hover:text-[#0032A0] transition-all duration-200 font-medium text-lg shadow"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <style jsx global>{`
        .ios-safe-area-nav {
          padding-top: env(safe-area-inset-top);
        }
        @media (max-width: 768px) {
          nav {
            min-height: 56px;
          }
        }
        @media (max-width: 640px) {
          nav {
            min-height: 48px;
          }
        }
        @media (hover: none) and (pointer: coarse) {
          nav button, nav a {
            min-height: 48px;
            min-width: 44px;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Hero Section */}
      <section id="home" className="pt-16 md:pt-20 min-h-screen flex items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#b3c7e6] via-white to-[#0032A0] opacity-80"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left space-y-6 md:space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0032A0] leading-tight">
                Professional
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0032A0] to-[#0053d6]">
                  Pet Care
                </span>
                Made Simple
              </h1>
              <p className="text-lg md:text-xl text-black max-w-2xl mx-auto lg:mx-0">
                Book veterinary appointments online, manage your pet's health records, and connect with experienced veterinarians who care about your furry family members.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={handleBookAppointment}
                  className="bg-[#0032A0] text-white px-8 py-4 rounded-full hover:bg-[#0053d6] hover:text-white transition-all duration-200 font-semibold text-lg"
                >
                  Book Appointment
                </button>
                <button onClick={() => scrollToSection('services')} className="border-2 border-[#0032A0] text-[#0032A0] px-8 py-4 rounded-full hover:bg-[#b3c7e6] hover:text-[#0032A0] transition-all duration-200 font-semibold text-lg">
                  Learn More
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="animate-float">
                <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#0032A0] to-[#0053d6] rounded-full flex items-center justify-center mx-auto">
                      <HeartIcon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0032A0]">24/7 Pet Care</h3>
                    <p className="text-black">Professional veterinary services available</p>
                    <div className="flex justify-center space-x-2">
                      <div className="w-3 h-3 bg-[#0032A0] rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-[#0053d6] rounded-full animate-pulse delay-100"></div>
                      <div className="w-3 h-3 bg-[#0032A0] rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDownIcon className="w-8 h-8 text-[#0032A0]" />
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 bg-[#b3c7e6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0032A0] mb-4">
              Our Services
            </h2>
            <p className="text-lg md:text-xl text-black max-w-3xl mx-auto">
              Comprehensive veterinary care tailored to your pet's unique needs
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                icon: CalendarDaysIcon,
                title: "Online Booking",
                description: "Schedule appointments 24/7 through our easy-to-use platform",
                color: "from-[#0032A0] to-[#0053d6]"
              },
              {
                icon: HeartIcon,
                title: "Health Monitoring",
                description: "Track your pet's health records and vaccination schedules",
                color: "from-white to-[#0032A0]"
              },
              {
                icon: UserGroupIcon,
                title: "Expert Veterinarians",
                description: "Experienced professionals dedicated to your pet's wellbeing",
                color: "from-[#b3c7e6] to-[#0032A0]"
              },
              {
                icon: ShieldCheckIcon,
                title: "Preventive Care",
                description: "Preventive health services to keep your pets healthy and happy",
                color: "from-white to-[#b3c7e6]"
              }
            ].map((service, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 md:p-8 hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-[#b3c7e6]"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r ${service.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#0032A0] mb-3">
                  {service.title}
                </h3>
                <p className="text-black leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-gradient-to-br from-[#b3c7e6] via-white to-[#0032A0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6 md:space-y-8">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0032A0]">
                Why Choose
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0032A0] to-[#0053d6]">
                  ZamboVet?
                </span>
              </h2>
              <p className="text-lg md:text-xl text-black leading-relaxed">
                We combine modern technology with compassionate care to provide the best possible experience for you and your pets. Our platform makes veterinary care accessible, convenient, and stress-free.
              </p>
              <div className="space-y-4">
                {[
                  "Licensed and experienced veterinarians",
                  "State-of-the-art medical equipment",
                  "Convenient online appointment booking",
                  "Comprehensive health record management",
                  "Professional veterinary care"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#0032A0] to-[#0053d6] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[#0053d6] font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-6 shadow-lg transform rotate-2 hover:rotate-0 transition-transform duration-300">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#0032A0]">500+</div>
                      <div className="text-black">Happy Pets</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#0032A0]">24/7</div>
                      <div className="text-black">Support</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-white rounded-2xl p-6 shadow-lg transform rotate-1 hover:rotate-0 transition-transform duration-300">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#0032A0]">15+</div>
                      <div className="text-black">Expert Vets</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#0032A0]">98%</div>
                      <div className="text-black">Satisfaction</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-[#b3c7e6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0032A0] mb-4">
              What Pet Parents Say
            </h2>
            <p className="text-lg md:text-xl text-black max-w-3xl mx-auto">
              Real stories from our satisfied customers and their beloved pets
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                name: "Sarah Johnson",
                pet: "Max (Golden Retriever)",
                rating: 5,
                text: "ZamboVet made booking appointments so easy! The online system is intuitive and the vets are incredibly caring. Max loves going there now!"
              },
              {
                name: "Michael Chen",
                pet: "Luna (Persian Cat)",
                rating: 5,
                text: "The professional veterinary care at ZamboVet was exceptional. Dr. Martinez provided excellent treatment for Luna. Highly recommended!"
              },
              {
                name: "Emily Rodriguez",
                pet: "Buddy (Beagle)",
                rating: 5,
                text: "Finally, a vet clinic that understands modern pet parents! The health tracking feature helps me stay on top of Buddy's vaccinations."
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-[#fffbde] rounded-2xl p-6 md:p-8 border border-[#91c8e4] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-black mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div className="border-t border-[#91c8e4] pt-4">
                  <div className="font-semibold text-[#0032A0]">{testimonial.name}</div>
                  <div className="text-sm text-black">Pet Parent of {testimonial.pet}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#0032A0] via-[#b3c7e6] to-[#0032A0] relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0032A0]/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Ready to Give Your Pet
              <span className="block">The Best Care?</span>
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
              Join thousands of pet parents who trust ZamboVet for their furry family members. Book your first appointment today and experience the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleBookAppointment}
                className="bg-[#fffbde] text-[#0032A0] px-8 py-4 rounded-full hover:bg-[#b3c7e6] hover:text-white transition-all duration-200 font-semibold text-lg"
              >
                Book Your First Appointment
              </button>
              <button onClick={() => scrollToSection('contact')} className="border-2 border-[#fffbde] text-[#fffbde] px-8 py-4 rounded-full hover:bg-[#fffbde] hover:text-[#0032A0] transition-all duration-200 font-semibold text-lg">
                Contact Us
              </button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#fffbde]/10 rounded-full animate-float"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#b3c7e6]/5 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-[#fffbde]/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-[#fffbde]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0032A0] mb-4">
              Get In Touch
            </h2>
            <p className="text-lg md:text-xl text-black max-w-3xl mx-auto">
              Have questions? We're here to help. Reach out to us anytime.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="space-y-6">
                {[
                  {
                    icon: PhoneIcon,
                    title: "Phone",
                    info: "+639123456789",
                    subInfo: "Available 24/7 for emergencies"
                  },
                  {
                    icon: EnvelopeIcon,
                    title: "Email",
                    info: "vetzambo@gmail.com",
                    subInfo: "We'll respond within 24 hours"
                  },
                  {
                    icon: MapPinIcon,
                    title: "Location",
                    info: "Lorem Ipsum",
                    subInfo: "Zamboanga City"
                  }
                ].map((contact, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#0032A0] to-[#0053d6] rounded-lg flex items-center justify-center flex-shrink-0">
                      <contact.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#0032A0] mb-1">{contact.title}</h3>
                      <p className="text-[#0053d6] font-medium">{contact.info}</p>
                      <p className="text-black text-sm">{contact.subInfo}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
                <h3 className="text-xl font-bold text-[#0032A0] mb-4">Office Hours</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-black">Monday - Friday</span>
                    <span className="text-[#0032A0] font-medium">8:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Saturday</span>
                    <span className="text-[#0032A0] font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Sunday</span>
                    <span className="text-[#0032A0] font-medium">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="border-t border-[#91c8e4] pt-2 mt-4">
                    <div className="flex justify-between">
                      <span className="text-blue-600 font-medium">Professional</span>
                      <span className="text-red-600 font-medium">24/7 Available</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-[#0032A0] mb-6">Send us a message</h3>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0053d6] mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#b3d6ec] rounded-lg focus:ring-2 focus:ring-[#749bc2] focus:border-transparent transition-all duration-200"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0053d6] mb-2">
                      Pet's Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-[#b3d6ec] rounded-lg focus:ring-2 focus:ring-[#749bc2] focus:border-transparent transition-all duration-200"
                      placeholder="Buddy"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0053d6] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-[#b3d6ec] rounded-lg focus:ring-2 focus:ring-[#749bc2] focus:border-transparent transition-all duration-200"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0053d6] mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 border border-[#b3d6ec] rounded-lg focus:ring-2 focus:ring-[#749bc2] focus:border-transparent transition-all duration-200"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0053d6] mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-[#b3d6ec] rounded-lg focus:ring-2 focus:ring-[#749bc2] focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Tell us about your pet's needs..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#749bc2] to-[#22223b] text-white px-8 py-4 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0032A0] text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0032A0] to-[#0053d6] rounded-lg flex items-center justify-center">
                  <HeartIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">ZamboVet</span>
              </div>
              <p className="text-white mb-6 max-w-md">
                Professional veterinary care made simple. We're dedicated to keeping your pets healthy and happy with modern technology and compassionate service.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 bg-[#0053d6] hover:bg-[#0032A0] rounded-lg flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-[#0053d6] hover:bg-[#0032A0] rounded-lg flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-[#0053d6] hover:bg-[#0032A0] rounded-lg flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.544 3.571.544 6.624 0 11.99-5.367 11.99-11.988C24.5 5.896 19.354.75 12.5.75z" />
                  </svg>
                </button>
                <button className="w-10 h-10 bg-[#0053d6] hover:bg-[#0032A0] rounded-lg flex items-center justify-center transition-colors duration-200">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.5.75C6.146.75 1 5.896 1 12.25c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.544 3.571.544 6.624 0 11.99-5.367 11.99-11.988C24.5 5.896 19.354.75 12.5.75z" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('home')} className="text-[#b3c7e6] hover:text-white transition-colors duration-200">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('services')} className="text-[#b3c7e6] hover:text-white transition-colors duration-200">
                    Services
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('about')} className="text-[#b3c7e6] hover:text-white transition-colors duration-200">
                    About Us
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('contact')} className="text-[#b3c7e6] hover:text-white transition-colors duration-200">
                    Contact
                  </button>
                </li>
                <li>
                  <a href="#" className="text-[#b3c7e6] hover:text-white transition-colors duration-200">
                    Book Appointment
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-[#b3c7e6] hover:text-white transition-colors duration-200">
                    General Checkups
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#b3c7e6] hover:text-white transition-colors duration-200">
                    Vaccinations
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#b3c7e6] hover:text-white transition-colors duration-200">
                    Professional Care
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#b3c7e6] hover:text-white transition-colors duration-200">
                    Surgery
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#b3c7e6] hover:text-white transition-colors duration-200">
                    Dental Care
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#91c8e4] mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-[#b3c7e6] text-sm">
                © 2025 ZamboVet. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-[#91c8e4] hover:text-[#fffbde] transition-colors duration-200">
                  Privacy Policy
                </a>
                <a href="#" className="text-[#91c8e4] hover:text-[#fffbde] transition-colors duration-200">
                  Terms of Service
                </a>
                <a href="#" className="text-[#91c8e4] hover:text-[#fffbde] transition-colors duration-200">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
