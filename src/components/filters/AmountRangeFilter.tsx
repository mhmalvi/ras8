
import { Input } from "@/components/ui/input";
import { FilterState } from "@/types/FilterTypes";

interface AmountRangeFilterProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const AmountRangeFilter = ({ filters, onFiltersChange }: AmountRangeFilterProps) => {
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
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
  );
};

export default AmountRangeFilter;
