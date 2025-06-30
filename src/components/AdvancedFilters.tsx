
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";

interface FilterState {
  search: string;
  status: string;
  reason: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  amountRange: {
    min: string;
    max: string;
  };
  aiConfidence: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onExport: () => void;
}

const AdvancedFilters = ({ filters, onFiltersChange, onExport }: AdvancedFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

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
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search orders, customers, emails..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.reason} onValueChange={(value) => updateFilter('reason', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Reasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              <SelectItem value="defective">Defective Item</SelectItem>
              <SelectItem value="wrong_size">Wrong Size</SelectItem>
              <SelectItem value="not_as_described">Not as Described</SelectItem>
              <SelectItem value="changed_mind">Changed Mind</SelectItem>
              <SelectItem value="damaged">Damaged in Transit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.from ? format(filters.dateRange.from, "MMM dd") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, from: date })}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.to ? format(filters.dateRange.to, "MMM dd") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) => updateFilter('dateRange', { ...filters.dateRange, to: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Range</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min $"
                    value={filters.amountRange.min}
                    onChange={(e) => updateFilter('amountRange', { ...filters.amountRange, min: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Max $"
                    value={filters.amountRange.max}
                    onChange={(e) => updateFilter('amountRange', { ...filters.amountRange, max: e.target.value })}
                  />
                </div>
              </div>

              {/* AI Confidence */}
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Confidence</label>
                <Select value={filters.aiConfidence} onValueChange={(value) => updateFilter('aiConfidence', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Confidence Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Confidence Levels</SelectItem>
                    <SelectItem value="high">High (90%+)</SelectItem>
                    <SelectItem value="medium">Medium (70-89%)</SelectItem>
                    <SelectItem value="low">Low (&lt;70%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedFilters;
