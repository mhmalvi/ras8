
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterState } from "@/types/FilterTypes";

interface AIConfidenceFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const AIConfidenceFilter = ({ filters, onFiltersChange }: AIConfidenceFilterProps) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
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
          <SelectItem value="low">Low (under 70%)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default AIConfidenceFilter;
