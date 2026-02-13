
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Client, Candidate, CandidateStatus, Recruiter, RecruiterSession, ClientForRecruiter, HourLogEntry, WorkRecord } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
    currentUser: 'admin' | 'client' | 'recruiter' | null;
    currentClient: Client | null;
    currentRecruiter: RecruiterSession | null;
    clients: Client[];
    recruiters: Recruiter[];
    hourLogEntries: HourLogEntry[];
    workRecords: WorkRecord[];
    isLoading: boolean;
    error: string | null;
    loginAsAdmin: (pass: string) => Promise<boolean>;
    loginAsClient: (code: string) => Promise<boolean>;
    loginAsRecruiter: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    updateAdminPassword: (newPassword: string) => Promise<void>;
    
    // Client CRUD
    addClient: (clientData: { name: string; email: string; phone_number: string }) => Promise<void>;
    updateClient: (id: string, clientData: { name: string; email: string; phone_number: string }) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    updateClientNotes: (clientId: string, notes: string) => Promise<void>;
    generateNewCode: (clientId: string) => Promise<void>;

    // Recruiter CRUD
    addRecruiter: (username: string, password: string) => Promise<void>;
    updateRecruiterPassword: (recruiterId: string, password: string) => Promise<void>;
    deleteRecruiter: (recruiterId: string) => Promise<void>;

    // Candidate & Hours CRUD
    addCandidate: (clientId: string, candidateData: Omit<Candidate, 'id' | 'status' | 'rating' | 'comments' | 'created_at' | 'recruiters' | 'show_phone_to_client' | 'whatsapp_number' | 'resume_link' | 'recording_link'> & { whatsapp_number: string; resume_link: string, recording_link?: string, email?: string }, recruiterId?: string) => Promise<void>;
    updateCandidate: (candidateId: string, candidateData: Partial<Omit<Candidate, 'id' | 'recruiters'>>) => Promise<void>;
    deleteCandidate: (candidateId: string, clientId: string) => Promise<void>;
    updateCandidateFeedback: (clientId: string, candidateId: string, feedback: Partial<Pick<Candidate, 'status' | 'rating' | 'comments'>>) => Promise<void>;
    toggleCandidatePhoneVisibility: (candidateId: string, clientId: string, currentVisibility: boolean) => Promise<void>;
    addHourLogEntry: (entry: Omit<HourLogEntry, 'id' | 'candidates'>, newActiveHours: number, newNumSets: number) => Promise<void>;
    updateHourLogEntry: (entryId: string, updated: Partial<HourLogEntry>) => Promise<void>;
    deleteHourLogEntry: (entryId: string) => Promise<void>;

    // Payment Tracking - distribute payment across entries
    recordClientPayment: (clientId: string, entryIds: string[], amount: number) => Promise<void>;
    clearPaymentsForEntries: (clientId: string, entryIds: string[]) => Promise<void>;

    // Payment Status Management
    markRecordsAsPaid: (recordIds: string[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const ADMIN_PASSWORD_KEY = 'admin_password';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<'admin' | 'client' | 'recruiter' | null>(null);
    const [currentClient, setCurrentClient] = useState<Client | null>(null);
    const [currentRecruiter, setCurrentRecruiter] = useState<RecruiterSession | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [hourLogEntries, setHourLogEntries] = useState<HourLogEntry[]>([]);
    const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [adminPassword, setAdminPassword] = useState(() => localStorage.getItem(ADMIN_PASSWORD_KEY) || 'admin123');
    
    const fetchAdminData = async () => {
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('*, candidates(*, recruiters(username)), recruiters(*)')
            .order('created_at', { ascending: true });
        if (clientError) throw clientError;

        const { data: recruiterData, error: recruiterError } = await supabase
            .from('recruiters')
            .select('*')
            .order('created_at', { ascending: true });
        if (recruiterError) throw recruiterError;
        
        const { data: logData, error: logError } = await supabase
            .from('hour_log_entries')
            .select('*, candidates(*, clients(name))')
            .order('entry_date', { ascending: false });
        if (logError) throw logError;

        const { data: workData, error: workError } = await supabase
            .from('sf_work_records')
            .select('*')
            .order('created_at', { ascending: false });
        if (workError) throw workError;

        setClients(clientData as any);
        setRecruiters(recruiterData as Recruiter[]);
        setHourLogEntries(logData as HourLogEntry[]);
        setWorkRecords(workData as WorkRecord[]);
    };

    const loginAsAdmin = async (password: string): Promise<boolean> => {
        if (password !== adminPassword) {
            setError('Invalid password.');
            return false;
        }
        setIsLoading(true);
        setError(null);
        try {
            await fetchAdminData();
            setCurrentUser('admin');
            return true;
        } catch (e: any) {
            setError(e.message || 'Failed to fetch admin data.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const updateAdminPassword = async (newPassword: string) => {
        localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
        setAdminPassword(newPassword);
    };

    const loginAsClient = async (code: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*, candidates(*, recruiters(username))')
                .eq('access_code', code.toUpperCase())
                .single();
            if (error || !data) throw new Error('Invalid access code. Please try again.');
            
            console.log('[loginAsClient] Client found:', data.id, data.name, 'with', data.candidates?.length, 'candidates');
            
            // Fetch work records for this client
            const { data: workData, error: workError } = await supabase
                .from('sf_work_records')
                .select('*')
                .order('created_at', { ascending: false });
            if (workError) throw workError;

            console.log('[loginAsClient] Fetched', workData?.length, 'total work records');

            // Fetch hour log entries for this client
            const { data: logData, error: logError } = await supabase
                .from('hour_log_entries')
                .select('*, candidates(*, clients(name))')
                .order('entry_date', { ascending: false });
            if (logError) throw logError;
            
            setCurrentClient(data as Client);
            setWorkRecords(workData as WorkRecord[]);
            setHourLogEntries(logData as HourLogEntry[]);
            setCurrentUser('client');
            console.log('[loginAsClient] Login complete');
            return true;
        } catch (e: any) {
            setError(e.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };
    
    const loginAsRecruiter = async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            const { data: recruiter, error: recruiterError } = await supabase
                .from('recruiters')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single();

            if (recruiterError || !recruiter) {
                throw new Error('Invalid username or password.');
            }

            const { data: allClients, error: clientsError } = await supabase
                .from('clients')
                .select('id, name, access_code, candidates(*, recruiters(username))')
                .order('created_at', { ascending: true });
            
            if (clientsError) throw clientsError;

            const sessionData: RecruiterSession = {
                ...(recruiter as Recruiter),
                clients: allClients as ClientForRecruiter[],
            };

            setCurrentRecruiter(sessionData);
            setCurrentUser('recruiter');
            return true;

        } catch (e: any) {
            setError(e.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setCurrentClient(null);
        setCurrentRecruiter(null);
        setClients([]);
        setRecruiters([]);
        setWorkRecords([]);
        setError(null);
    };

    // --- Client CRUD ---
    const addClient = async (clientData: { name: string; email: string; phone_number: string }) => {
        const access_code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data, error } = await supabase.from('clients').insert({ ...clientData, access_code, notes: '' }).select().single();
        if (error) throw error;
        setClients(prev => [...prev, { ...data, candidates: [], recruiters: [] } as Client]);
    };

    const updateClient = async (id: string, clientData: { name: string; email: string; phone_number: string }) => {
        const { error, data } = await supabase.from('clients').update(clientData).eq('id', id).select().single();
        if (error) throw error;
        setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    };
    
    const updateClientNotes = async (clientId: string, notes: string) => {
        const { data, error } = await supabase.from('clients').update({ notes }).eq('id', clientId).select().single();
        if (error) throw error;
        setClients(prev => prev.map(c => (c.id === clientId ? { ...c, notes: data.notes } : c)));
    };

    const deleteClient = async (id: string) => {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const generateNewCode = async (clientId: string) => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { error } = await supabase.from('clients').update({ access_code: newCode }).eq('id', clientId);
        if (error) throw error;
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, access_code: newCode } : c));
    };

    // --- Recruiter CRUD ---
    const addRecruiter = async (username: string, password: string) => {
        const { data, error } = await supabase.from('recruiters').insert({ username, password }).select().single();
        if (error) throw error;
        setRecruiters(prev => [...prev, data as Recruiter]);
    };

    const updateRecruiterPassword = async (recruiterId: string, password: string) => {
        const { error } = await supabase.from('recruiters').update({ password }).eq('id', recruiterId);
        if (error) throw error;
    };

    const deleteRecruiter = async (recruiterId: string) => {
        const { error } = await supabase.from('recruiters').delete().eq('id', recruiterId);
        if (error) throw error;
        setRecruiters(prev => prev.filter(r => r.id !== recruiterId));
    };

    // --- Candidate & Hours CRUD ---
    const addHourLogEntry = async (entry: Omit<HourLogEntry, 'id' | 'candidates'> & { break_hours?: number; meetings_hours?: number }, newActiveHours: number, newNumSets: number) => {
        // 1. Add the new log entry. Try full payload first; if DB is missing new columns, use base columns only.
        const fullPayload = {
            candidate_id: entry.candidate_id,
            entry_date: entry.entry_date,
            hours_added: entry.hours_added,
            rate_per_hour: entry.rate_per_hour,
            active_hours: entry.active_hours,
            number_of_sets: entry.number_of_sets,
            sets_added: entry.sets_added ?? 0,
            balance_paid: Number(entry.balance_paid) || 0,
            break_hours: entry.break_hours ?? 0,
            meetings_hours: entry.meetings_hours ?? 0,
            notes: entry.notes ?? null
        };
        const basePayload = {
            candidate_id: entry.candidate_id,
            entry_date: entry.entry_date,
            hours_added: entry.hours_added,
            rate_per_hour: entry.rate_per_hour,
            notes: entry.notes ?? null
        };

        let insertError = (await supabase.from('hour_log_entries').insert(fullPayload)).error;
        if (insertError?.message?.includes('does not exist') || insertError?.code === '42703') {
            insertError = (await supabase.from('hour_log_entries').insert(basePayload)).error;
        }
        if (insertError) throw insertError;

        // 2. Update the candidate's cumulative record
        const { error: updateError } = await supabase
            .from('candidates')
            .update({ 
                active_hours: newActiveHours,
                number_of_sets: newNumSets,
                rate_per_hour: entry.rate_per_hour 
            })
            .eq('id', entry.candidate_id);
        if (updateError) throw updateError;

        await fetchAdminData();
    };

    const updateHourLogEntry = async (entryId: string, updated: Partial<HourLogEntry>) => {
        const oldEntry = hourLogEntries.find(e => e.id === entryId);
        if (!oldEntry) throw new Error('Hour entry not found');

        const newHours = typeof updated.hours_added === 'number' ? updated.hours_added : oldEntry.hours_added;
        const newSets = typeof updated.sets_added === 'number' ? (updated.sets_added ?? 0) : (oldEntry.sets_added ?? 0);
        const deltaHours = Number(newHours) - Number(oldEntry.hours_added);
        const deltaSets = Number(newSets) - Number(oldEntry.sets_added ?? 0);

        const payload: any = {};
        if (updated.entry_date) payload.entry_date = updated.entry_date;
        if (typeof updated.hours_added === 'number') payload.hours_added = updated.hours_added;
        if (typeof updated.rate_per_hour === 'number') payload.rate_per_hour = updated.rate_per_hour;
        if (typeof updated.active_hours === 'number') payload.active_hours = updated.active_hours;
        if (typeof updated.number_of_sets === 'number') payload.number_of_sets = updated.number_of_sets;
        if (typeof updated.sets_added !== 'undefined') payload.sets_added = updated.sets_added;
        if (typeof updated.balance_paid === 'number') payload.balance_paid = updated.balance_paid;
        if (typeof updated.notes !== 'undefined') payload.notes = updated.notes;

        const { error: updateError } = await supabase.from('hour_log_entries').update(payload).eq('id', entryId);
        if (updateError) throw updateError;

        // Update candidate cumulative totals (apply deltas)
        if (deltaHours !== 0 || deltaSets !== 0 || typeof updated.rate_per_hour === 'number') {
            const candidateId = oldEntry.candidate_id;
            const candidate = clients.flatMap(c => c.candidates).find(c => c.id === candidateId);
            const currentActive = Number(candidate?.active_hours ?? 0);
            const currentSets = Number(candidate?.number_of_sets ?? 0);
            const newActive = Math.max(0, currentActive + deltaHours);
            const newNumSets = Math.max(0, currentSets + deltaSets);
            const candPayload: any = { active_hours: newActive, number_of_sets: newNumSets };
            if (typeof updated.rate_per_hour === 'number') candPayload.rate_per_hour = updated.rate_per_hour;
            const { error: candErr } = await supabase.from('candidates').update(candPayload).eq('id', candidateId);
            if (candErr) throw candErr;
        }

        await fetchAdminData();
    };

    const deleteHourLogEntry = async (entryId: string) => {
        const oldEntry = hourLogEntries.find(e => e.id === entryId);
        if (!oldEntry) throw new Error('Hour entry not found');

        const { error: delError } = await supabase.from('hour_log_entries').delete().eq('id', entryId);
        if (delError) throw delError;

        // Subtract the removed hours/sets from candidate totals
        const candidateId = oldEntry.candidate_id;
        const candidate = clients.flatMap(c => c.candidates).find(c => c.id === candidateId);
        const currentActive = Number(candidate?.active_hours ?? 0);
        const currentSets = Number(candidate?.number_of_sets ?? 0);
        const newActive = Math.max(0, currentActive - Number(oldEntry.hours_added || 0));
        const newNumSets = Math.max(0, currentSets - Number(oldEntry.sets_added ?? 0));
        const { error: candErr } = await supabase.from('candidates').update({ active_hours: newActive, number_of_sets: newNumSets }).eq('id', candidateId);
        if (candErr) throw candErr;

        await fetchAdminData();
    };


    const addCandidate = async (clientId: string, candidateData: Omit<Candidate, 'id' | 'status' | 'rating' | 'comments' | 'created_at' | 'recruiters' | 'show_phone_to_client' | 'whatsapp_number' | 'resume_link' | 'recording_link'> & { whatsapp_number: string; resume_link: string, recording_link?: string, email?: string }, recruiterId?: string) => {
        const { data, error } = await supabase.from('candidates').insert({ 
            ...candidateData, 
            client_id: clientId,
            recruiter_id: recruiterId,
            status: CandidateStatus.Pending,
            rating: 0,
            comments: '',
            show_phone_to_client: false,
        }).select('*, recruiters(username)').single();
        if (error) throw error;
        
        const newCandidate = data as Candidate;

        const updateState = (prev: any[]) => prev.map(c => 
            c.id === clientId ? { ...c, candidates: [...c.candidates, newCandidate] } : c
        );

        if (currentUser === 'admin') {
            setClients(updateState);
        } else if (currentUser === 'recruiter') {
            setCurrentRecruiter(prev => prev ? { ...prev, clients: updateState(prev.clients) } : null);
        }
    };
    
    const updateCandidate = async (candidateId: string, candidateData: Partial<Omit<Candidate, 'id' | 'recruiters'>>) => {
        const { data, error } = await supabase.from('candidates').update(candidateData).eq('id', candidateId).select('*, recruiters(username)').single();
        if (error) throw error;
        
        const updatedCandidate = data as (Candidate & { client_id: string });
        
        const updateFn = <T extends Client | ClientForRecruiter>(client: T): T => {
            if (client.id === updatedCandidate.client_id) {
                return { ...client, candidates: client.candidates.map(cand => cand.id === candidateId ? updatedCandidate : cand) };
            }
            return client;
        };
        if(currentUser === 'admin') setClients(prev => prev.map(updateFn));
        if(currentUser === 'recruiter') setCurrentRecruiter(prev => prev ? {...prev, clients: prev.clients.map(updateFn)} : null);
    };

    const deleteCandidate = async (candidateId: string, clientId: string) => {
        const { error } = await supabase.from('candidates').delete().eq('id', candidateId);
        if (error) throw error;
        const updateFn = <T extends Client | ClientForRecruiter>(client: T): T => {
            if (client.id === clientId) {
                return { ...client, candidates: client.candidates.filter(c => c.id !== candidateId) };
            }
            return client;
        };
        if(currentUser === 'admin') setClients(prev => prev.map(updateFn));
        if(currentUser === 'recruiter') setCurrentRecruiter(prev => prev ? {...prev, clients: prev.clients.map(updateFn)} : null);
    };
    
    const updateCandidateFeedback = async (clientId: string, candidateId: string, feedback: Partial<Pick<Candidate, 'status' | 'rating' | 'comments'>>) => {
        const { data, error } = await supabase.from('candidates').update(feedback).eq('id', candidateId).select('*, recruiters(username)').single();
        if (error) throw error;
        
        const updatedCandidate = data as Candidate;
        const updateList = (candidates: Candidate[]) => candidates.map(c => c.id === candidateId ? updatedCandidate : c);

        if (currentUser === 'client') {
            setCurrentClient(prev => prev ? { ...prev, candidates: updateList(prev.candidates) } : null);
        }
        if (currentUser === 'admin') {
            setClients(prev => prev.map(c => c.id === clientId ? { ...c, candidates: updateList(c.candidates)} : c));
        }
    };

    const toggleCandidatePhoneVisibility = async (candidateId: string, clientId: string, currentVisibility: boolean) => {
        const { data, error } = await supabase
            .from('candidates')
            .update({ show_phone_to_client: !currentVisibility })
            .eq('id', candidateId)
            .select('*, recruiters(username)')
            .single();
        if (error) throw error;
    
        const updatedCandidate = data as Candidate;
    
        const updateFn = <T extends Client | ClientForRecruiter>(client: T): T => {
            if (client.id === clientId) {
                return {
                    ...client,
                    candidates: client.candidates.map(c => c.id === candidateId ? updatedCandidate : c)
                };
            }
            return client;
        };
        
        if (currentUser === 'admin') {
            setClients(prev => prev.map(updateFn));
        }
    };

    // Payment Tracking - Update balance_paid in database
    const recordClientPayment = async (clientId: string, entryIds: string[], amount: number) => {
        // Get the entries to distribute payment
        const entriesToUpdate = hourLogEntries.filter(e => entryIds.includes(e.id));
        if (entriesToUpdate.length === 0) {
            throw new Error('No entries found to record payment');
        }

        // Sort entries by date (oldest first) to distribute payment to oldest outstanding first
        const sortedEntries = [...entriesToUpdate].sort((a, b) =>
            new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
        );

        let remainingAmount = amount;
        const updates: { id: string; newBalance: number }[] = [];

        // Distribute payment across entries, paying up to each entry's remaining owed amount
        for (const entry of sortedEntries) {
            if (remainingAmount <= 0) break;

            const currentBalance = Number(entry.balance_paid) || 0;

            // Calculate what is owed for this entry
            const hours = Number(entry.hours_added) || 0;
            const breaks = Number((entry as any).break_hours ?? 0) || 0;
            const meetings = Number((entry as any).meetings_hours ?? 0) || 0;
            const sets = Number(entry.sets_added ?? 0) || 0;
            const rate = Number(entry.rate_per_hour) || 0;
            const entryOwed = (hours + breaks + meetings) * rate + (sets * 20);

            const remainingForEntry = Math.max(0, entryOwed - currentBalance);
            if (remainingForEntry <= 0) continue;

            const amountToPay = Math.min(remainingAmount, remainingForEntry);
            const newBalance = currentBalance + amountToPay;

            updates.push({ id: entry.id, newBalance });
            remainingAmount -= amountToPay;
        }

        // Update all entries in the database
        for (const update of updates) {
            const { error } = await supabase
                .from('hour_log_entries')
                .update({ balance_paid: update.newBalance })
                .eq('id', update.id);
            if (error) throw error;
        }

        // Refresh the data
        await fetchAdminData();
    };

    const clearPaymentsForEntries = async (clientId: string, entryIds: string[]) => {
        const entriesToClear = hourLogEntries.filter(e => entryIds.includes(e.id));
        for (const entry of entriesToClear) {
            const { error } = await supabase
                .from('hour_log_entries')
                .update({ balance_paid: 0 })
                .eq('id', entry.id);
            if (error) throw error;
        }
        await fetchAdminData();
    };

    // Mark work records as paid
    const markRecordsAsPaid = async (recordIds: string[]) => {
        if (recordIds.length === 0) {
            throw new Error('No records to mark as paid');
        }

        console.log('[markRecordsAsPaid] Starting with record IDs:', recordIds);

        // If payment_batch_id is used, find all records with the same batch ID
        let finalRecordIds = recordIds;
        const batchIds = workRecords
            .filter(r => recordIds.includes(r.id) && r.payment_batch_id)
            .map(r => r.payment_batch_id)
            .filter(Boolean) as string[];

        if (batchIds.length > 0) {
            // Include all records with these batch IDs
            const batchRecordIds = workRecords
                .filter(r => batchIds.includes(r.payment_batch_id || ''))
                .map(r => r.id);
            finalRecordIds = Array.from(new Set([...recordIds, ...batchRecordIds]));
            console.log('[markRecordsAsPaid] Expanded to batch records. Final IDs:', finalRecordIds);
        }

        // Update all records to 'paid' status
        console.log('[markRecordsAsPaid] Updating', finalRecordIds.length, 'records to payment_status = paid');
        for (const recordId of finalRecordIds) {
            const { error } = await supabase
                .from('sf_work_records')
                .update({ payment_status: 'paid' })
                .eq('id', recordId);
            if (error) {
                console.error('[markRecordsAsPaid] Error updating record', recordId, error);
                throw error;
            }
        }

        // Refresh work records
        console.log('[markRecordsAsPaid] Fetching updated work records');
        const { data: workData, error: workError } = await supabase
            .from('sf_work_records')
            .select('*')
            .order('created_at', { ascending: false });
        if (workError) {
            console.error('[markRecordsAsPaid] Error fetching updated records:', workError);
            throw workError;
        }

        console.log('[markRecordsAsPaid] Updated. New total records:', workData?.length);
        setWorkRecords(workData as WorkRecord[]);
    };



    return (
        <AppContext.Provider value={{ 
            currentUser, currentClient, currentRecruiter, clients, recruiters, hourLogEntries, workRecords, isLoading, error, 
            loginAsAdmin, loginAsClient, loginAsRecruiter, logout,
            updateAdminPassword,
            addClient, updateClient, deleteClient, updateClientNotes, generateNewCode,
            addRecruiter, updateRecruiterPassword, deleteRecruiter,
            addCandidate, updateCandidate, deleteCandidate, addHourLogEntry, updateHourLogEntry, deleteHourLogEntry,
            updateCandidateFeedback,
            toggleCandidatePhoneVisibility,
            recordClientPayment,
            clearPaymentsForEntries,
            markRecordsAsPaid,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
