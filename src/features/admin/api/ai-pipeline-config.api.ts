import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";

export type AiPipelineConfig = {
  configId: string;
  fingerprintSimilarityThreshold: number;
  fingerprintClusterThreshold: number;
  rekognitionConfidenceThreshold: number;
  rekognitionViolenceConfidenceThreshold: number;
  fingerprintImageTopK: number;
  fingerprintVideoTopK: number;
  fingerprintMinMatchSeconds: number;
  fingerprintMaxGapSeconds: number;
  fingerprintFps: number;
  fingerprintMaxFrames: number;
  fingerprintMaxFileSizeMb: number;
  rekognitionMaxFrames: number;
  moderationFrameInterval: number;
};

export type AiPipelineConfigPayload = {
  fingerprintSimilarityThreshold: number;
  fingerprintClusterThreshold: number;
  rekognitionConfidenceThreshold: number;
  rekognitionViolenceConfidenceThreshold: number;
  fingerprintImageTopK: number;
  fingerprintVideoTopK: number;
  fingerprintMinMatchSeconds: number;
  fingerprintMaxGapSeconds: number;
  fingerprintFps: number;
  fingerprintMaxFrames: number;
  fingerprintMaxFileSizeMb: number;
  rekognitionMaxFrames: number;
  moderationFrameInterval: number;
};

export const aiPipelineConfigApi = {
  getConfig: () =>
    unwrapBaseResponse<AiPipelineConfig>(
      httpClient.get("/api/v1/ai-pipeline-configs")
    ),

  updateConfig: (payload: AiPipelineConfigPayload) =>
    unwrapBaseResponse<AiPipelineConfig>(
      httpClient.put("/api/v1/admin/ai-pipeline-configs", payload)
    ),
};
