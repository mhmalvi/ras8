
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Lightbulb, Target } from "lucide-react";

interface InsightsPanelProps {
  insights: {
    nextMonthReturns: number;
    riskFactors: string[];
    opportunities: string[];
  };
  topReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

export const InsightsPanel = ({ insights, topReasons }: InsightsPanelProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Predictive Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-800">Predicted Next Month Returns</span>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {insights.nextMonthReturns}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span>Risk Factors</span>
            </div>
            {insights.riskFactors.map((risk, index) => (
              <div key={index} className="text-sm text-slate-600 pl-6">
                • {risk}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <span>Opportunities</span>
            </div>
            {insights.opportunities.map((opportunity, index) => (
              <div key={index} className="text-sm text-slate-600 pl-6">
                • {opportunity}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span>Top Return Reasons</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topReasons.slice(0, 5).map((reason, index) => (
              <div key={index} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                <div className="flex-1">
                  <span className="text-sm font-medium capitalize">{reason.reason}</span>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(reason.percentage, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-sm font-bold">{reason.count}</div>
                  <div className="text-xs text-slate-500">{reason.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
