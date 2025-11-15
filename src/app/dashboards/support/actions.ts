
'use server';

import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { getAuth } from 'firebase-admin/auth';
import { revalidatePath } from 'next/cache';

customInitApp();
const db = getFirestore();

const NewTicketSchema = z.object({
  userEmail: z.string().email(),
  subject: z.string().min(5, 'Subject must be at least 5 characters.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
  priority: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['Open', 'In Progress']),
});

export async function createSupportTicket(formData: FormData) {
  try {
    const validatedFields = NewTicketSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) {
      return { success: false, message: 'Invalid form data.', errors: validatedFields.error.flatten().fieldErrors };
    }
    
    const { userEmail, subject, message, priority, status } = validatedFields.data;

    // Find user by email to get their UID and name
    const auth = getAuth();
    let userRecord;
    try {
        userRecord = await auth.getUserByEmail(userEmail);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return { success: false, message: 'No user found with this email address.' };
        }
        throw error;
    }

    const ticketId = nanoid(8).toUpperCase();
    
    const ticketData = {
      userId: userRecord.uid,
      userName: userRecord.displayName || 'N/A',
      userEmail: userEmail,
      ticketId,
      subject,
      message,
      priority,
      status,
      createdAt: FieldValue.serverTimestamp(),
      lastUpdate: FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('supportTickets').add(ticketData);

    revalidatePath('/dashboards/support');

    return { success: true, message: 'Ticket created successfully.', ticketId: docRef.id };

  } catch (error: any) {
    return { success: false, message: 'An unexpected error occurred: ' + error.message };
  }
}

export async function addSupportTicketReply(ticketId: string, replyText: string) {
    try {
        const adminUserEmail = 'support@tradinta.com'; // Placeholder
        const adminUserName = 'Tradinta Support'; // Placeholder

        const ticketRef = db.collection('supportTickets').doc(ticketId);
        const ticketSnap = await ticketRef.get();
        if (!ticketSnap.exists) {
            throw new Error('Ticket not found.');
        }

        const ticketData = ticketSnap.data();
        const userId = ticketData?.userId;
        if (!userId) {
            throw new Error('User ID not found on the ticket.');
        }

        const batch = db.batch();
        const timestamp = FieldValue.serverTimestamp();

        // 1. Add reply to ticket's subcollection
        const repliesCollection = ticketRef.collection('replies');
        const replyRef = db.collection('supportTickets').doc(); // Create a new doc reference for an ID
        batch.set(replyRef, {
            text: replyText,
            isSupportReply: true,
            authorName: adminUserName,
            authorEmail: adminUserEmail,
            createdAt: timestamp,
        });
        
        // 2. Update the main ticket document
        batch.update(ticketRef, {
            lastUpdate: timestamp,
            status: 'In Progress' // Replying automatically moves it to "In Progress"
        });
        
        // 3. Update the user's conversation metadata to show "unread"
        const userConversationRef = db.collection('users').doc(userId).collection('conversations').doc(ticketId);
        batch.set(userConversationRef, {
            isUnread: true,
            lastMessage: replyText,
            lastMessageTimestamp: timestamp,
        }, { merge: true });
        
        await batch.commit();

        revalidatePath(`/dashboards/support/tickets/${ticketId}`);

        return { success: true };

    } catch (error: any) {
        console.error('Error adding support ticket reply:', error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateSupportTicketStatus(ticketId: string, status: 'Open' | 'In Progress' | 'Resolved') {
     try {
        const ticketRef = db.collection('supportTickets').doc(ticketId);
        await ticketRef.update({ status: status, lastUpdate: FieldValue.serverTimestamp() });
        
        revalidatePath(`/dashboards/support/tickets/${ticketId}`);
        revalidatePath('/dashboards/support');

        return { success: true };
     } catch (error: any) {
        console.error('Error updating ticket status:', error);
        return { success: false, message: (error as Error).message };
     }
}
