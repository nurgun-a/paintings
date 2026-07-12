import { VisionPipelineResult } from '../types.js';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface VisionJob {
  id: string;
  status: JobStatus;
  progress: number; // 0 to 100
  payload: {
    base64Image: string;
    mimeType: string;
    targetDescription?: string;
  };
  result?: VisionPipelineResult;
  error?: string;
  createdAt: string;
}

export class VisionQueueManager {
  private static instance: VisionQueueManager;
  private jobs: Map<string, VisionJob> = new Map();

  private constructor() {}

  public static getInstance(): VisionQueueManager {
    if (!VisionQueueManager.instance) {
      VisionQueueManager.instance = new VisionQueueManager();
    }
    return VisionQueueManager.instance;
  }

  /**
   * Submits a heavy vision job to the async processing queue.
   */
  public createJob(payload: { base64Image: string; mimeType: string; targetDescription?: string }): VisionJob {
    const job: VisionJob = {
      id: `job-${Math.random().toString(36).substring(2, 11)}`,
      status: 'queued',
      progress: 0,
      payload,
      createdAt: new Date().toISOString()
    };

    this.jobs.set(job.id, job);
    console.log(`[Vision Queue] Enqueued heavy vision processing job: ${job.id}`);
    
    // Asynchronously begin task pool processing
    this.processJobAsync(job.id).catch(err => {
      console.error(`[Vision Queue] Unexpected failure running job ${job.id}:`, err);
    });

    return job;
  }

  /**
   * Retrieves the status and results of an existing job.
   */
  public getJob(jobId: string): VisionJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Simulates/performs asynchronous background processing of enqueued jobs.
   */
  private async processJobAsync(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.progress = 20;

    // Simulate pipeline latency stages (Validation, Normalization, Models)
    await this.delay(300);
    job.progress = 50;

    await this.delay(300);
    job.progress = 80;

    // Resolve Pipeline via standard service (handled in pipeline router)
    const { VisionPipelineRouter } = await import('../vision.service.js');
    try {
      const pipelineRes = await VisionPipelineRouter.process({
        base64Image: job.payload.base64Image,
        mimeType: job.payload.mimeType,
        targetDescription: job.payload.targetDescription,
        provider: 'local'
      });

      job.status = 'completed';
      job.progress = 100;
      job.result = pipelineRes;
    } catch (err: any) {
      job.status = 'failed';
      job.progress = 100;
      job.error = err.message || 'Unknown processing error';
    }

    console.log(`[Vision Queue] Job ${jobId} finished with status: ${job.status}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const visionQueue = VisionQueueManager.getInstance();
