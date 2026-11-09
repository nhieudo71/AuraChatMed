import { ChatMessage } from '../types';

/**
 * Google Workspace integration service.
 * Communicates directly with 1P Google Workspace REST APIs using client-side OAuth Bearer token.
 */

export interface WorkspaceExportResult {
  success: boolean;
  type: 'sheets' | 'docs' | 'calendar' | 'slides' | 'tasks' | 'forms';
  url?: string;
  id?: string;
  title: string;
  error?: string;
}

// 1. Google Sheets: Create a spreadsheet and append conversation rows
export async function createGoogleSheet(
  accessToken: string,
  title: string,
  messages: ChatMessage[]
): Promise<WorkspaceExportResult> {
  try {
    // 1. Create spreadsheet
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `AuraChat - ${title}`,
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Failed to create spreadsheet');
    }

    const sheetData = await createRes.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = sheetData.spreadsheetUrl;

    // 2. Format values
    const rows: (string | number)[][] = [
      ['STT', 'Thời gian', 'Vai trò', 'Nội dung', 'Ghi chú suy nghĩ'],
    ];

    messages.forEach((m, idx) => {
      rows.push([
        idx + 1,
        new Date(m.createdAt).toLocaleString(),
        m.role === 'user' ? 'Người dùng' : m.role === 'model' ? 'Aura AI' : 'Hệ thống',
        m.content,
        m.thinkingContent || '',
      ]);
    });

    // 3. Append data
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      }
    );

    return {
      success: true,
      type: 'sheets',
      id: spreadsheetId,
      url: spreadsheetUrl,
      title: `AuraChat - ${title}`,
    };
  } catch (error: any) {
    return {
      success: false,
      type: 'sheets',
      title,
      error: error.message || 'Error creating Google Sheet',
    };
  }
}

// 2. Google Docs: Create a new Google Doc with full conversation
export async function createGoogleDoc(
  accessToken: string,
  title: string,
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<WorkspaceExportResult> {
  try {
    // 1. Create empty doc
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `AuraChat - ${title}`,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Failed to create document');
    }

    const docData = await createRes.json();
    const documentId = docData.documentId;

    // Build text content
    let fullText = `AuraChat: ${title}\nNgày tạo: ${new Date().toLocaleString()}\n\n`;
    if (systemPrompt) {
      fullText += `[Chỉ dẫn hệ thống]\n${systemPrompt}\n\n`;
    }
    fullText += `--- LỊCH SỬ HỘI THOẠI ---\n\n`;

    for (const m of messages) {
      const role = m.role === 'user' ? 'Người dùng' : m.role === 'model' ? 'Aura AI' : 'Hệ thống';
      fullText += `[${role}] - ${new Date(m.createdAt).toLocaleTimeString()}\n`;
      if (m.thinkingContent) {
        fullText += `[Suy nghĩ]: ${m.thinkingContent}\n`;
      }
      fullText += `${m.content}\n\n----------------------------\n\n`;
    }

    // Insert text
    await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: fullText,
            },
          },
        ],
      }),
    });

    return {
      success: true,
      type: 'docs',
      id: documentId,
      url: `https://docs.google.com/document/d/${documentId}/edit`,
      title: `AuraChat - ${title}`,
    };
  } catch (error: any) {
    return {
      success: false,
      type: 'docs',
      title,
      error: error.message || 'Error creating Google Doc',
    };
  }
}

// 3. Google Calendar: Schedule an event from chat
export async function createGoogleCalendarEvent(
  accessToken: string,
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date
): Promise<WorkspaceExportResult> {
  try {
    const res = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          description,
          start: { dateTime: startTime.toISOString() },
          end: { dateTime: endTime.toISOString() },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to create calendar event');
    }

    const eventData = await res.json();
    return {
      success: true,
      type: 'calendar',
      id: eventData.id,
      url: eventData.htmlLink,
      title: summary,
    };
  } catch (error: any) {
    return {
      success: false,
      type: 'calendar',
      title: summary,
      error: error.message || 'Error creating Calendar event',
    };
  }
}

// 4. Google Slides: Create a presentation deck
export async function createGoogleSlidePresentation(
  accessToken: string,
  title: string,
  slides: Array<{ title: string; content: string }>
): Promise<WorkspaceExportResult> {
  try {
    // 1. Create blank presentation
    const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `AuraChat - ${title}`,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Failed to create presentation');
    }

    const presData = await createRes.json();
    const presentationId = presData.presentationId;

    // 2. Add slide requests
    const requests: any[] = [];
    slides.forEach((slide, idx) => {
      const slideId = `slide_${idx + 1}_${Date.now()}`;
      requests.push({
        createSlide: {
          objectId: slideId,
          insertionIndex: idx + 1,
          slideLayoutReference: {
            predefinedLayout: 'TITLE_AND_BODY',
          },
        },
      });
    });

    if (requests.length > 0) {
      await fetch(
        `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
        }
      );
    }

    return {
      success: true,
      type: 'slides',
      id: presentationId,
      url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      title: `AuraChat - ${title}`,
    };
  } catch (error: any) {
    return {
      success: false,
      type: 'slides',
      title,
      error: error.message || 'Error creating Google Slides',
    };
  }
}

// 5. Google Tasks: Create tasks list or new tasks
export async function createGoogleTask(
  accessToken: string,
  title: string,
  notes?: string
): Promise<WorkspaceExportResult> {
  try {
    const res = await fetch(
      'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          notes,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to create task');
    }

    const task = await res.json();
    return {
      success: true,
      type: 'tasks',
      id: task.id,
      url: 'https://tasks.google.com',
      title,
    };
  } catch (error: any) {
    return {
      success: false,
      type: 'tasks',
      title,
      error: error.message || 'Error creating Google Task',
    };
  }
}

// 6. Google Forms: Create a form from chat
export async function createGoogleForm(
  accessToken: string,
  title: string,
  description?: string
): Promise<WorkspaceExportResult> {
  try {
    const res = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        info: {
          title: `AuraChat - ${title}`,
          documentTitle: title,
          description: description || 'Biểu mẫu được tạo tự động bởi AuraChat AI',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Failed to create form');
    }

    const formData = await res.json();
    return {
      success: true,
      type: 'forms',
      id: formData.formId,
      url: formData.responderUri || `https://docs.google.com/forms/d/${formData.formId}/edit`,
      title: `AuraChat - ${title}`,
    };
  } catch (error: any) {
    return {
      success: false,
      type: 'forms',
      title,
      error: error.message || 'Error creating Google Form',
    };
  }
}
