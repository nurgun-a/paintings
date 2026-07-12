import { 
  GameStateId, 
  QuestPlayerState, 
  StateTransition, 
  GameStateMachine, 
  QuestCondition, 
  QuestAction,
  EventType
} from '../types.js';
import { ConditionEngine } from '../conditions/condition.engine.js';
import { ActionEngine } from '../actions/action.engine.js';
import { saveEngine } from '../progress/save.engine.js';
import { statsEngine } from '../progress/stats.engine.js';
import { eventBus } from '../core/event-bus.js';
import { pluginAPI } from '../core/plugin.api.js';

export class StateMachineEngine {
  private static instance: StateMachineEngine;
  private machines: Map<string, GameStateMachine> = new Map();

  private constructor() {
    // Seed a standard quest pipeline state machine configuration
    this.registerMachine({
      id: 'default-quest-machine',
      name: 'Default Quest Pipeline Machine',
      initialState: 'START',
      states: {
        'START': {
          name: 'Начало',
          description: 'Игрок только присоединился к платформе.',
          transitions: [
            {
              fromState: 'START',
              toState: 'INTRO',
              conditions: [], // Unconditional
              actionsOnTransition: [
                {
                  id: 'act-intro-notify',
                  type: 'SEND_NOTIFICATION',
                  params: { text: 'Добро пожаловать на испытание тайги! Внимательно слушайте духов.' }
                }
              ]
            }
          ]
        },
        'INTRO': {
          name: 'Введение',
          description: 'Вводная сюжетная сцена.',
          transitions: [
            {
              fromState: 'INTRO',
              toState: 'IN_PROGRESS',
              conditions: [
                {
                  id: 'cond-intro-level',
                  type: 'LEVEL_GTE',
                  params: { level: 1 }
                }
              ],
              actionsOnTransition: [
                {
                  id: 'act-prog-start',
                  type: 'SEND_NOTIFICATION',
                  params: { text: 'Основная глава квеста началась!' }
                }
              ]
            }
          ]
        },
        'IN_PROGRESS': {
          name: 'В Процессе',
          description: 'Прохождение основных этапов квеста.',
          transitions: [
            {
              fromState: 'IN_PROGRESS',
              toState: 'COMPLETED',
              conditions: [
                {
                  id: 'cond-steps-all-complete',
                  type: 'FLAG_EQUALS',
                  params: { flagName: 'all_steps_solved', value: true }
                }
              ],
              actionsOnTransition: [
                {
                  id: 'act-complete-congrats',
                  type: 'SEND_NOTIFICATION',
                  params: { text: 'Поздравляем! Все этапы квеста пройдены!' }
                }
              ]
            }
          ]
        },
        'COMPLETED': {
          name: 'Завершено',
          description: 'Квест пройден, игрок получает финальную награду.',
          transitions: [
            {
              fromState: 'COMPLETED',
              toState: 'ENDING',
              conditions: [],
              actionsOnTransition: []
            }
          ]
        },
        'FAILED': {
          name: 'Провалено',
          description: 'Игрок исчерпал время или лимиты попыток.',
          transitions: []
        },
        'ENDING': {
          name: 'Финал',
          description: 'Финальная сцена и подведение результатов.',
          transitions: []
        }
      }
    });
  }

  public static getInstance(): StateMachineEngine {
    if (!StateMachineEngine.instance) {
      StateMachineEngine.instance = new StateMachineEngine();
    }
    return StateMachineEngine.instance;
  }

  /**
   * Registers a customizable state machine schema.
   */
  public registerMachine(machine: GameStateMachine): void {
    this.machines.set(machine.id, machine);
    console.log(`[State Machine] Registered machine schema: ${machine.id}`);
  }

  /**
   * Factory constructor to bootstrap an empty, fully valid profile state object.
   */
  public initializePlayerState(userId: string, questId: string): QuestPlayerState {
    const initialState: QuestPlayerState = {
      userId,
      currentQuestId: questId,
      currentState: 'START',
      currentStepIndex: 0,
      unlockedQuests: [questId],
      completedQuests: [],
      failedQuests: [],
      inventory: [],
      xp: 0,
      level: 1,
      rank: 'Новичок',
      achievements: [],
      variables: {},
      flags: {
        'all_steps_solved': false
      },
      updatedAt: new Date().toISOString()
    };

    // Auto trigger monitoring telemetry
    statsEngine.startTracking(userId, questId);
    
    // Create initial save snapshot checkpoint
    saveEngine.createCheckpoint(initialState, 'Первоначальная инициализация профиля');

    return initialState;
  }

  /**
   * Scans and triggers any eligible transition nodes, executing action triggers and capturing milestones.
   */
  public async processTransitions(state: QuestPlayerState, machineId: string = 'default-quest-machine'): Promise<boolean> {
    const machine = this.machines.get(machineId);
    if (!machine) {
      throw new Error(`State machine schema with ID "${machineId}" is unregistered.`);
    }

    const currentSchema = machine.states[state.currentState];
    if (!currentSchema) return false;

    let transitionHappened = false;

    for (const trans of currentSchema.transitions) {
      // Evaluate conditions
      const allowed = await ConditionEngine.evaluateBatch(trans.conditions, state, 'AND');
      if (allowed) {
        const oldState = state.currentState;
        
        // Execute transition actions
        const actionsResult = await ActionEngine.executeBatch(trans.actionsOnTransition, state);
        if (!actionsResult.success) {
          console.warn(`[State Machine] Transition actions failed:`, actionsResult.logs);
        }

        // Apply transition mutation
        state.currentState = trans.toState;
        state.updatedAt = new Date().toISOString();
        transitionHappened = true;

        console.log(`[State Machine Transition] User ${state.userId} moved from state: ${oldState} -> ${trans.toState}`);

        // Commit checkpoint milestone
        saveEngine.createCheckpoint(state, `Автоматический переход: [${oldState}] -> [${trans.toState}]`);

        // Emit events
        await eventBus.publish('PLAYER_STATE_TRANSITION', {
          userId: state.userId,
          fromState: oldState,
          toState: trans.toState,
          actionsLog: actionsResult.logs
        });

        // Recursively check if the new state itself triggers nested cascade transitions
        await this.processTransitions(state, machineId);
        break;
      }
    }

    return transitionHappened;
  }

  /**
   * Evaluates standard user action attempts for TEXT, PHOTO, QR, GPS against target stage objectives.
   * Modulates reward increments, step updates, notifications, achievements, and transitions.
   */
  public async handleGameplayInput(
    state: QuestPlayerState,
    eventType: EventType,
    payload: any,
    stepRules: {
      id: string;
      title: string;
      conditions: QuestCondition[];
      rewards: QuestAction[];
    }
  ): Promise<{ success: boolean; logs: string[] }> {
    const questId = state.currentQuestId;
    const key = `${state.userId}:${questId}`;

    // 1. Moderate / Validate input using condition evaluation
    const pass = await ConditionEngine.evaluateBatch(stepRules.conditions, state, 'AND');
    
    if (!pass) {
      statsEngine.recordFailedAttempt(state.userId, questId, `failed_input_${eventType}`);
      await eventBus.publish('GAMEPLAY_INPUT_FAILED', {
        userId: state.userId,
        eventType,
        payload,
        stepId: stepRules.id
      });
      return { success: false, logs: ['❌ Ответ не совпадает с тайными знаками. Попробуйте еще раз.'] };
    }

    // Input matches condition! Puzzle solved successfully.
    const logs: string[] = ['✅ Испытание успешно пройдено!'];

    // 2. Execute success outcomes
    const actionRes = await ActionEngine.executeBatch(stepRules.rewards, state);
    logs.push(...actionRes.logs);

    // 3. Move Step Index forward
    state.currentStepIndex += 1;
    statsEngine.incrementCompletedSteps(state.userId, questId);

    // Commit saving checkpoint
    saveEngine.createCheckpoint(state, `Завершено испытание #${state.currentStepIndex}: "${stepRules.title}"`);

    // Emit reactive events
    await eventBus.publish('PLAYER_STEP_COMPLETED', {
      userId: state.userId,
      questId,
      stepId: stepRules.id,
      newStepIndex: state.currentStepIndex
    });

    return { success: true, logs };
  }
}

export const stateMachineEngine = StateMachineEngine.getInstance();
