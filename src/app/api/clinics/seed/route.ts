import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        // Sample clinic data
        const sampleClinics = [
            {
                name: "ZamboVet Central Clinic",
                address: "123 Veterans Avenue, Zamboanga City, Philippines",
                phone: "+63 999 123 4567",
                email: "info@zambovetcentral.com",
                latitude: 6.9214,
                longitude: 122.0790,
                operating_hours: {
                    monday: "8:00 AM - 6:00 PM",
                    tuesday: "8:00 AM - 6:00 PM",
                    wednesday: "8:00 AM - 6:00 PM",
                    thursday: "8:00 AM - 6:00 PM",
                    friday: "8:00 AM - 6:00 PM",
                    saturday: "9:00 AM - 5:00 PM",
                    sunday: "10:00 AM - 4:00 PM"
                },
                is_active: true
            },
            {
                name: "Pet Care Plus Veterinary Hospital",
                address: "456 Canelar Road, Zamboanga City, Philippines",
                phone: "+63 999 987 6543",
                email: "contact@petcareplus.ph",
                latitude: 6.9269,
                longitude: 122.0792,
                operating_hours: {
                    monday: "7:00 AM - 7:00 PM",
                    tuesday: "7:00 AM - 7:00 PM",
                    wednesday: "7:00 AM - 7:00 PM",
                    thursday: "7:00 AM - 7:00 PM",
                    friday: "7:00 AM - 7:00 PM",
                    saturday: "8:00 AM - 6:00 PM",
                    sunday: "Closed"
                },
                is_active: true
            },
            {
                name: "Mindanao Animal Medical Center",
                address: "789 Governor Camins Avenue, Zamboanga City, Philippines",
                phone: "+63 999 555 1234",
                email: "admin@mindanaoanimal.com",
                latitude: 6.9111,
                longitude: 122.0711,
                operating_hours: {
                    monday: "24/7",
                    tuesday: "24/7",
                    wednesday: "24/7",
                    thursday: "24/7",
                    friday: "24/7",
                    saturday: "24/7",
                    sunday: "24/7"
                },
                is_active: true
            },
            {
                name: "Paws & Claws Veterinary Clinic",
                address: "321 Paseo del Mar, Zamboanga City, Philippines",
                phone: "+63 999 777 8888",
                email: "info@pawsandclaws.ph",
                latitude: 6.9180,
                longitude: 122.0850,
                operating_hours: {
                    monday: "9:00 AM - 5:00 PM",
                    tuesday: "9:00 AM - 5:00 PM",
                    wednesday: "9:00 AM - 5:00 PM",
                    thursday: "9:00 AM - 5:00 PM",
                    friday: "9:00 AM - 5:00 PM",
                    saturday: "9:00 AM - 3:00 PM",
                    sunday: "Closed"
                },
                is_active: true
            },
            {
                name: "Zamboanga Pet Hospital",
                address: "654 Tomas Claudio Street, Zamboanga City, Philippines",
                phone: "+63 999 444 3333",
                email: "contact@zamboangapethospital.com",
                latitude: 6.9150,
                longitude: 122.0750,
                operating_hours: {
                    monday: "8:00 AM - 8:00 PM",
                    tuesday: "8:00 AM - 8:00 PM",
                    wednesday: "8:00 AM - 8:00 PM",
                    thursday: "8:00 AM - 8:00 PM",
                    friday: "8:00 AM - 8:00 PM",
                    saturday: "8:00 AM - 6:00 PM",
                    sunday: "9:00 AM - 5:00 PM"
                },
                is_active: true
            },
            {
                name: "Animal Care Specialists",
                address: "987 San Jose Road, Zamboanga City, Philippines",
                phone: "+63 999 222 1111",
                email: "info@animalcarespecialists.ph",
                latitude: 6.9280,
                longitude: 122.0720,
                operating_hours: {
                    monday: "7:30 AM - 6:30 PM",
                    tuesday: "7:30 AM - 6:30 PM",
                    wednesday: "7:30 AM - 6:30 PM",
                    thursday: "7:30 AM - 6:30 PM",
                    friday: "7:30 AM - 6:30 PM",
                    saturday: "8:00 AM - 5:00 PM",
                    sunday: "Closed"
                },
                is_active: true
            },
            {
                name: "Emergency Vet Center",
                address: "147 La Purisima Street, Zamboanga City, Philippines",
                phone: "+63 999 666 9999",
                email: "emergency@vetcenter.ph",
                latitude: 6.9080,
                longitude: 122.0780,
                operating_hours: {
                    monday: "24/7",
                    tuesday: "24/7",
                    wednesday: "24/7",
                    thursday: "24/7",
                    friday: "24/7",
                    saturday: "24/7",
                    sunday: "24/7"
                },
                is_active: true
            },
            {
                name: "Family Pet Clinic",
                address: "258 Tetuan Road, Zamboanga City, Philippines",
                phone: "+63 999 333 4444",
                email: "family@petclinic.ph",
                latitude: 6.9220,
                longitude: 122.0820,
                operating_hours: {
                    monday: "8:30 AM - 5:30 PM",
                    tuesday: "8:30 AM - 5:30 PM",
                    wednesday: "8:30 AM - 5:30 PM",
                    thursday: "8:30 AM - 5:30 PM",
                    friday: "8:30 AM - 5:30 PM",
                    saturday: "9:00 AM - 4:00 PM",
                    sunday: "Closed"
                },
                is_active: true
            }
        ];

        // Insert clinics
        const { data: insertedClinics, error: clinicError } = await supabase
            .from('clinics')
            .insert(sampleClinics)
            .select();

        if (clinicError) {
            console.error('Error inserting clinics:', clinicError);
            return NextResponse.json(
                { error: 'Failed to insert clinics', details: clinicError },
                { status: 500 }
            );
        }

        // Sample veterinarian data for each clinic
        const sampleVeterinarians = [
            // ZamboVet Central Clinic
            {
                clinic_id: insertedClinics[0].id,
                full_name: "Maria Santos",
                specialization: "General Practice",
                license_number: "VET-ZC-2023-001",
                years_experience: 8,
                consultation_fee: 1500.00,
                is_available: true,
                average_rating: 4.8
            },
            {
                clinic_id: insertedClinics[0].id,
                full_name: "Carlos Rodriguez",
                specialization: "Emergency Medicine",
                license_number: "VET-ZC-2023-002",
                years_experience: 12,
                consultation_fee: 2000.00,
                is_available: true,
                average_rating: 4.9
            },
            // Pet Care Plus
            {
                clinic_id: insertedClinics[1].id,
                full_name: "Ana Reyes",
                specialization: "Surgery",
                license_number: "VET-ZC-2023-003",
                years_experience: 15,
                consultation_fee: 2500.00,
                is_available: true,
                average_rating: 4.7
            },
            {
                clinic_id: insertedClinics[1].id,
                full_name: "Miguel Fernandez",
                specialization: "Internal Medicine",
                license_number: "VET-ZC-2023-004",
                years_experience: 10,
                consultation_fee: 1800.00,
                is_available: false,
                average_rating: 4.6
            },
            // Mindanao Animal Medical Center
            {
                clinic_id: insertedClinics[2].id,
                full_name: "Elena Cruz",
                specialization: "Emergency Medicine",
                license_number: "VET-ZC-2023-005",
                years_experience: 18,
                consultation_fee: 3000.00,
                is_available: true,
                average_rating: 4.9
            },
            {
                clinic_id: insertedClinics[2].id,
                full_name: "Roberto Dela Cruz",
                specialization: "Orthopedics",
                license_number: "VET-ZC-2023-006",
                years_experience: 14,
                consultation_fee: 2800.00,
                is_available: true,
                average_rating: 4.8
            },
            {
                clinic_id: insertedClinics[2].id,
                full_name: "Sofia Martinez",
                specialization: "Dermatology",
                license_number: "VET-ZC-2023-007",
                years_experience: 9,
                consultation_fee: 2200.00,
                is_available: true,
                average_rating: 4.5
            }
        ];

        // Note: This would need actual user_ids from the profiles table
        // For demo purposes, we're only creating the basic structure
        
        return NextResponse.json({
            success: true,
            message: 'Sample clinic data inserted successfully',
            data: {
                clinics: insertedClinics,
                veterinarians_template: sampleVeterinarians
            }
        });

    } catch (error) {
        console.error('Seed Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
