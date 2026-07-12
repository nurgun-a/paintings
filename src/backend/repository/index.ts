import fs from 'fs';
import path from 'path';
import { 
  QuestProject, 
  PlayerProfile, 
  LiveEvent, 
  ChatMessage 
} from '../../packages/types/index.js';
import { Role, hashPassword } from '../auth/index.js';

const DB_PATH = path.join(process.cwd(), 'production_db.json');

export interface User {
  id: string;
  email: string;
  username: string;
  role: Role;
  createdAt: string;
}

export interface DatabaseState {
  users: Array<User & { passwordHash: string }>;
  players: PlayerProfile[];
  projects: QuestProject[];
  liveEvents: LiveEvent[];
}

export class DBRepository {
  private static instance: DBRepository;
  private state: DatabaseState = {
    users: [],
    players: [],
    projects: [],
    liveEvents: []
  };

  private constructor() {
    this.load();
  }

  public static getInstance(): DBRepository {
    if (!DBRepository.instance) {
      DBRepository.instance = new DBRepository();
    }
    return DBRepository.instance;
  }

  private load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        this.state = JSON.parse(fileContent);
        // Automatically migrate old MD5 password hashes to PBKDF2 format
        let updated = false;
        for (const user of this.state.users) {
          if (!user.passwordHash || !user.passwordHash.includes(':')) {
            user.passwordHash = hashPassword('123456');
            updated = true;
          }
        }
        if (updated) {
          this.save();
        }
      } else {
        this.seed();
        this.save();
      }
    } catch (err) {
      console.error('Error loading database repository:', err);
      this.seed();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to flush database state to disk:', err);
    }
  }

  private seed() {
    // Seed initial users
    this.state.users = [
      {
        id: 'super-admin-uuid-1',
        email: 'admin@aiquest.com',
        username: 'Организатор Платформы',
        passwordHash: hashPassword('123456'), // default hash
        role: Role.SUPER_ADMIN,
        createdAt: new Date().toISOString()
      },
      {
        id: 'player-uuid-1',
        email: 'player@aiquest.com',
        username: 'Следопыт Тайги',
        passwordHash: hashPassword('123456'),
        role: Role.PLAYER,
        createdAt: new Date().toISOString()
      }
    ];

    this.state.players = [
      {
        userId: 'player-uuid-1',
        username: 'Следопыт Тайги',
        level: 1,
        xp: 0,
        rank: 'Новичок',
        inventory: ['Компас'],
        achievements: ['Первый Шаг'],
        questProgress: {}
      }
    ];

    this.state.projects = [
      {
        id: 'spirit-of-ichchi',
        name: 'Дух Иччи (Spirit of Ichchi)',
        description: 'Мистический квест по мотивам якутской мифологии. Отыщите древние тотемы и задобрите духа тайги.',
        status: 'published',
        lore: {
          systemPrompt: 'Вы — Великий Шаман тайги, хранитель духа Иччи. Говорите загадочно, мудро, используйте якутские мифологические образы (Байанай, Иччи, Сэргэ). Адаптируйте речь под ранг игрока: новичков ведите за руку, а ветеранам ("Учитель") бросайте суровые духовные вызовы.',
          story: 'В глуши сибирской тайги пробудился Иччи — дух-хозяин леса. Баланс природы нарушен. Чтобы восстановить гармонию, вы должны пройти испытания древнего Сэргэ.',
          rules: 'Каждое действие требует подношения или разгадки тайны природы. Не злите духов тайги своими поспешными ответами.'
        },
        npcs: [
          {
            id: 'shaman',
            name: 'Старик Байанай (Лесной Шаман)',
            role: 'Проводник',
            personality: 'Говорит притчами, курит трубку, знает тайны всех троп.',
            avatar: '🧙‍♂️'
          }
        ],
        steps: [
          {
            id: 'ichchi-step-1',
            title: 'Загадка Шамана',
            description: 'Ответьте Байанаю: "Какое существо оставляет след, похожий на человеческий рукав, но ходит бесшумно как тень?" (Подсказка: Рысь)',
            type: 'TEXT',
            verificationData: {
              answers: ['рысь', 'рысью', 'lynx']
            },
            reward: {
              xp: 150,
              item: 'Амулет когтя рыси'
            }
          },
          {
            id: 'ichchi-step-2',
            title: 'Священное Сэргэ',
            description: 'Найдите священный столб Сэргэ и введите секретный код, вырезанный на его основании (Подсказка: ICHCHI_SERGE_77).',
            type: 'QR',
            verificationData: {
              qrCode: 'ICHCHI_SERGE_77'
            },
            reward: {
              xp: 250,
              achievement: 'Друг Леса'
            }
          },
          {
            id: 'ichchi-step-3',
            title: 'Духовное подношение',
            description: 'Сделайте фотографию природы (дерево, цветок или лесной трофей) для подношения Иччи.',
            type: 'PHOTO',
            verificationData: {
              referenceImage: 'A photograph of outdoor green nature, forests, leaves, logs, or trees.'
            },
            reward: {
              xp: 400,
              item: 'Золотая ветвь Иччи',
              achievement: 'Избранник Иччи'
            }
          }
        ]
      }
    ];

    this.state.liveEvents = [];
  }

  // QUERY INTERFACES
  public getUsers() {
    return this.state.users;
  }

  public getPlayers() {
    return this.state.players;
  }

  public getProjects() {
    return this.state.projects;
  }

  public getLiveEvents() {
    return this.state.liveEvents;
  }
}
