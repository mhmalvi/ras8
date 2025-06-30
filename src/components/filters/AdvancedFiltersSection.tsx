
import DateRangeFilter from "./DateRangeFilter";
import AmountRangeFilter from "./AmountRangeFilter";
import AIConfidenceFilter from "./AIConfidenceFilter";
import { FilterState } from "@/types/FilterTypes";

interface AdvancedFiltersSectionProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const AdvancedFiltersSection = ({ filters, onFiltersChange }: AdvancedFiltersSectionProps) => {
  return (
    <div className="space-y-4 border-t pt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DateRangeFilter filters={filters} onFiltersChange={onFiltersChange} />
        <AmountRangeFilter filters={filters} onFiltersChange={onFiltersChange} />
        <AIConfidenceFilter filters={filters} onFiltersChange={onFiltersChange} />
      </div>
    </div>
  );
};

export default AdvancedFiltersSection;
