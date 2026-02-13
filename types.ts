
export enum CandidateStatus {
    Pending = 'Pending',
    Texted = 'Texted',
    Good = 'Good',
    Interview = 'Interview',
    Interviewed = 'Interviewed',
    Rejected = 'Rejected',
    Probation = 'Probation',
    Training = 'Training',
}

export interface Candidate {
    id: string;
    created_at: string;
    name: string;
    alias?: string | null; // Employee alias/nickname
    role: string;
    email?: string | null;
    whatsapp_number: string; // E.g., '15551234567' for international format
    resume_link: string;
    recording_link?: string | null;
    show_phone_to_client: boolean;
    status: CandidateStatus;
    rating: number; // 0-5
    comments: string;
    recruiter_id?: string | null;
    recruiters?: { username: string } | null; // For displaying recruiter name
    // Fields for Candidate Payments
    rate_per_hour: number;
    total_hours: number;
    active_hours: number;
    number_of_sets: number;
}

export interface HourLogEntry {
    id: string;
    entry_date: string;
    candidate_id: string;
    hours_added: number;
    rate_per_hour: number;
    active_hours: number;
    number_of_sets: number;
    sets_added?: number; // sets added in this entry only (for payment: sets_added * 5)
    balance_paid: number;
    notes?: string | null;
    // Joined data for display
    candidates?: { 
        name: string; 
        status: CandidateStatus; 
        active_hours: number;
        number_of_sets: number;
        clients?: { name: string } | null 
    } | null;
}

export interface WorkRecord {
    id: string;
    created_at: string;
    client_id?: string; // Client this record belongs to
    employeeId: string;
    date: string;
    talkTime: number;
    waitTime: number;
    ratePerHour: number;
    setsAdded: number;
    breakMinutes: number;
    meetingMinutes: number;
    moes_total: number; // Moses total earnings
    payment_status?: 'pending' | 'paid' | 'archived'; // Payment status
    payment_batch_id?: string | null; // For grouping related records
    // Joined data for display
    employees?: {
        name: string;
    } | null;
}

export interface Recruiter {
    id: string;
    username: string;
    created_at: string;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    access_code: string;
    notes?: string;
    candidates: Candidate[];
    recruiters: Recruiter[]; // Recruiters assigned to this client
}

// A limited client view for logged-in recruiters
export interface ClientForRecruiter {
    id: string;
    name: string;
    access_code: string;
    candidates: Candidate[];
}

// Data shape for a recruiter who has logged in
export interface RecruiterSession extends Recruiter {
    clients: ClientForRecruiter[]; // List of all clients with limited info
}
