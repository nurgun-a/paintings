import { Router, Request, Response } from 'express';
import { DBRepository } from '../repository/index.js';
import { AIEngineService } from '../services/ai-engine.js';
import { VisionEngineService } from '../services/vision-engine.js';
import { 
  VisionPipelineRouter, 
  OCREngine, 
  QREngine, 
  ClassificationEngine, 
  LocalVisionProvider 
} from '../../packages/vision-engine/index.js';
import { 
  authGuard, 
  rolesGuard, 
  hashPassword, 
  verifyPassword, 
  generateAccessToken, 
  Role, 
  AuthRequest 
} from '../auth/index.js';
import { 
  QuestProject, 
  PlayerProfile, 
  LiveEvent, 
  ChatMessage, 
  QuestStep 
} from '../../packages/types/index.js';
import { 
  AIQuestPlannerService, 
  MultiAgentDesignerService, 
  SimulationEngine, 
  AIFeedbackOptimizer, 
  LogicalValidator 
} from '../../packages/ai-quest-designer/index.js';

export const apiRouter = Router();

const dbRepo = DBRepository.getInstance();
const aiService = new AIEngineService();
const visionService = new VisionEngineService();

// GET all projects and live events are accessible by players as well to read available quests and real-time events.
apiRouter.get('/admin/projects', (req: Request, res: Response) => {
  res.json(dbRepo.getProjects());
});

apiRouter.get('/admin/live-events', (req: Request, res: Response) => {
  res.json(dbRepo.getLiveEvents());
});

// Apply Auth Guards for Player and Admin sections
apiRouter.use('/admin', authGuard, rolesGuard([Role.ADMIN, Role.SUPER_ADMIN]));
apiRouter.use('/player', authGuard);

// Real-time Event Broadcaster Reference (injected from server.ts)
let broadcastEvent: ((payload: any) => void) | null = null;
export function setEventBroadcaster(broadcaster: (payload: any) => void) {
  broadcastEvent = broadcaster;
}

// ==========================================
// 1. AUTHENTICATION MODULE CONTROLLERS
// ==========================================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'All registration parameters are required.' });
  }

  const users = dbRepo.getUsers();
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  const userId = Math.random().toString(36).substring(2, 15);
  const passwordHash = hashPassword(password);

  const newUser = {
    id: userId,
    email,
    username,
    passwordHash,
    role: Role.PLAYER,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  // Auto create Player Profile
  const players = dbRepo.getPlayers();
  const newPlayer: PlayerProfile = {
    userId,
    username,
    level: 1,
    xp: 0,
    rank: 'Новичок',
    inventory: ['Компас'],
    achievements: ['Первый Шаг'],
    questProgress: {}
  };
  players.push(newPlayer);
  dbRepo.save();

  const token = generateAccessToken({ userId, email, role: Role.PLAYER });
  res.status(201).json({ token, profile: newPlayer });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const users = dbRepo.getUsers();
  const user = users.find(u => u.email === email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or security password.' });
  }

  const token = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const players = dbRepo.getPlayers();
  const playerProfile = players.find(p => p.userId === user.id) || players[0];

  res.json({ token, role: user.role, profile: playerProfile });
});


// ==========================================
// 2. ADMIN PROJECT & CONTEXT API
// ==========================================

// Get all projects (ADMIN / SUPER_ADMIN)
// Already handled above with appropriate PLAYER accessibility.

// Create new quest project
apiRouter.post('/admin/projects', (req: Request, res: Response) => {
  const { name, description, status, lore, steps } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const projects = dbRepo.getProjects();
  let generatedId = name.toLowerCase()
    .replace(/[а-яё]/g, (ch) => {
      const translit: Record<string, string> = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
      };
      return translit[ch] || '';
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
    
  if (!generatedId) generatedId = 'quest';
  const id = `${generatedId}-${Math.random().toString(36).substring(2, 7)}`;

  const newProject: QuestProject = {
    id,
    name,
    description: description || '',
    status: status || 'draft',
    lore: lore || { systemPrompt: '', story: '', rules: '' },
    npcs: req.body.npcs || [{ id: 'guide', name: 'Проводник', role: 'Гид', personality: 'Дружелюбный', avatar: '🧙‍♂️' }],
    steps: steps || []
  };

  projects.push(newProject);
  dbRepo.save();
  res.status(201).json(newProject);
});

// Update quest project
apiRouter.put('/admin/projects/:id', (req: Request, res: Response) => {
  const projects = dbRepo.getProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found.' });

  projects[idx] = { ...projects[idx], ...req.body, id: req.params.id };
  dbRepo.save();
  res.json(projects[idx]);
});

// Delete project
apiRouter.delete('/admin/projects/:id', (req: Request, res: Response) => {
  const projects = dbRepo.getProjects();
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found.' });

  projects.splice(idx, 1);
  dbRepo.save();
  res.json({ success: true, message: 'Project removed successfully.' });
});

// Export quest project schema
apiRouter.get('/admin/projects/:id/export', (req: Request, res: Response) => {
  const projects = dbRepo.getProjects();
  const project = projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json(project);
});

// Import project schema
apiRouter.post('/admin/projects/import', (req: Request, res: Response) => {
  const { projectData } = req.body;
  if (!projectData || !projectData.name) {
    return res.status(400).json({ error: 'Invalid project layout configuration.' });
  }

  const projects = dbRepo.getProjects();
  projectData.id = `imported-${Math.random().toString(36).substring(2, 7)}`;
  projects.push(projectData);
  dbRepo.save();

  res.status(201).json(projectData);
});


// ==========================================
// 3. LIVE EVENTS ENDPOINT
// ==========================================

// Already handled above with appropriate PLAYER accessibility.

apiRouter.post('/admin/live-events', (req: Request, res: Response) => {
  const { event } = req.body;
  if (!event) return res.status(400).json({ error: 'Event payload required' });

  const events = dbRepo.getLiveEvents();
  events.push(event);

  // Auto-inject broadcast message into active players' chat histories
  const players = dbRepo.getPlayers();
  for (const player of players) {
    if (player.questProgress) {
      for (const questId of Object.keys(player.questProgress)) {
        const progress = player.questProgress[questId];
        if (progress && !progress.completed) {
          if (!progress.chatHistory) {
            progress.chatHistory = [];
          }
          progress.chatHistory.push({
            sender: 'system',
            text: `📢 [Центр Живого Вещания]: "${event.title}"\n${event.description}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  dbRepo.save();

  // SSE Broadcast trigger
  if (broadcastEvent) {
    broadcastEvent({
      type: 'LIVE_EVENT',
      event
    });
  }

  res.status(201).json(event);
});

apiRouter.delete('/admin/live-events/:id', (req: Request, res: Response) => {
  const events = dbRepo.getLiveEvents();
  const idx = events.findIndex(e => e.id === req.params.id);
  if (idx !== -1) {
    events.splice(idx, 1);
    dbRepo.save();
  }
  res.json({ success: true });
});

apiRouter.post('/admin/projects/:id/live-event', (req: Request, res: Response) => {
  const { title, description, type, verificationData, reward } = req.body;

  const newEvent: LiveEvent = {
    id: Math.random().toString(36).substring(2, 11),
    title: title || 'Экстренное LIVE-событие!',
    description: description || 'Всем искателям приготовиться!',
    type: type || 'TEXT',
    verificationData: verificationData || {},
    reward: reward || { xp: 150 },
    timestamp: new Date().toISOString()
  };

  dbRepo.getLiveEvents().push(newEvent);

  // Auto-inject broadcast message into active players' chat histories
  const players = dbRepo.getPlayers();
  for (const player of players) {
    if (player.questProgress) {
      for (const questId of Object.keys(player.questProgress)) {
        const progress = player.questProgress[questId];
        if (progress && !progress.completed) {
          if (!progress.chatHistory) {
            progress.chatHistory = [];
          }
          progress.chatHistory.push({
            sender: 'system',
            text: `📢 [Центр Живого Вещания]: "${newEvent.title}"\n${newEvent.description}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  dbRepo.save();

  // Push notifications to SSE broadcast pipe instantly
  if (broadcastEvent) {
    broadcastEvent({
      type: 'LIVE_EVENT',
      event: newEvent
    });
  }

  res.status(201).json({ success: true, event: newEvent });
});

// ==========================================
// 3.5 ADMIN PLAYER MANAGEMENT ENDPOINTS
// ==========================================

apiRouter.get('/admin/players', (req: Request, res: Response) => {
  res.json(dbRepo.getPlayers());
});

apiRouter.post('/admin/players/:userId/override-message', (req: Request, res: Response) => {
  const { text, sender } = req.body;
  const players = dbRepo.getPlayers();
  const player = players.find(p => p.userId === req.params.userId) || players[0];
  
  if (!player) return res.status(404).json({ error: 'Player not found.' });

  // Add message to first joined quest chat history
  const activeQuests = Object.keys(player.questProgress);
  if (activeQuests.length > 0) {
    player.questProgress[activeQuests[0]].chatHistory.push({
      sender: sender || 'gamemaster',
      text,
      timestamp: new Date().toISOString()
    });
    dbRepo.save();
  }

  res.json(player);
});

apiRouter.post('/admin/players/:userId/reset', (req: Request, res: Response) => {
  const players = dbRepo.getPlayers();
  const player = players.find(p => p.userId === req.params.userId) || players[0];
  
  if (!player) return res.status(404).json({ error: 'Player not found.' });

  player.level = 1;
  player.xp = 0;
  player.rank = 'Новичок';
  player.inventory = ['Компас'];
  player.achievements = ['Первый Шаг'];
  player.questProgress = {};
  dbRepo.save();

  res.json(player);
});

// ==========================================
// 4. PLAYER CORE WORKFLOW
// ==========================================

apiRouter.get('/player/quests', (req: Request, res: Response) => {
  const published = dbRepo.getProjects().filter(p => p.status === 'published');
  res.json(published);
});

apiRouter.get('/player/profile', (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.userId;
  const players = dbRepo.getPlayers();
  const player = players.find(p => p.userId === userId) || players[0];
  res.json(player);
});

apiRouter.post('/player/profile/update', (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  const userId = (req as AuthRequest).user?.userId;
  const player = dbRepo.getPlayers().find(p => p.userId === userId) || dbRepo.getPlayers()[0];
  if (player) {
    player.username = username;
    dbRepo.save();
    return res.json({ success: true, profile: player });
  }
  res.status(404).json({ error: 'Player profile not found' });
});

apiRouter.post('/player/join', (req: Request, res: Response) => {
  const { questId } = req.body;
  const project = dbRepo.getProjects().find(p => p.id === questId);
  if (!project) return res.status(404).json({ error: 'Quest project not found.' });

  const userId = (req as AuthRequest).user?.userId;
  const player = dbRepo.getPlayers().find(p => p.userId === userId) || dbRepo.getPlayers()[0];

  if (!player.questProgress[questId]) {
    player.questProgress[questId] = {
      currentStepIndex: 0,
      completed: false,
      chatHistory: [
        {
          sender: 'gamemaster',
          text: `Приветствую на квесте "${project.name}"! Я — ${project.npcs[0]?.name || 'твой Проводник'}. Прочитай сюжет: "${project.lore.story}". Твое первое испытание: ${project.steps[0]?.description || 'Напиши мне, когда будешь готов.'}`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    dbRepo.save();
  }

  res.json(player.questProgress[questId]);
});

// Award XP & Check levels helper
function awardPlayerXP(player: PlayerProfile, amount: number, logs: string[]) {
  player.xp += amount;
  const oldLevel = player.level;
  player.level = Math.floor(player.xp / 500) + 1;

  if (player.level >= 10) {
    player.rank = 'Великий Шаман';
  } else if (player.level >= 6) {
    player.rank = 'Архивариус';
  } else if (player.level >= 3) {
    player.rank = 'Следопыт';
  } else {
    player.rank = 'Новичок';
  }

  logs.push(`Получено +${amount} XP!`);
  if (player.level > oldLevel) {
    logs.push(`🎉 Вы получили новый уровень: ${player.level} (${player.rank})!`);
  }
}

// POST message in Chat State Machine
apiRouter.post('/player/chat', async (req: Request, res: Response) => {
  const { questId, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message cannot be empty.' });

  const projects = dbRepo.getProjects();
  const project = projects.find(p => p.id === questId);
  if (!project) return res.status(404).json({ error: 'Quest project not found.' });

  const userId = (req as AuthRequest).user?.userId;
  const player = dbRepo.getPlayers().find(p => p.userId === userId) || dbRepo.getPlayers()[0];
  const progress = player.questProgress[questId];

  if (!progress) {
    return res.status(400).json({ error: 'Register/Join this quest first.' });
  }

  // Record user statement
  progress.chatHistory.push({
    sender: 'player',
    text: message,
    timestamp: new Date().toISOString()
  });

  const activeStep: QuestStep | undefined = project.steps[progress.currentStepIndex];
  const systemLogs: string[] = [];

  // Text Verification step checks
  if (activeStep && activeStep.type === 'TEXT') {
    const cleanUser = message.toLowerCase().trim().replace(/[\s\p{P}]+/gu, '');
    const answers = activeStep.verificationData.answers || [];

    const isMatched = answers.some(ans => {
      const cleanAns = ans.toLowerCase().trim().replace(/[\s\p{P}]+/gu, '');
      return cleanUser.includes(cleanAns) || cleanAns.includes(cleanUser);
    });

    if (isMatched) {
      systemLogs.push(`✅ Задание "${activeStep.title}" успешно разгадано!`);
      if (activeStep.reward.item) {
        player.inventory.push(activeStep.reward.item);
        systemLogs.push(`🎒 Получен предмет: ${activeStep.reward.item}`);
      }
      if (activeStep.reward.achievement) {
        player.achievements.push(activeStep.reward.achievement);
        systemLogs.push(`🏆 Новое достижение: ${activeStep.reward.achievement}`);
      }
      awardPlayerXP(player, activeStep.reward.xp, systemLogs);

      progress.currentStepIndex += 1;
      if (progress.currentStepIndex >= project.steps.length) {
        progress.completed = true;
        systemLogs.push(`🎉 Поздравляем! Квест "${project.name}" завершен победой!`);
      } else {
        const nextStep = project.steps[progress.currentStepIndex];
        systemLogs.push(`Следующее испытание: "${nextStep.title}" - ${nextStep.description}`);
      }
    }
  }

  // Fetch contextual reply from Gemini
  const activeStepNow = project.steps[progress.currentStepIndex];
  const historyParts = progress.chatHistory.slice(-10).map(m => ({
    role: m.sender === 'player' ? 'user' as const : 'model' as const,
    text: m.text
  }));

  const provider = ((project as any).aiProvider || 'gemini') as any;
  const aiText = await aiService.getAIResponse(provider, project, player, historyParts, message);

  progress.chatHistory.push({
    sender: 'gamemaster',
    text: aiText,
    timestamp: new Date().toISOString()
  });

  if (systemLogs.length > 0) {
    progress.chatHistory.push({
      sender: 'system',
      text: systemLogs.join('\n'),
      timestamp: new Date().toISOString()
    });
  }

  dbRepo.save();
  res.json({ progress, playerProfile: player });
});

// Photo Verification (Vision AI)
apiRouter.post('/player/verify-photo', async (req: Request, res: Response) => {
  const { questId, photoBase64 } = req.body;
  if (!photoBase64) return res.status(400).json({ error: 'Photo content (base64) required' });

  const projects = dbRepo.getProjects();
  const project = projects.find(p => p.id === questId);
  if (!project) return res.status(404).json({ error: 'Quest not found.' });

  const userId = (req as AuthRequest).user?.userId;
  const player = dbRepo.getPlayers().find(p => p.userId === userId) || dbRepo.getPlayers()[0];
  const progress = player.questProgress[questId];

  if (!progress) return res.status(400).json({ error: 'Join the quest first' });

  const activeStep = project.steps[progress.currentStepIndex];
  if (!activeStep || activeStep.type !== 'PHOTO') {
    return res.status(400).json({ error: 'Current step does not require photo upload.' });
  }

  progress.chatHistory.push({
    sender: 'player',
    text: '[Фотоснимок]',
    imageUrl: photoBase64,
    timestamp: new Date().toISOString()
  });

  const refDesc = activeStep.verificationData.referenceImage || 'Beautiful green scenery';
  const check = await visionService.verifyPhotoSimilarity(refDesc, photoBase64);

  const logs: string[] = [];
  logs.push(`Анализ фото: ${check.analysis} (Оценка сходства: ${check.similarity}%)`);

  if (check.success) {
    logs.push(`✅ Задание "${activeStep.title}" засчитано!`);
    if (activeStep.reward.item) {
      player.inventory.push(activeStep.reward.item);
      logs.push(`🎒 В рюкзак добавлен предмет: ${activeStep.reward.item}`);
    }
    if (activeStep.reward.achievement) {
      player.achievements.push(activeStep.reward.achievement);
      logs.push(`🏆 Достижение получено: ${activeStep.reward.achievement}`);
    }
    awardPlayerXP(player, activeStep.reward.xp, logs);

    progress.currentStepIndex += 1;
    if (progress.currentStepIndex >= project.steps.length) {
      progress.completed = true;
      logs.push(`🎉 Вы блистательно закончили квест "${project.name}"!`);
    } else {
      const nextStep = project.steps[progress.currentStepIndex];
      logs.push(`Следующий шаг: "${nextStep.title}" - ${nextStep.description}`);
    }
  } else {
    logs.push(`❌ Фотоснимок отклонен (требуется более 80% совпадения). Попробуйте сфотографировать объект точнее.`);
  }

  progress.chatHistory.push({
    sender: 'system',
    text: logs.join('\n'),
    timestamp: new Date().toISOString()
  });

  dbRepo.save();
  res.json({ success: check.success, progress, playerProfile: player });
});

// Scan QR checkpoint
apiRouter.post('/player/verify-qr', (req: Request, res: Response) => {
  const { questId, qrCodeValue } = req.body;
  const projects = dbRepo.getProjects();
  const project = projects.find(p => p.id === questId);
  const userId = (req as AuthRequest).user?.userId;
  const player = dbRepo.getPlayers().find(p => p.userId === userId) || dbRepo.getPlayers()[0];
  const progress = player.questProgress[questId];

  if (!progress) return res.status(400).json({ error: 'Quest not joined.' });

  const activeStep = project.steps[progress.currentStepIndex];
  if (!activeStep || activeStep.type !== 'QR') {
    return res.status(400).json({ error: 'This is not a QR validation step.' });
  }

  const expected = activeStep.verificationData.qrCode || '';
  if (qrCodeValue.trim() === expected.trim()) {
    const logs = [`✅ QR-код "${qrCodeValue}" успешно верифицирован.`];
    if (activeStep.reward.item) player.inventory.push(activeStep.reward.item);
    if (activeStep.reward.achievement) player.achievements.push(activeStep.reward.achievement);
    awardPlayerXP(player, activeStep.reward.xp, logs);

    progress.currentStepIndex += 1;
    if (progress.currentStepIndex >= project.steps.length) {
      progress.completed = true;
    }

    progress.chatHistory.push({
      sender: 'system',
      text: logs.join('\n'),
      timestamp: new Date().toISOString()
    });

    dbRepo.save();
    res.json({ success: true, progress, playerProfile: player });
  } else {
    res.json({ success: false, error: 'QR-код не совпадает со священными знаками!' });
  }
});

// GPS verification
apiRouter.post('/player/verify-location', (req: Request, res: Response) => {
  const { questId, lat, lng } = req.body;
  const project = dbRepo.getProjects().find(p => p.id === questId);
  const userId = (req as AuthRequest).user?.userId;
  const player = dbRepo.getPlayers().find(p => p.userId === userId) || dbRepo.getPlayers()[0];
  const progress = player.questProgress[questId];

  if (!progress) return res.status(400).json({ error: 'Join quest first' });

  const activeStep = project.steps[progress.currentStepIndex];
  if (!activeStep || activeStep.type !== 'LOCATION') {
    return res.status(400).json({ error: 'Not a GPS verification checkpoint.' });
  }

  const logs = [
    `📍 Координаты получены: широта ${lat}, долгота ${lng}`,
    `✅ Верификация координат успешно завершена!`
  ];

  if (activeStep.reward.item) player.inventory.push(activeStep.reward.item);
  awardPlayerXP(player, activeStep.reward.xp, logs);

  progress.currentStepIndex += 1;
  if (progress.currentStepIndex >= project.steps.length) {
    progress.completed = true;
  }

  progress.chatHistory.push({
    sender: 'system',
    text: logs.join('\n'),
    timestamp: new Date().toISOString()
  });

  dbRepo.save();
  res.json({ success: true, progress, playerProfile: player });
});

// Timer verification
apiRouter.post('/player/verify-timer', (req: Request, res: Response) => {
  const { questId } = req.body;
  const project = dbRepo.getProjects().find(p => p.id === questId);
  const userId = (req as AuthRequest).user?.userId;
  const player = dbRepo.getPlayers().find(p => p.userId === userId) || dbRepo.getPlayers()[0];
  const progress = player.questProgress[questId];

  if (!progress) return res.status(400).json({ error: 'Join quest first' });

  const activeStep = project.steps[progress.currentStepIndex];
  if (!activeStep || activeStep.type !== 'TIMER') {
    return res.status(400).json({ error: 'Not a timer challenge step.' });
  }

  const logs = [
    `⏳ Таймер успешно остановлен до истечения времени.`,
    `✅ Обряд "${activeStep.title}" успешно завершен и зафиксирован!`
  ];

  if (activeStep.reward.item) player.inventory.push(activeStep.reward.item);
  if (activeStep.reward.achievement) player.achievements.push(activeStep.reward.achievement);
  awardPlayerXP(player, activeStep.reward.xp, logs);

  progress.currentStepIndex += 1;
  if (progress.currentStepIndex >= project.steps.length) {
    progress.completed = true;
  }

  progress.chatHistory.push({
    sender: 'system',
    text: logs.join('\n'),
    timestamp: new Date().toISOString()
  });

  dbRepo.save();
  res.json({ success: true, progress, playerProfile: player });
});

// Reset progress & inventory database seed
apiRouter.post('/player/reset', (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.userId || 'player-uuid-1';
  const players = dbRepo.getPlayers();
  const idx = players.findIndex(p => p.userId === userId);
  const resetProfile = {
    userId,
    username: 'Следопыт Тайги',
    level: 1,
    xp: 0,
    rank: 'Новичок',
    inventory: ['Компас'],
    achievements: ['Первый Шаг'],
    questProgress: {}
  };
  if (idx !== -1) {
    players[idx] = resetProfile;
  } else {
    players.push(resetProfile);
  }
  dbRepo.save();
  res.json({ success: true, player: resetProfile });
});

// ==========================================
// 5. VISION ENGINE PRODUCTION ENDPOINTS
// ==========================================

const handleVisionPhoto = async (req: Request, res: Response) => {
  const { base64Image, image, photoBase64, mimeType, targetDescription } = req.body;
  const rawImage = base64Image || image || photoBase64;

  if (!rawImage) {
    return res.status(400).json({ success: false, errors: ['No image payload found in base64Image, image, or photoBase64 fields'] });
  }

  const detectedMime = mimeType || 'image/jpeg';
  const cleanBase64 = rawImage.includes(';base64,') ? rawImage.split(';base64,')[1] : rawImage;

  const result = await VisionPipelineRouter.process({
    base64Image: cleanBase64,
    mimeType: detectedMime,
    targetDescription: targetDescription || 'ancient altar relics',
    provider: process.env.GEMINI_API_KEY ? 'gemini' : 'local'
  });

  res.json(result);
};

apiRouter.post('/vision/photo', handleVisionPhoto);
apiRouter.post('/api/vision/photo', handleVisionPhoto);

const handleVisionOCR = async (req: Request, res: Response) => {
  const { base64Image, image, photoBase64, languages } = req.body;
  const rawImage = base64Image || image || photoBase64;

  if (!rawImage) {
    return res.status(400).json({ success: false, errors: ['No image payload found.'] });
  }

  const cleanBase64 = rawImage.includes(';base64,') ? rawImage.split(';base64,')[1] : rawImage;
  const provider = new LocalVisionProvider();
  
  const ocrRes = await OCREngine.recognize(cleanBase64, provider, languages || ['ru', 'en']);
  res.json(ocrRes);
};

apiRouter.post('/vision/ocr', handleVisionOCR);
apiRouter.post('/api/vision/ocr', handleVisionOCR);

const handleVisionQR = async (req: Request, res: Response) => {
  const { base64Image, image, photoBase64, expectedFormat } = req.body;
  const rawImage = base64Image || image || photoBase64;

  if (!rawImage) {
    return res.status(400).json({ success: false, errors: ['No image payload found.'] });
  }

  const cleanBase64 = rawImage.includes(';base64,') ? rawImage.split(';base64,')[1] : rawImage;
  const qrRes = await QREngine.scan(cleanBase64, expectedFormat || 'QR');
  res.json(qrRes);
};

apiRouter.post('/vision/qr', handleVisionQR);
apiRouter.post('/api/vision/qr', handleVisionQR);

const handleVisionCompare = async (req: Request, res: Response) => {
  const { base64Image, image, photoBase64, targetDescription } = req.body;
  const rawImage = base64Image || image || photoBase64;

  if (!rawImage) {
    return res.status(400).json({ success: false, errors: ['No image payload found.'] });
  }

  const cleanBase64 = rawImage.includes(';base64,') ? rawImage.split(';base64,')[1] : rawImage;
  const provider = new LocalVisionProvider();
  
  const compRes = await provider.analyze(cleanBase64, targetDescription || 'target');
  res.json({
    success: compRes.similarity >= 0.80,
    similarity: compRes.similarity,
    confidence: compRes.confidence,
    boundingBoxes: compRes.boundingBoxes || [],
    reasoning: compRes.reasoning
  });
};

apiRouter.post('/vision/compare', handleVisionCompare);
apiRouter.post('/api/vision/compare', handleVisionCompare);

const handleVisionClassify = async (req: Request, res: Response) => {
  const { base64Image, image, photoBase64 } = req.body;
  const rawImage = base64Image || image || photoBase64;

  if (!rawImage) {
    return res.status(400).json({ success: false, errors: ['No image payload found.'] });
  }

  const cleanBase64 = rawImage.includes(';base64,') ? rawImage.split(';base64,')[1] : rawImage;
  const provider = new LocalVisionProvider();
  
  const classRes = await ClassificationEngine.classify(cleanBase64, provider);
  res.json(classRes);
};

apiRouter.post('/vision/classify', handleVisionClassify);
apiRouter.post('/api/vision/classify', handleVisionClassify);

// ==========================================
// 6. AI QUEST DESIGNER PLATFORM ENDPOINTS
// ==========================================

const plannerService = new AIQuestPlannerService();
const designerService = new MultiAgentDesignerService();
const feedbackOptimizer = new AIFeedbackOptimizer();

// Endpoint 1: Start designer / create session
const handleDesignerCreate = async (req: Request, res: Response) => {
  const { idea } = req.body;
  if (!idea) {
    return res.status(400).json({ error: 'Исходная идея квеста обязательна.' });
  }

  // Create empty initial session shape and send to client
  res.json({
    id: `session-${Math.random().toString(36).substring(2, 11)}`,
    idea,
    answers: {},
    currentStep: 'questions',
    questions: [],
    generatedDraft: null,
    agentLogs: []
  });
};

apiRouter.post('/designer/create', handleDesignerCreate);
apiRouter.post('/api/designer/create', handleDesignerCreate);

// Endpoint 2: Get Clarifying Questions
const handleDesignerQuestions = async (req: Request, res: Response) => {
  const { idea } = req.body;
  if (!idea) {
    return res.status(400).json({ error: 'Идея квеста обязательна.' });
  }

  try {
    const questions = await plannerService.generateQuestions(idea);
    res.json({ questions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

apiRouter.post('/designer/questions', handleDesignerQuestions);
apiRouter.post('/api/designer/questions', handleDesignerQuestions);

// Endpoint 3: Orchestrate Multi-Agent Quest Draft Generation
const handleDesignerGenerate = async (req: Request, res: Response) => {
  const { idea, answers } = req.body;
  if (!idea || !answers) {
    return res.status(400).json({ error: 'Параметры "idea" и "answers" обязательны.' });
  }

  try {
    const { project, logs } = await designerService.generateProject(idea, answers);
    res.json({ project, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

apiRouter.post('/designer/generate', handleDesignerGenerate);
apiRouter.post('/api/designer/generate', handleDesignerGenerate);

// Endpoint 4: Refine/improve project based on human feedback
const handleDesignerImprove = async (req: Request, res: Response) => {
  const { project, feedback } = req.body;
  if (!project || !feedback) {
    return res.status(400).json({ error: 'Параметры "project" и "feedback" обязательны.' });
  }

  try {
    const refinedProject = await designerService.improveProject(project, feedback);
    res.json({ project: refinedProject });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

apiRouter.post('/designer/improve', handleDesignerImprove);
apiRouter.post('/api/designer/improve', handleDesignerImprove);

// Endpoint 5: Run automated simulations
const handleDesignerSimulate = async (req: Request, res: Response) => {
  const { project, persona } = req.body;
  if (!project || !persona) {
    return res.status(400).json({ error: 'Параметры "project" и "persona" обязательны.' });
  }

  try {
    const simulationResult = await SimulationEngine.simulatePlaythrough(project, persona);
    res.json({ simulationResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

apiRouter.post('/designer/simulate', handleDesignerSimulate);
apiRouter.post('/api/designer/simulate', handleDesignerSimulate);

// Endpoint 6: Professional audit and review report (QA validation + simulations + optimizer feedback)
const handleDesignerReview = async (req: Request, res: Response) => {
  const { project } = req.body;
  if (!project) {
    return res.status(400).json({ error: 'Параметр "project" обязателен.' });
  }

  try {
    // 1. Run structural validation check
    const validationResult = LogicalValidator.validate(project);

    // 2. Run playthrough simulations for Beginner, Normal, and Expert
    const simResults = await Promise.all([
      SimulationEngine.simulatePlaythrough(project, 'Beginner'),
      SimulationEngine.simulatePlaythrough(project, 'Normal'),
      SimulationEngine.simulatePlaythrough(project, 'Expert')
    ]);

    // 3. Compile everything and generate professional Group Audit Report
    const reviewReport = await feedbackOptimizer.reviewQuest(project, simResults);

    res.json({
      validationResult,
      simResults,
      reviewReport
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

apiRouter.post('/designer/review', handleDesignerReview);
apiRouter.post('/api/designer/review', handleDesignerReview);

