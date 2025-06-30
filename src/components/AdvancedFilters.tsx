
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { FilterState } from "@/types/FilterTypes";
import BasicFilters from "./filters/BasicFilters";
import AdvancedFiltersSection from "./filters/AdvancedFiltersSection";

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onExport: () => void;
}

const AdvancedFilters = ({ filters, onFiltersChange, onExport }: AdvancedFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      reason: 'all',
      dateRange: { from: undefined, to: undefined },
      amountRange: { min: '', max: '' },
      aiConfidence: 'all'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.reason !== 'all') count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.amountRange.min || filters.amountRange.max) count++;
    if (filters.aiConfidence !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? 'Simple' : 'Advanced'}
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <BasicFilters filters={filters} onFiltersChange={onFiltersChange} />
        {isExpanded && (
          <AdvancedFiltersSection filters={filters} onFiltersChange={onFiltersChange} />
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedFilters;
