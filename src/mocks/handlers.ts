import { http, HttpResponse, delay } from 'msw';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Helper to persist data in the browser so it survives reloads and server restarts
const getDB = () => {
  const db = localStorage.getItem('mock_db');
  if (db) {
    const parsedDb = JSON.parse(db);
    if (!parsedDb.projects) parsedDb.projects = [];
    if (!parsedDb.sessions) parsedDb.sessions = [];
    if (!parsedDb.messages) parsedDb.messages = {};
    return parsedDb;
  }
  const initialDb = {
    projects: [
      {
        id: 'project-1',
        name: 'Default Project',
        description: 'This is the default mock project.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    sessions: [
      {
        id: 'session-1',
        project_id: 'project-1',
        title: 'Mock Chat Task 1',
        is_pinned: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'session-2',
        project_id: 'project-1',
        title: 'Mock Chat Task 2',
        is_pinned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    messages: {
      'session-1': [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello, what can you do?',
          created_at: new Date().toISOString()
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'I am a mock AI agent. I can help you test this UI! This response is pulled directly from the mock service worker.',
          created_at: new Date().toISOString()
        }
      ]
    }
  };
  localStorage.setItem('mock_db', JSON.stringify(initialDb));
  return initialDb;
};

const saveDB = (db: any) => {
  localStorage.setItem('mock_db', JSON.stringify(db));
};

export const handlers = [
  // Auth Mocks
  http.post(`${API_BASE}/auth/login`, async () => {
    await delay(800);
    return HttpResponse.json({
      access_token: 'mock-jwt-token-12345',
      token_type: 'bearer',
      user: {
        id: 'user-1',
        username: 'mockuser',
        created_at: new Date().toISOString()
      }
    });
  }),

  http.post(`${API_BASE}/auth/register`, async () => {
    await delay(800);
    return HttpResponse.json({
      access_token: 'mock-jwt-token-67890',
      token_type: 'bearer',
      user: {
        id: 'user-2',
        username: 'newuser',
        created_at: new Date().toISOString()
      }
    });
  }),

  // Projects Mocks
  http.get(`${API_BASE}/projects`, async () => {
    await delay(500);
    const db = getDB();
    return HttpResponse.json(db.projects);
  }),

  http.post(`${API_BASE}/projects`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as any;
    const db = getDB();

    const newProject = {
      id: `project-${Date.now()}`,
      name: body.name || 'New Project',
      description: body.description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.projects.push(newProject);

    // Create a default session for the new project
    const defaultSession = {
      id: `session-${Date.now() + 1}`,
      project_id: newProject.id,
      title: 'New Chat',
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.sessions.push(defaultSession);

    saveDB(db);

    return HttpResponse.json(newProject);
  }),

  // Projects / Sessions Mocks
  http.get(`${API_BASE}/projects/:projectId/sessions`, async ({ params }) => {
    await delay(500);
    const db = getDB();
    const { projectId } = params;
    const projectSessions = db.sessions.filter((s: any) => s.project_id === projectId);
    return HttpResponse.json(projectSessions);
  }),

  http.post(`${API_BASE}/projects/:projectId/sessions`, async ({ request, params }) => {
    await delay(500);
    const body = (await request.json()) as any;
    const { projectId } = params;
    const db = getDB();

    const newSession = {
      id: `session-${Date.now()}`,
      project_id: projectId,
      title: body.title || 'New Mock Session',
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.sessions.push(newSession);
    saveDB(db);

    return HttpResponse.json(newSession);
  }),

  http.patch(`${API_BASE}/projects/:projectId/sessions/:sessionId`, async ({ request, params }) => {
    await delay(500);
    const body = (await request.json()) as any;
    const { sessionId } = params;
    const db = getDB();

    const session = db.sessions.find((s: any) => s.id === sessionId);
    if (session) {
      if (body.title !== undefined) session.title = body.title;
      if (body.is_pinned !== undefined) session.is_pinned = body.is_pinned;
      session.updated_at = new Date().toISOString();
      saveDB(db);
    }

    return HttpResponse.json(session);
  }),

  http.delete(`${API_BASE}/projects/:projectId/sessions/:sessionId`, async ({ params }) => {
    await delay(500);
    const { sessionId } = params;
    const db = getDB();

    db.sessions = db.sessions.filter((s: any) => s.id !== sessionId);
    saveDB(db);

    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_BASE}/:projectId/:sessionId/messages`, async ({ params }) => {
    await delay(500);
    const db = getDB();
    const { sessionId } = params;
    return HttpResponse.json(db.messages[sessionId as string] || []);
  }),

  // Chat Streaming Mock
  http.post(`${API_BASE}/chat`, async ({ request }) => {
    const body = (await request.json()) as any;
    const db = getDB();

    // Save the user's message
    const sessionId = body.session_id;
    if (!db.messages[sessionId]) {
      db.messages[sessionId] = [];
    }

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: body.content,
      created_at: new Date().toISOString()
    };
    db.messages[sessionId].push(userMsg);

    // Create the assistant's message placeholder to be saved at the end
    const textToStream = "Hello! I am a mock response from MSW. I am streaming this text to simulate a real AI backend response.";
    const assistantMsg = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: textToStream,
      created_at: new Date().toISOString()
    };
    db.messages[sessionId].push(assistantMsg);
    saveDB(db);

    const stream = new ReadableStream({
      async start(controller) {
        // Mock a thinking delta
        const thinkEvent = `data: ${JSON.stringify({ event: 'thinking_delta', data: { delta: 'Thinking about how to mock this...\n' } })}\n\n`;
        controller.enqueue(new TextEncoder().encode(thinkEvent));
        await new Promise(r => setTimeout(r, 1000));

        // Mock content deltas
        const words = textToStream.split(' ');
        for (const word of words) {
          const contentEvent = `data: ${JSON.stringify({ event: 'content_delta', data: { delta: word + ' ' } })}\n\n`;
          controller.enqueue(new TextEncoder().encode(contentEvent));
          await new Promise(r => setTimeout(r, 100)); // 100ms per word
        }

        // Mock done
        const doneEvent = `data: ${JSON.stringify({ event: 'message_end', data: { message_id: assistantMsg.id } })}\n\n`;
        controller.enqueue(new TextEncoder().encode(doneEvent));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  }),
];
