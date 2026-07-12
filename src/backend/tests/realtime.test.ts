import { 
  presenceService, 
  roomManager, 
  synchronizationService, 
  retryQueue, 
  realtimeSecurityManager, 
  pushService, 
  notificationService,
  RealtimeMessage
} from '../../packages/realtime-engine/index.js';
import { Role } from '../auth/index.js';

export async function runRealtimeEngineTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n=====================================================');
  console.log('       RUNNING REALTIME ENGINE TEST SUITE            ');
  console.log('=====================================================');

  // Reset state to ensure reproducibility when tests are executed multiple times
  synchronizationService.resetForTesting();
  realtimeSecurityManager.resetForTesting();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] - ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] - ${message}`);
      failed++;
    }
  }

  try {
    // --------------------------------------------------
    // 1. PRESENCE TRACKING UNIT & INTEGRATION TESTS
    // --------------------------------------------------
    console.log('\n--- 1. Testing Presence Service ---');
    
    presenceService.updatePresence('player-alpha', 'online', 'excellent', 'quest-1', 'step-3');
    const presenceA = presenceService.getPresence('player-alpha');
    assert(presenceA !== null, 'Should successfully retrieve presence details for a user');
    assert(presenceA?.status === 'online', 'Status of updated user should be "online"');
    assert(presenceA?.currentQuestId === 'quest-1', 'Should correctly store current active quest details');
    assert(presenceA?.connectionQuality === 'excellent', 'Should record connection quality metric');

    presenceService.setIdle('player-alpha');
    const presenceIdle = presenceService.getPresence('player-alpha');
    assert(presenceIdle?.status === 'idle', 'Should support setting status state to "idle" due to inactivity');

    presenceService.setOffline('player-alpha');
    const presenceOffline = presenceService.getPresence('player-alpha');
    assert(presenceOffline?.status === 'offline', 'Should mark user presence status to "offline"');

    // --------------------------------------------------
    // 2. ROOM MANAGER UNIT TESTS
    // --------------------------------------------------
    console.log('\n--- 2. Testing Room Manager ---');

    roomManager.joinRoom('player-beta', 'project:spirit-of-ichchi');
    roomManager.joinRoom('player-beta', 'team:north-taiga');
    roomManager.joinRoom('player-beta', 'role:PLAYER');

    const betaRooms = roomManager.getUserRooms('player-beta');
    assert(betaRooms.length === 3, 'User should be able to belong to multiple isolation rooms simultaneously');
    assert(betaRooms.includes('team:north-taiga'), 'Room set should contain team channel identifier');

    const teamMembers = roomManager.getRoomMembers('team:north-taiga');
    assert(teamMembers.includes('player-beta'), 'Room list should list the registered player inside');

    roomManager.leaveRoom('player-beta', 'role:PLAYER');
    const updatedBetaRooms = roomManager.getUserRooms('player-beta');
    assert(!updatedBetaRooms.includes('role:PLAYER'), 'Leaving a specific room should remove that channel only');

    roomManager.leaveAllRooms('player-beta');
    assert(roomManager.getUserRooms('player-beta').length === 0, 'Clean up teardown should leave all joined channels cleanly');

    // --------------------------------------------------
    // 3. SYNCHRONIZATION & SEQUENCING TESTS
    // --------------------------------------------------
    console.log('\n--- 3. Testing Sequencing & Synchronization Buffer ---');

    const msg1: RealtimeMessage = {
      id: 'msg-1',
      sequence: synchronizationService.getNextSequence(),
      type: 'QuestUpdated',
      payload: { step: 1 },
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const msg2: RealtimeMessage = {
      id: 'msg-2',
      sequence: synchronizationService.getNextSequence(),
      type: 'QuestCompleted',
      payload: { rank: 'Taiga Elder' },
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    assert(msg2.sequence === msg1.sequence + 1, 'Sequences must be monotonic incremental numbers');

    synchronizationService.recordMessage('channel-taiga', msg1);
    synchronizationService.recordMessage('channel-taiga', msg2);

    const caughtUp = synchronizationService.catchUp('channel-taiga', 'msg-1');
    assert(caughtUp.length === 1, 'Catchup sync should return all messages following specified event index');
    assert(caughtUp[0].id === 'msg-2', 'Catchup sync should preserve strict FIFO event order');

    const caughtUpBySeq = synchronizationService.catchUp('channel-taiga', undefined, msg1.sequence);
    assert(caughtUpBySeq.length === 1 && caughtUpBySeq[0].id === 'msg-2', 'Catchup synchronization should support sequence thresholding');

    // --------------------------------------------------
    // 4. RATE LIMITING & SECURITY SHIELDS
    // --------------------------------------------------
    console.log('\n--- 4. Testing Security Manager Rate Limiter ---');

    const ipAddress = '185.220.101.4';
    let limited = false;
    for (let i = 0; i < 150; i++) {
      if (realtimeSecurityManager.isRateLimited(ipAddress)) {
        limited = true;
        break;
      }
    }
    assert(limited, 'Security engine rate limit must lock client socket traffic if maximum threshold is breached');

    const replayId = 'transaction-uuid-relic-1234';
    const firstCheck = realtimeSecurityManager.checkReplayProtection(replayId);
    const secondCheck = realtimeSecurityManager.checkReplayProtection(replayId);
    assert(firstCheck === true, 'First message ID transaction instance should pass inspection');
    assert(secondCheck === false, 'Replaying identical transaction UUID must be rejected as spoof attack prevention');

    // --------------------------------------------------
    // 5. PUSH NOTIFICATION SUITE
    // --------------------------------------------------
    console.log('\n--- 5. Testing Push Dispatcher Subsystem ---');

    pushService.registerWebPush('player-gamma', {
      endpoint: 'https://updates.push.safari.com/v1/device-endpoint-taiga',
      keys: { p256dh: 'sample-p256', auth: 'sample-auth' }
    });
    pushService.registerFCMToken('player-gamma', 'fcm-registration-token-key-2026');

    const dispatchResult = await pushService.sendPushNotification('player-gamma', {
      title: 'Врата Тайн разблокированы',
      body: 'Найдите скрытый алтарь Байаная и отсканируйте код.',
    });
    assert(dispatchResult.successCount === 2, 'Push notification router must target both Web Push and FCM tokens');

    // --------------------------------------------------
    // 6. RETRY ACK DELIVERY GUARANTEES
    // --------------------------------------------------
    console.log('\n--- 6. Testing Retry Queue Delivery Guarantee ---');

    let retryCallbackInvoked = false;
    retryQueue.registerRetrySender(async (recipient, msg) => {
      retryCallbackInvoked = true;
      return true;
    });

    const msgUnacked: RealtimeMessage = {
      id: 'msg-unacked-100',
      sequence: 999,
      type: 'AchievementUnlocked',
      payload: { award: 'Guardian of Ichchi' },
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    retryQueue.enqueueMessage('player-delta', msgUnacked);
    assert(retryQueue.getQueueDepth() === 1, 'Retry queue depth must increase when message is waiting ACK');

    retryQueue.handleAck('msg-unacked-100');
    assert(retryQueue.getQueueDepth() === 0, 'Receiving ACK from client must remove pending delivery safely');

    // --------------------------------------------------
    // 7. HIGH CONCURRENCY LOAD TESTING (10,000 VIRTUAL CLIENTS)
    // --------------------------------------------------
    console.log('\n--- 7. Running 10,000 Client Concurrency Load Simulation ---');
    
    const virtualClients = 10000;
    const testStartTime = Date.now();
    let eventsCreated = 0;

    // Simulate 10,000 active client sessions joining channels & updating statuses
    for (let j = 0; j < virtualClients; j++) {
      const uId = `player-virtual-${j}`;
      roomManager.joinRoom(uId, 'project:global-live-stream');
      presenceService.updatePresence(uId, 'online', 'excellent');
      eventsCreated++;
    }

    const testDuration = Date.now() - testStartTime;
    const activePresences = presenceService.getAllActivePresences();
    const globalRoomMembersCount = roomManager.getRoomMembers('project:global-live-stream').length;

    assert(activePresences.length >= virtualClients, 'Presence tracking engine must maintain high-scale active registries');
    assert(globalRoomMembersCount === virtualClients, 'Room routing context must isolate full load of players efficiently');
    
    console.log(`[LOAD TESTS COMPLETED]`);
    console.log(`- Connected Virtual Sessions: ${virtualClients}`);
    console.log(`- Time Taken to register: ${testDuration}ms`);
    console.log(`- Creation Rate: ${(virtualClients / (testDuration / 1000)).toFixed(0)} connections/sec`);
    console.log(`- Presence table records: ${activePresences.length} items verified`);

  } catch (err: any) {
    console.error('Realtime Engine tests suite encountered fatal runtime crash:', err);
    failed++;
  }

  console.log(`\nREALTIME ENGINE RESULTS: ${passed} passed, ${failed} failed.`);
  return { passed, failed };
}
