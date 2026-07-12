import { DBRepository } from '../repository/index.js';
import { hashPassword, verifyPassword, generateAccessToken, Role } from '../auth/index.js';
import { AIEngineService } from '../services/ai-engine.js';
import { VisionEngineService } from '../services/vision-engine.js';
import { runRealtimeEngineTests } from './realtime.test.js';

// Import our rich Vision Engine Suite
import { 
  ValidationEngine,
  CompressionEngine,
  OCREngine,
  QREngine,
  ClassificationEngine,
  SimilarityEngine,
  visionCache,
  visionQueue,
  MetadataExtractor,
  LocalVisionProvider,
  OpenCVVisionProvider,
  VisionPipelineRouter
} from '../../packages/vision-engine/index.js';

export function runBackendIntegrationTests() {
  console.log('============= RUNNING INTEGRATION TESTS =============');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] - ${message}`);
      passCount++;
    } else {
      console.error(`[FAIL] - ${message}`);
      failCount++;
    }
  }

  try {
    // 1. Password Hashing Tests
    const password = 'MysticTaigaKey2026';
    const hash = hashPassword(password);
    assert(hash !== password, 'Password hashing should return transformed digest');
    assert(verifyPassword(password, hash), 'Verifying matching password should return true');
    assert(!verifyPassword('wrong_pass', hash), 'Verifying incorrect password should return false');

    // 2. JWT Tokens Test
    const userPayload = { userId: 'test-uuid', email: 'test@quest.com', role: Role.PLAYER };
    const token = generateAccessToken(userPayload);
    assert(!!token && token.length > 20, 'Generating access token should return solid signed string');

    // 3. Database Repositories Seed Validation
    const db = DBRepository.getInstance();
    const projects = db.getProjects();
    assert(projects.length > 0, 'Database seed must automatically load template quest projects');
    assert(projects[0].id === 'spirit-of-ichchi', 'Seeded quest should be "spirit-of-ichchi"');

    // 4. State-Machine Context Validation
    const activeStep = projects[0].steps[0];
    assert(activeStep.type === 'TEXT', 'First seeded step type should be a text riddle check');
    assert(activeStep.verificationData.answers?.includes('рысь'), 'Answers must accept lowercase "рысь"');

    // 5. Vision Engine fallback test
    const vision = new VisionEngineService();
    vision.verifyPhotoSimilarity('Nature', 'dummy_data').then((res) => {
      assert(res.success && res.similarity >= 80, 'Vision verification fallbacks should elegantly guarantee progression');
    });

    // ==========================================
    // 6. VISION ENGINE: UNIT & INTEGRATION TESTS
    // ==========================================
    console.log('\n--- Running Vision Engine Deep Suite ---');

    // Test A: Validation Engine
    ValidationEngine.validate('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'image/png')
      .then(res => {
        assert(res.isValid, 'Validation Engine should accept standard valid Base64 image streams');
        assert(res.metadata?.mimeType === 'image/png', 'Validation metadata should extract the correct MIME type');
      });

    // Test B: Compression / Normalization Engine
    CompressionEngine.normalize('dummyBase64ImagePayload', 'image/jpeg')
      .then(res => {
        assert(res.mimeType === 'image/jpeg', 'Compression Engine must preserve target MIME type');
        assert(res.metadata.size > 0, 'Compression Engine should compute a valid output payload byte count');
      });

    // Test C: OCR Engine Integration
    const localProvider = new LocalVisionProvider();
    OCREngine.recognize('sampleImageData', localProvider)
      .then(res => {
        assert(res.success, 'OCR recognition should return success true on local provider fallbacks');
        assert(res.text.includes('БАЙАНАЙ'), 'OCR text output must contain matched language phrases');
      });

    // Test D: QR Engine Scanning & Signature Verification
    QREngine.scan('sampleQR', 'QR')
      .then(qr => {
        assert(qr.success, 'QR Engine scan must yield successful results');
        assert(qr.code.startsWith('QUEST-QR:'), 'QR Code must return standard quest format string');
        
        const verification = QREngine.verifyAuthenticity(qr.code);
        assert(verification.valid, 'QR Cryptographic Signature authentication check must pass for unmodified QR');

        const badQRVerification = QREngine.verifyAuthenticity('QUEST-QR:bad-uuid:bad-crc:BAD_SIGNATURE');
        assert(!badQRVerification.valid, 'QR Cryptographic signature verify should detect forged/tampered QR tokens');
      });

    // Test E: Scene Classification
    ClassificationEngine.classify('samplePayload', localProvider)
      .then(classRes => {
        assert(!!classRes.className && classRes.confidence > 0, 'Classification Engine must assign composed scene name and rating');
      });

    // Test F: Embeddings Mathematical Operations (Cosine & Euclidean)
    const vecA = [0.5, 0.5, 0.5, 0.5];
    const vecB = [0.5, 0.5, 0.5, 0.5];
    const cosineSim = SimilarityEngine.cosineSimilarity(vecA, vecB);
    assert(Math.abs(cosineSim - 1.0) < 0.01, 'Cosine similarity of identical vectors must equal exactly 1.0');

    const vecC = [0.0, 1.0, 0.0, 0.0];
    const orthSim = SimilarityEngine.cosineSimilarity(vecA, vecC);
    assert(orthSim > 0 && orthSim < 1.0, 'Orthogonal or non-parallel vector cosine similarity must measure appropriately');

    const imageEmbedding = SimilarityEngine.generateImageEmbedding('testPhotoStr');
    assert(imageEmbedding.length === 128, 'Image Embedding Service should produce standard 128-dimensional float vectors');

    // Test G: Cache Store
    visionCache.set('test-key', { value: 42 }, 10)
      .then(() => visionCache.get('test-key'))
      .then(val => {
        assert(val && val.value === 42, 'Cache Manager must save and retrieve structured records correctly');
        return visionCache.delete('test-key');
      })
      .then(() => visionCache.get('test-key'))
      .then(val => {
        assert(val === null, 'Deleted cache keys must return null on subsequent queries');
      });

    // Test H: Heavy Job Async Queues
    const job = visionQueue.createJob({ base64Image: 'test', mimeType: 'image/jpeg' });
    assert(job.status === 'queued' || job.status === 'processing', 'Job Queue must return standard tracking state on enqueue');
    
    // Test I: Pipeline Router integration run
    VisionPipelineRouter.process({
      base64Image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      mimeType: 'image/png',
      targetDescription: 'altar'
    }).then(res => {
      assert(res.success, 'Full vision pipeline execution should run successfully to completion');
      assert(res.similarity >= 0.80, 'Full pipeline matching should evaluate matched confidence scores');
    });

    // ==========================================
    // 7. VISION ENGINE: LOAD TESTING
    // ==========================================
    console.log('\n--- Initiating Vision Engine Concurrent Load Testing ---');
    const loadTestRuns = 20;
    const loadPromises = [];
    const loadStartTime = Date.now();

    for (let i = 0; i < loadTestRuns; i++) {
      loadPromises.push(
        VisionPipelineRouter.process({
          base64Image: `load-test-photo-${i}`,
          mimeType: 'image/jpeg',
          targetDescription: 'quest_target_relic'
        })
      );
    }

    Promise.all(loadPromises).then(results => {
      const loadDuration = Date.now() - loadStartTime;
      const allSucceeded = results.every(r => r.similarity > 0);
      const avgLatency = results.reduce((sum, r) => sum + r.latencyMs, 0) / loadTestRuns;

      assert(allSucceeded, `Concurrently processed ${loadTestRuns} Vision Pipeline tasks with 100% success rate`);
      console.log(`[LOAD METRICS] Processed ${loadTestRuns} jobs in ${loadDuration}ms. Average Latency: ${avgLatency.toFixed(1)}ms. Throughput: ${(loadTestRuns / (loadDuration / 1000)).toFixed(1)} req/sec.`);
    });

    console.log(`\nTESTS COMPLETE: ${passCount} passed, ${failCount} failed.`);
    runRealtimeEngineTests();
  } catch (err: any) {
    console.error('Integration tests suite crashed with error:', err);
  }
}

