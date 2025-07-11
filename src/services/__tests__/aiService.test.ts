
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../aiService';
import { invokeEdgeFunction } from '@/utils/edgeFunctionHelper';

vi.mock('@/utils/edgeFunctionHelper');

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    vi.clearAllMocks();
  });

  describe('generateExchangeRecommendation', () => {
    it('should generate recommendation successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          suggestedProduct: 'Premium Widget',
          confidence: 85,
          reasoning: 'Based on quality concerns',
          alternativeProducts: ['Standard Widget', 'Deluxe Widget']
        }
      };

      vi.mocked(invokeEdgeFunction).mockResolvedValue(mockResponse);

      const request = {
        returnReason: 'Quality issues',
        productName: 'Basic Widget',
        customerEmail: 'test@example.com',
        orderValue: 100
      };

      const result = await aiService.generateExchangeRecommendation(request);

      expect(result).toEqual({
        suggestedProduct: 'Premium Widget',
        confidence: 85,
        reasoning: 'Based on quality concerns',
        alternativeProducts: ['Standard Widget', 'Deluxe Widget']
      });

      expect(invokeEdgeFunction).toHaveBeenCalledWith(
        'generate-exchange-recommendation',
        expect.objectContaining(request)
      );
    });

    it('should use fallback recommendation on API failure', async () => {
      vi.mocked(invokeEdgeFunction).mockResolvedValue({
        success: false,
        error: 'API Error'
      });

      const request = {
        returnReason: 'too small',
        productName: 'Basic Widget',
        customerEmail: 'test@example.com',
        orderValue: 100
      };

      const result = await aiService.generateExchangeRecommendation(request);

      expect(result.suggestedProduct).toBe('Larger Size Basic Widget');
      expect(result.confidence).toBe(88);
      expect(result.reasoning).toContain('Size-related return');
    });

    it('should analyze different return reasons correctly', async () => {
      vi.mocked(invokeEdgeFunction).mockResolvedValue({
        success: false,
        error: 'Fallback test'
      });

      const testCases = [
        {
          reason: 'quality issues',
          expectedType: 'Premium Quality',
          expectedConfidence: 92
        },
        {
          reason: 'wrong color',
          expectedType: 'Alternative Style',
          expectedConfidence: 82
        },
        {
          reason: 'too expensive',
          expectedType: 'Budget-Friendly',
          expectedConfidence: 78
        }
      ];

      for (const testCase of testCases) {
        const request = {
          returnReason: testCase.reason,
          productName: 'Test Product',
          customerEmail: 'test@example.com',
          orderValue: 100
        };

        const result = await aiService.generateExchangeRecommendation(request);

        expect(result.suggestedProduct).toContain(testCase.expectedType);
        expect(result.confidence).toBe(testCase.expectedConfidence);
      }
    });
  });

  describe('generateAdvancedRecommendation', () => {
    it('should generate advanced recommendation', async () => {
      const mockResponse = {
        success: true,
        data: {
          type: 'exchange',
          suggestedProduct: 'Enhanced Product',
          confidence: 90,
          reasoning: 'Advanced AI analysis',
          expectedOutcome: 'Customer satisfaction',
          alternativeOptions: ['Refund', 'Store credit'],
          customerRetentionScore: 85
        }
      };

      vi.mocked(invokeEdgeFunction).mockResolvedValue(mockResponse);

      const params = {
        returnId: 'test-return-id',
        productName: 'Test Product',
        returnReason: 'Quality issue',
        customerEmail: 'test@example.com',
        orderValue: 150
      };

      const result = await aiService.generateAdvancedRecommendation(params);

      expect(result).toEqual(mockResponse.data);
      expect(invokeEdgeFunction).toHaveBeenCalledWith('generate-advanced-recommendation', params);
    });

    it('should return fallback on API failure', async () => {
      vi.mocked(invokeEdgeFunction).mockResolvedValue({
        success: false,
        error: 'API Error'
      });

      const params = {
        returnId: 'test-return-id',
        productName: 'Test Product',
        returnReason: 'Quality issue',
        customerEmail: 'test@example.com',
        orderValue: 150
      };

      const result = await aiService.generateAdvancedRecommendation(params);

      expect(result.type).toBe('exchange');
      expect(result.suggestedProduct).toBe('Enhanced Test Product');
      expect(result.confidence).toBe(75);
    });
  });

  describe('analyzeReturnRisk', () => {
    it('should analyze return risk successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          riskLevel: 'medium' as const,
          fraudProbability: 0.3,
          customerSatisfactionScore: 75,
          recommendedAction: 'investigate' as const,
          reasoning: 'Multiple recent returns'
        }
      };

      vi.mocked(invokeEdgeFunction).mockResolvedValue(mockResponse);

      const params = {
        returnId: 'test-return-id',
        productName: 'Test Product',
        returnReason: 'Defective',
        customerEmail: 'test@example.com',
        orderValue: 200
      };

      const result = await aiService.analyzeReturnRisk(params);

      expect(result).toEqual(mockResponse.data);
      expect(invokeEdgeFunction).toHaveBeenCalledWith('analyze-return-risk', params);
    });

    it('should return low-risk fallback on API failure', async () => {
      vi.mocked(invokeEdgeFunction).mockResolvedValue({
        success: false,
        error: 'API Error'
      });

      const params = {
        returnId: 'test-return-id',
        productName: 'Test Product',
        returnReason: 'Size issue',
        customerEmail: 'test@example.com',
        orderValue: 100
      };

      const result = await aiService.analyzeReturnRisk(params);

      expect(result.riskLevel).toBe('low');
      expect(result.fraudProbability).toBe(0.05);
      expect(result.recommendedAction).toBe('approve');
    });
  });
});
